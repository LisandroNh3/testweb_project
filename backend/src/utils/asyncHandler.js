// Envuelve un controlador async para que cualquier error llegue al middleware de errores.
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};
