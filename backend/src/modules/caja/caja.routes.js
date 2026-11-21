import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { aperturaValidator, cierreValidator } from './caja.validator.js';
import * as controller from './caja.controller.js';

export const cajaRouter = Router();

cajaRouter.use(authenticate, authorize(ROLES.CAJERO));

cajaRouter.get('/turno-actual', controller.turnoActual);
cajaRouter.get('/turno-actual/resumen', controller.resumenActual);
cajaRouter.get('/turno-actual/pagos', controller.pagosActuales);
cajaRouter.post('/apertura', validate(aperturaValidator), controller.abrir);
cajaRouter.post('/cierre', validate(cierreValidator), controller.cerrar);
cajaRouter.get('/turnos', controller.listarTurnos);
cajaRouter.get('/turnos/:id/resumen', controller.resumenTurno);
