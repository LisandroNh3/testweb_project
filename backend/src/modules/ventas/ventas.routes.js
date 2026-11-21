import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { ventaValidator, anularValidator } from './ventas.validator.js';
import * as controller from './ventas.controller.js';

export const ventasRouter = Router();

ventasRouter.use(authenticate, authorize(ROLES.CAJERO));

ventasRouter.get('/correlativos', controller.correlativos);
ventasRouter.get('/', controller.listar);
ventasRouter.get('/:id', controller.obtener);
ventasRouter.post('/', validate(ventaValidator), controller.crear);
ventasRouter.patch('/:id/anular', authorize(ROLES.ADMIN), validate(anularValidator), controller.anular);
