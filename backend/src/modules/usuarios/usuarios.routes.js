import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { crearUsuarioValidator, actualizarUsuarioValidator } from './usuarios.validator.js';
import * as controller from './usuarios.controller.js';

export const usuariosRouter = Router();

usuariosRouter.use(authenticate, authorize(ROLES.ADMIN));

usuariosRouter.get('/', controller.listar);
usuariosRouter.post('/', validate(crearUsuarioValidator), controller.crear);
usuariosRouter.put('/:id', validate(actualizarUsuarioValidator), controller.actualizar);
usuariosRouter.patch('/:id/estado', controller.cambiarEstado);
