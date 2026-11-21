import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

export async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  const valido = usuario && usuario.activo && (await bcrypt.compare(password, usuario.password));
  if (!valido) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  const token = jwt.sign({ sub: usuario.id, rol: usuario.rol }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  const { password: _omitida, ...datosPublicos } = usuario;
  return { token, usuario: datosPublicos };
}
