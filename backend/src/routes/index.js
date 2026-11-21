import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes.js';
import { ventasRouter } from '../modules/ventas/ventas.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/ventas', ventasRouter);
