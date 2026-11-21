import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { compraValidator } from './compras.validator.js';
import * as controller from './compras.controller.js';

export const comprasRouter = Router();

comprasRouter.use(authenticate, authorize(ROLES.BODEGA));

comprasRouter.get('/', controller.listar);
comprasRouter.get('/:id', controller.obtener);
comprasRouter.post('/', validate(compraValidator), controller.crear);
