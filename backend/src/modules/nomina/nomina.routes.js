import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import {
  empleadoValidator,
  planillaValidator,
  detallePlanillaValidator,
  parametroValidator,
  tramoValidator,
} from './nomina.validator.js';
import * as controller from './nomina.controller.js';

export const nominaRouter = Router();

nominaRouter.use(authenticate, authorize(ROLES.RRHH));

nominaRouter.get('/empleados', controller.listarEmpleados);
nominaRouter.post('/empleados', validate(empleadoValidator), controller.crearEmpleado);
nominaRouter.put('/empleados/:id', validate(empleadoValidator), controller.actualizarEmpleado);
nominaRouter.patch('/empleados/:id/estado', controller.cambiarEstadoEmpleado);

nominaRouter.get('/parametros', controller.listarParametros);
nominaRouter.put('/parametros/:clave', authorize(ROLES.ADMIN), validate(parametroValidator), controller.actualizarParametro);
nominaRouter.get('/tramos-renta', controller.listarTramos);
nominaRouter.put('/tramos-renta/:id', authorize(ROLES.ADMIN), validate(tramoValidator), controller.actualizarTramo);

nominaRouter.get('/planillas', controller.listarPlanillas);
nominaRouter.get('/planillas/:id', controller.obtenerPlanilla);
nominaRouter.post('/planillas', validate(planillaValidator), controller.generarPlanilla);
nominaRouter.put('/planillas/:id/detalles/:detalleId', validate(detallePlanillaValidator), controller.actualizarDetalle);
nominaRouter.patch('/planillas/:id/aprobar', controller.aprobarPlanilla);
nominaRouter.delete('/planillas/:id', controller.eliminarPlanilla);
