import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { optionalString } from '../../utils/validators.js';

const incluirDetalle = {
  categoria: true,
  articulo: { select: { id: true, nombre: true, unidad: true, stock: true } },
  receta: {
    include: {
      articulo: { select: { id: true, nombre: true, unidad: true, stock: true, costoUnitario: true } },
    },
    orderBy: { id: 'asc' },
  },
};

export function listar({ categoriaId, tipo, activo, q } = {}) {
  return prisma.producto.findMany({
    where: {
      ...(categoriaId ? { categoriaId: Number(categoriaId) } : {}),
      ...(tipo ? { tipo } : {}),
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: incluirDetalle,
    orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
  });
}

export async function obtener(id) {
  const producto = await prisma.producto.findUnique({ where: { id }, include: incluirDetalle });
  if (!producto) throw notFound('Producto');
  return producto;
}

async function validarArticulos(cliente, { tipo, articuloId, receta = [] }) {
  if (tipo === 'REVENTA') {
    const articulo = await cliente.articuloInventario.findUnique({ where: { id: Number(articuloId) } });
    if (!articulo || articulo.tipo !== 'REVENTA') {
      throw new AppError('El artículo vinculado debe existir y ser de tipo REVENTA', 400);
    }
  }
  if (receta.length > 0) {
    const ids = receta.map((r) => Number(r.articuloId));
    const encontrados = await cliente.articuloInventario.findMany({
      where: { id: { in: ids }, tipo: 'MATERIA_PRIMA' },
      select: { id: true },
    });
    if (encontrados.length !== ids.length) {
      throw new AppError('Todos los ingredientes deben ser artículos de materia prima existentes', 400);
    }
  }
}

const datosProducto = (d) => ({
  nombre: d.nombre.trim(),
  descripcion: optionalString(d.descripcion),
  precio: Number(d.precio),
  tipo: d.tipo,
  categoriaId: Number(d.categoriaId),
  articuloId: d.tipo === 'REVENTA' ? Number(d.articuloId) : null,
});

const datosReceta = (receta = []) =>
  receta.map((r) => ({ articuloId: Number(r.articuloId), cantidad: Number(r.cantidad) }));

export async function crear(datos) {
  const receta = datos.tipo === 'ELABORADO' ? (datos.receta ?? []) : [];
  await validarArticulos(prisma, { ...datos, receta });
  const producto = await prisma.producto.create({
    data: { ...datosProducto(datos), receta: { create: datosReceta(receta) } },
  });
  return obtener(producto.id);
}

export async function actualizar(id, datos) {
  const actual = await obtener(id);
  const receta = datos.tipo === 'ELABORADO' ? datos.receta : [];
  await validarArticulos(prisma, { ...datos, receta: receta ?? [] });

  await prisma.$transaction(async (tx) => {
    await tx.producto.update({ where: { id }, data: datosProducto(datos) });
    const cambiaReceta = receta !== undefined || actual.tipo !== datos.tipo;
    if (cambiaReceta) {
      await tx.recetaDetalle.deleteMany({ where: { productoId: id } });
      if (receta?.length) {
        await tx.recetaDetalle.createMany({
          data: datosReceta(receta).map((r) => ({ ...r, productoId: id })),
        });
      }
    }
  });
  return obtener(id);
}

export async function actualizarReceta(id, receta) {
  const producto = await obtener(id);
  if (producto.tipo !== 'ELABORADO') {
    throw new AppError('Solo los productos elaborados tienen receta', 400);
  }
  await validarArticulos(prisma, { tipo: 'ELABORADO', receta });
  await prisma.$transaction([
    prisma.recetaDetalle.deleteMany({ where: { productoId: id } }),
    prisma.recetaDetalle.createMany({
      data: datosReceta(receta).map((r) => ({ ...r, productoId: id })),
    }),
  ]);
  return obtener(id);
}

export async function cambiarEstado(id, activo) {
  await obtener(id);
  return prisma.producto.update({ where: { id }, data: { activo: Boolean(activo) } });
}

export const listarCategorias = () =>
  prisma.categoria.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { productos: true } } },
  });

export const crearCategoria = ({ nombre }) =>
  prisma.categoria.create({ data: { nombre: nombre.trim() } });
