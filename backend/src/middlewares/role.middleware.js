import { AppError } from '../utils/AppError.js';
import { ROLES } from '../utils/constants.js';

// El ADMIN siempre tiene acceso. Sin roles listados, basta con estar autenticado.
export const authorize =
  (...rolesPermitidos) =>
  (req, _res, next) => {
    const { rol } = req.user ?? {};
    const permitido =
      rol === ROLES.ADMIN || rolesPermitidos.length === 0 || rolesPermitidos.includes(rol);
    if (!permitido) {
      return next(new AppError('No tiene permisos para esta acción', 403));
    }
    next();
  };
