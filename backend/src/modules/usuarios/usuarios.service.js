import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';

const camposPublicos = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  createdAt: true,
};

export const listar = () =>
  prisma.usuario.findMany({ select: camposPublicos, orderBy: { nombre: 'asc' } });

export async function crear({ nombre, email, password, rol }) {
  return prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      rol,
    },
    select: camposPublicos,
  });
}

export async function actualizar(id, { nombre, email, password, rol }) {
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw notFound('Usuario');

  return prisma.usuario.update({
    where: { id },
    data: {
      ...(nombre ? { nombre: nombre.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      ...(rol ? { rol } : {}),
    },
    select: camposPublicos,
  });
}

export async function cambiarEstado(id, activo, usuarioActualId) {
  if (id === usuarioActualId && !activo) {
    throw new AppError('No puede desactivar su propio usuario', 400);
  }
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw notFound('Usuario');
  return prisma.usuario.update({ where: { id }, data: { activo: Boolean(activo) }, select: camposPublicos });
}
