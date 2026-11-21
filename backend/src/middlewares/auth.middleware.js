import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [esquema, token] = header.split(' ');
    if (esquema !== 'Bearer' || !token) {
      throw new AppError('Debe iniciar sesión', 401);
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError('Sesión inválida o expirada', 401);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
    if (!usuario || !usuario.activo) {
      throw new AppError('Usuario inactivo o inexistente', 401);
    }

    req.user = usuario;
    next();
  } catch (error) {
    next(error);
  }
};
