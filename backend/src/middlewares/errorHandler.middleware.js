import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const traducirErrorPrisma = (error) => {
  switch (error.code) {
    case 'P2002':
      return new AppError(
        `Ya existe un registro con ese valor (${[].concat(error.meta?.target ?? []).join(', ')})`,
        409
      );
    case 'P2025':
      return new AppError('Registro no encontrado', 404);
    case 'P2003':
      return new AppError('El registro está relacionado con otros datos', 409);
    default:
      return null;
  }
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, _req, res, _next) => {
  let appError = error instanceof AppError ? error : null;

  if (!appError && error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = traducirErrorPrisma(error);
  }
  if (!appError && error.type === 'entity.parse.failed') {
    appError = new AppError('El cuerpo de la petición no es JSON válido', 400);
  }

  if (!appError) {
    console.error(error);
    appError = new AppError(
      env.nodeEnv === 'production' ? 'Error interno del servidor' : error.message,
      500
    );
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    code: appError.statusCode,
    ...(appError.errors ? { errors: appError.errors } : {}),
  });
};
