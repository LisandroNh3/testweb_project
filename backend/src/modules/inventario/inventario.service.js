import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round3, toNumber } from '../../utils/money.js';

export function listar({ tipo, q, activo } = {}) {
  return prisma.articuloInventario.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function obtener(id) {
  const articulo = await prisma.articuloInventario.findUnique({ where: { id } });
  if (!articulo) throw notFound('Artículo');
  return articulo;
}

/** Registra un movimiento y deja el stock en `stockNuevo`. Debe ejecutarse dentro de una transacción. */
export async function registrarMovimiento(tx, { articulo, tipo, cantidad, stockNuevo, ...extra }) {
  await tx.articuloInventario.update({ where: { id: articulo.id }, data: { stock: stockNuevo } });
  return tx.movimientoInventario.create({
    data: {
      articuloId: articulo.id,
      tipo,
      cantidad,
      stockAnterior: articulo.stock,
      stockNuevo,
      ...extra,
    },
  });
}

/**
 * Descuenta existencias de forma atómica: el UPDATE solo se aplica si hay stock suficiente,
 * por lo que dos ventas simultáneas no pueden dejar el inventario en negativo.
 */
export async function descontarStock(tx, consumos, { referencia, ventaId, usuarioId }) {
  for (const { articuloId, cantidad } of consumos) {
    const { count } = await tx.articuloInventario.updateMany({
      where: { id: articuloId, stock: { gte: cantidad } },
      data: { stock: { decrement: cantidad } },
    });
    const articulo = await tx.articuloInventario.findUnique({ where: { id: articuloId } });
    if (count === 0) {
      throw new AppError(
        `Stock insuficiente de "${articulo?.nombre ?? articuloId}": disponible ${toNumber(articulo?.stock)} ${articulo?.unidad ?? ''}, requerido ${cantidad}`,
        409
      );
    }
    await tx.movimientoInventario.create({
      data: {
        articuloId,
        tipo: 'SALIDA',
        cantidad: -cantidad,
        stockAnterior: round3(toNumber(articulo.stock) + cantidad),
        stockNuevo: articulo.stock,
        referencia,
        ventaId,
        usuarioId,
      },
    });
  }
}

export async function crear(datos, usuarioId) {
  const stockInicial = round3(datos.stockInicial ?? 0);
  return prisma.$transaction(async (tx) => {
    const articulo = await tx.articuloInventario.create({
      data: {
        nombre: datos.nombre.trim(),
        tipo: datos.tipo,
        unidad: datos.unidad.trim(),
        stockMinimo: Number(datos.stockMinimo ?? 0),
        costoUnitario: Number(datos.costoUnitario ?? 0),
      },
    });
    if (stockInicial > 0) {
      await registrarMovimiento(tx, {
        articulo,
        tipo: 'ENTRADA',
        cantidad: stockInicial,
        stockNuevo: stockInicial,
        referencia: 'Stock inicial',
        usuarioId,
      });
    }
    return tx.articuloInventario.findUnique({ where: { id: articulo.id } });
  });
}

// El stock no se edita aquí: solo cambia mediante ventas, compras o ajustes con su movimiento.
export async function actualizar(id, datos) {
  await obtener(id);
  return prisma.articuloInventario.update({
    where: { id },
    data: {
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      unidad: datos.unidad.trim(),
      stockMinimo: Number(datos.stockMinimo ?? 0),
      costoUnitario: Number(datos.costoUnitario ?? 0),
      ...(datos.activo !== undefined ? { activo: Boolean(datos.activo) } : {}),
    },
  });
}

export async function ajustar({ articuloId, tipo, cantidad, motivo }, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const articulo = await tx.articuloInventario.findUnique({ where: { id: Number(articuloId) } });
    if (!articulo) throw notFound('Artículo');

    const stockActual = toNumber(articulo.stock);
    const valor = round3(cantidad);
    const calculos = {
      ENTRADA: () => stockActual + valor,
      MERMA: () => stockActual - valor,
      AJUSTE: () => valor,
    };
    const stockNuevo = round3(calculos[tipo]());
    if (stockNuevo < 0) {
      throw new AppError(`La merma supera el stock disponible (${stockActual} ${articulo.unidad})`, 409);
    }

    await registrarMovimiento(tx, {
      articulo,
      tipo,
      cantidad: round3(stockNuevo - stockActual),
      stockNuevo,
      referencia: motivo.trim(),
      usuarioId,
    });
    return tx.articuloInventario.findUnique({ where: { id: articulo.id } });
  });
}

export async function kardex(articuloId, { desde, hasta } = {}) {
  const articulo = await obtener(articuloId);
  const movimientos = await prisma.movimientoInventario.findMany({
    where: {
      articuloId,
      createdAt: {
        ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
        ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}),
      },
    },
    include: { usuario: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return { articulo, movimientos };
}

export async function alertas() {
  const articulos = await prisma.articuloInventario.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  return articulos
    .filter((a) => toNumber(a.stock) <= toNumber(a.stockMinimo))
    .map((a) => ({
      ...a,
      faltante: round3(toNumber(a.stockMinimo) - toNumber(a.stock)),
      agotado: toNumber(a.stock) <= 0,
    }));
}
