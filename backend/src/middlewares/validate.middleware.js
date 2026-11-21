import { AppError } from '../utils/AppError.js';

export const validate =
  (validador, origen = 'body') =>
  (req, _res, next) => {
    const errores = validador(req[origen]);
    if (errores.length > 0) {
      return next(new AppError('Datos inválidos', 400, errores));
    }
    next();
  };
