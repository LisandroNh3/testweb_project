import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { abonoValidator } from './cuentas-por-pagar.validator.js';
import * as controller from './cuentas-por-pagar.controller.js';

export const cuentasPorPagarRouter = Router();

cuentasPorPagarRouter.use(authenticate, authorize(ROLES.BODEGA));

cuentasPorPagarRouter.get('/', controller.listar);
cuentasPorPagarRouter.get('/resumen', controller.resumen);
cuentasPorPagarRouter.post('/:compraId/abonos', validate(abonoValidator), controller.abonar);
