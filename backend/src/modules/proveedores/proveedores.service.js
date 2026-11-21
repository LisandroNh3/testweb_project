import { prisma } from '../../config/prisma.js';
import { notFound } from '../../utils/AppError.js';
import { optionalString } from '../../utils/validators.js';

const datosProveedor = (d) => ({
  nombre: d.nombre.trim(),
  nit: optionalString(d.nit),
  nrc: optionalString(d.nrc),
  telefono: optionalString(d.telefono),
  email: optionalString(d.email),
  direccion: optionalString(d.direccion),
  diasCredito: Number(d.diasCredito ?? 0),
});

export const listar = ({ activo, q } = {}) =>
  prisma.proveedor.findMany({
    where: {
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(q ? { nombre: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { nombre: 'asc' },
  });

export async function obtener(id) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) throw notFound('Proveedor');
  return proveedor;
}

export const crear = (datos) => prisma.proveedor.create({ data: datosProveedor(datos) });

export async function actualizar(id, datos) {
  await obtener(id);
  return prisma.proveedor.update({ where: { id }, data: datosProveedor(datos) });
}

export async function cambiarEstado(id, activo) {
  await obtener(id);
  return prisma.proveedor.update({ where: { id }, data: { activo: Boolean(activo) } });
}
