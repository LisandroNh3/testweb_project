import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, round3, sumBy, toNumber } from '../../utils/money.js';
import { desglosarIva } from '../../utils/fiscal.js';
import { optionalString } from '../../utils/validators.js';
import { formatearNumeroDocumento } from '../../utils/constants.js';
import { obtenerParametros } from '../../utils/parametros.js';
import { calcularConsumos } from '../inventario/receta.service.js';
import { descontarStock } from '../inventario/inventario.service.js';
import { siguienteCorrelativo, listarCorrelativos } from './correlativo.service.js';

const incluirDetalle = {
  detalles: { orderBy: { id: 'asc' } },
  pagos: true,
  usuario: { select: { id: true, nombre: true } },
};

const conNumero = (venta) => ({
  ...venta,
  numeroDocumento: formatearNumeroDocumento(venta.tipoDocumento, venta.serie, venta.numero),
});

async function turnoAbierto(usuarioId) {
  const turno = await prisma.turnoCaja.findFirst({ where: { usuarioId, estado: 'ABIERTO' } });
  if (!turno) {
    throw new AppError('Debe abrir un turno de caja antes de registrar ventas', 409);
  }
  return turno;
}

/** Agrupa cantidades del mismo producto y arma las líneas con precio y subtotal. */
async function armarLineas(items) {
  const cantidades = items.reduce(
    (mapa, { productoId, cantidad }) =>
      mapa.set(Number(productoId), (mapa.get(Number(productoId)) ?? 0) + Number(cantidad)),
    new Map()
  );

  const productos = await prisma.producto.findMany({
    where: { id: { in: [...cantidades.keys()] } },
    include: { receta: true },
  });

  const faltantes = [...cantidades.keys()].filter((id) => !productos.some((p) => p.id === id));
  if (faltantes.length > 0) {
    throw new AppError(`Productos no encontrados: ${faltantes.join(', ')}`, 404);
  }
  const inactivos = productos.filter((p) => !p.activo).map((p) => p.nombre);
  if (inactivos.length > 0) {
    throw new AppError(`Productos no disponibles para la venta: ${inactivos.join(', ')}`, 409);
  }

  return productos.map((producto) => {
    const cantidad = cantidades.get(producto.id);
    const precioUnitario = toNumber(producto.precio);
    return { producto, cantidad, precioUnitario, subtotal: round2(precioUnitario * cantidad) };
  });
}

export async function crear(datos, usuarioId) {
  const turno = await turnoAbierto(usuarioId);
  const lineas = await armarLineas(datos.items);
  const { IVA } = await obtenerParametros();

  const totales = desglosarIva(sumBy(lineas, (l) => l.subtotal), IVA);
  const totalPagado = sumBy(datos.pagos, (p) => p.monto);
  if (Math.abs(totalPagado - totales.total) > 0.005) {
    throw new AppError(
      `Los pagos ($${totalPagado.toFixed(2)}) no coinciden con el total ($${totales.total.toFixed(2)})`,
      400
    );
  }

  const consumos = calcularConsumos(lineas);
  const cliente = datos.cliente ?? {};

  const venta = await prisma.$transaction(async (tx) => {
    const { serie, numero } = await siguienteCorrelativo(tx, datos.tipoDocumento);

    const nueva = await tx.venta.create({
      data: {
        tipoDocumento: datos.tipoDocumento,
        serie,
        numero,
        tipoServicio: datos.tipoServicio,
        mesa: optionalString(datos.mesa),
        clienteNombre: optionalString(cliente.nombre),
        clienteNit: optionalString(cliente.nit),
        clienteNrc: optionalString(cliente.nrc),
        clienteGiro: optionalString(cliente.giro),
        clienteDireccion: optionalString(cliente.direccion),
        ...totales,
        usuarioId,
        turnoId: turno.id,
        detalles: {
          create: lineas.map((l) => ({
            productoId: l.producto.id,
            descripcion: l.producto.nombre,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            subtotal: l.subtotal,
          })),
        },
        pagos: {
          create: datos.pagos.map((p) => ({
            metodo: p.metodo,
            monto: round2(p.monto),
            referencia: optionalString(p.referencia),
          })),
        },
      },
    });

    await descontarStock(tx, consumos, {
      referencia: formatearNumeroDocumento(nueva.tipoDocumento, serie, numero),
      ventaId: nueva.id,
      usuarioId,
    });

    return nueva;
  });

  return obtener(venta.id);
}

export async function listar({ desde, hasta, tipoDocumento, estado, turnoId } = {}) {
  const ventas = await prisma.venta.findMany({
    where: {
      ...(tipoDocumento ? { tipoDocumento } : {}),
      ...(estado ? { estado } : {}),
      ...(turnoId ? { turnoId: Number(turnoId) } : {}),
      createdAt: {
        ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
        ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}),
      },
    },
    include: incluirDetalle,
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return ventas.map(conNumero);
}

export async function obtener(id) {
  const venta = await prisma.venta.findUnique({ where: { id }, include: incluirDetalle });
  if (!venta) throw notFound('Venta');
  return conNumero(venta);
}

/**
 * Anula la venta conservando su número correlativo y devuelve al inventario
 * exactamente lo que se descontó (según los movimientos de la venta).
 */
export async function anular(id, motivo, usuarioId) {
  const venta = await prisma.venta.findUnique({ where: { id }, include: { turno: true } });
  if (!venta) throw notFound('Venta');
  if (venta.estado === 'ANULADA') throw new AppError('La venta ya está anulada', 409);
  if (venta.turno.estado !== 'ABIERTO') {
    throw new AppError('Solo se pueden anular ventas de un turno de caja abierto', 409);
  }

  const referencia = `Anulación ${formatearNumeroDocumento(venta.tipoDocumento, venta.serie, venta.numero)}`;

  await prisma.$transaction(async (tx) => {
    await tx.venta.update({
      where: { id },
      data: { estado: 'ANULADA', motivoAnulacion: motivo.trim() },
    });

    const salidas = await tx.movimientoInventario.findMany({ where: { ventaId: id, tipo: 'SALIDA' } });
    for (const salida of salidas) {
      const cantidad = round3(Math.abs(toNumber(salida.cantidad)));
      const articulo = await tx.articuloInventario.update({
        where: { id: salida.articuloId },
        data: { stock: { increment: cantidad } },
      });
      await tx.movimientoInventario.create({
        data: {
          articuloId: salida.articuloId,
          tipo: 'ENTRADA',
          cantidad,
          stockAnterior: round3(toNumber(articulo.stock) - cantidad),
          stockNuevo: articulo.stock,
          referencia,
          ventaId: id,
          usuarioId,
        },
      });
    }
  });

  return obtener(id);
}

export const correlativos = () => listarCorrelativos(prisma);
