import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { proveedorValidator } from './proveedores.validator.js';
import * as controller from './proveedores.controller.js';

export const proveedoresRouter = Router();

proveedoresRouter.use(authenticate, authorize(ROLES.BODEGA));

proveedoresRouter.get('/', controller.listar);
proveedoresRouter.get('/:id', controller.obtener);
proveedoresRouter.post('/', validate(proveedorValidator), controller.crear);
proveedoresRouter.put('/:id', validate(proveedorValidator), controller.actualizar);
proveedoresRouter.patch('/:id/estado', controller.cambiarEstado);
