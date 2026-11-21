import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { articuloValidator, ajusteValidator } from './inventario.validator.js';
import * as controller from './inventario.controller.js';

export const inventarioRouter = Router();

inventarioRouter.use(authenticate);

// Las alertas se muestran en el dashboard de cualquier rol.
inventarioRouter.get('/alertas', controller.alertas);

inventarioRouter.use(authorize(ROLES.BODEGA));
inventarioRouter.get('/articulos', controller.listar);
inventarioRouter.get('/articulos/:id', controller.obtener);
inventarioRouter.get('/articulos/:id/kardex', controller.kardex);
inventarioRouter.post('/articulos', validate(articuloValidator), controller.crear);
inventarioRouter.put('/articulos/:id', validate(articuloValidator), controller.actualizar);
inventarioRouter.post('/ajustes', validate(ajusteValidator), controller.ajustar);
