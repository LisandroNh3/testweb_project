import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, round3, sumBy, toNumber } from '../../utils/money.js';
import { agregarIva } from '../../utils/fiscal.js';
import { obtenerParametros } from '../../utils/parametros.js';
import { registrarMovimiento } from '../inventario/inventario.service.js';

const incluirDetalle = {
  proveedor: { select: { id: true, nombre: true, nit: true, nrc: true } },
  detalles: { include: { articulo: { select: { id: true, nombre: true, unidad: true } } } },
  abonos: { orderBy: { fecha: 'asc' } },
  usuario: { select: { id: true, nombre: true } },
};

const sumarDias = (fecha, dias) => {
  const resultado = new Date(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
};

export const listar = ({ proveedorId, estado, desde, hasta } = {}) =>
  prisma.compra.findMany({
    where: {
      ...(proveedorId ? { proveedorId: Number(proveedorId) } : {}),
      ...(estado ? { estado } : {}),
      fechaEmision: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      },
    },
    include: incluirDetalle,
    orderBy: [{ fechaEmision: 'desc' }, { id: 'desc' }],
    take: 500,
  });

export async function obtener(id) {
  const compra = await prisma.compra.findUnique({ where: { id }, include: incluirDetalle });
  if (!compra) throw notFound('Compra');
  return compra;
}

/**
 * Registra la factura del proveedor, aumenta el inventario y recalcula el costo
 * promedio ponderado de cada artículo. Con CCF el costo es sin IVA y se agrega el 13 %;
 * con Factura de Consumidor Final el costo ya incluye IVA y no genera crédito fiscal.
 */
export async function crear(datos, usuarioId) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id: Number(datos.proveedorId) } });
  if (!proveedor || !proveedor.activo) throw new AppError('El proveedor no existe o está inactivo', 400);

  const lineas = datos.detalles.map((l) => ({
    articuloId: Number(l.articuloId),
    cantidad: round3(l.cantidad),
    costoUnitario: Number(l.costoUnitario),
    subtotal: round2(Number(l.cantidad) * Number(l.costoUnitario)),
  }));

  const { IVA } = await obtenerParametros();
  const base = sumBy(lineas, (l) => l.subtotal);
  const totales = datos.tipoDocumento === 'CCF' ? agregarIva(base, IVA) : { subtotal: base, iva: 0, total: base };

  const fechaEmision = new Date(datos.fechaEmision);
  const esCredito = datos.condicion === 'CREDITO';
  const fechaVencimiento = esCredito
    ? datos.fechaVencimiento
      ? new Date(datos.fechaVencimiento)
      : sumarDias(fechaEmision, proveedor.diasCredito)
    : null;

  const compra = await prisma.$transaction(async (tx) => {
    const nueva = await tx.compra.create({
      data: {
        proveedorId: proveedor.id,
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento: datos.numeroDocumento.trim(),
        fechaEmision,
        fechaVencimiento,
        condicion: datos.condicion,
        ...totales,
        saldo: esCredito ? totales.total : 0,
        estado: esCredito ? 'PENDIENTE' : 'PAGADA',
        usuarioId,
        detalles: { create: lineas },
      },
    });

    for (const linea of lineas) {
      const articulo = await tx.articuloInventario.findUnique({ where: { id: linea.articuloId } });
      if (!articulo) throw new AppError(`Artículo ${linea.articuloId} no encontrado`, 404);

      const stockActual = toNumber(articulo.stock);
      const stockNuevo = round3(stockActual + linea.cantidad);
      const costoPromedio =
        stockNuevo > 0
          ? (Math.max(stockActual, 0) * toNumber(articulo.costoUnitario) + linea.cantidad * linea.costoUnitario) /
            (Math.max(stockActual, 0) + linea.cantidad)
          : linea.costoUnitario;

      await tx.articuloInventario.update({
        where: { id: articulo.id },
        data: { costoUnitario: Math.round(costoPromedio * 10000) / 10000 },
      });
      await registrarMovimiento(tx, {
        articulo,
        tipo: 'ENTRADA',
        cantidad: linea.cantidad,
        stockNuevo,
        referencia: `Compra ${datos.tipoDocumento} ${nueva.numeroDocumento} - ${proveedor.nombre}`,
        compraId: nueva.id,
        usuarioId,
      });
    }
    return nueva;
  });

  return obtener(compra.id);
}
