import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes.js';
import { productosRouter } from '../modules/productos/productos.routes.js';
import { inventarioRouter } from '../modules/inventario/inventario.routes.js';
import { ventasRouter } from '../modules/ventas/ventas.routes.js';
import { cajaRouter } from '../modules/caja/caja.routes.js';
import { proveedoresRouter } from '../modules/proveedores/proveedores.routes.js';
import { comprasRouter } from '../modules/compras/compras.routes.js';
import { cuentasPorPagarRouter } from '../modules/cuentas-por-pagar/cuentas-por-pagar.routes.js';
import { nominaRouter } from '../modules/nomina/nomina.routes.js';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);
apiRouter.use('/productos', productosRouter);
apiRouter.use('/inventario', inventarioRouter);
apiRouter.use('/ventas', ventasRouter);
apiRouter.use('/caja', cajaRouter);
apiRouter.use('/proveedores', proveedoresRouter);
apiRouter.use('/compras', comprasRouter);
apiRouter.use('/cuentas-por-pagar', cuentasPorPagarRouter);
apiRouter.use('/nomina', nominaRouter);
apiRouter.use('/dashboard', dashboardRouter);
