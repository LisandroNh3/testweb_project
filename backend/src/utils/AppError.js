export class AppError extends Error {
  constructor(message, statusCode = 400, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const notFound = (entidad) => new AppError(`${entidad} no encontrado`, 404);
export const conflict = (message) => new AppError(message, 409);
