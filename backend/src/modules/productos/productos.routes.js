import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { ROLES } from '../../utils/constants.js';
import { productoValidator, recetaValidator, categoriaValidator } from './productos.validator.js';
import * as controller from './productos.controller.js';

export const productosRouter = Router();
const gestion = authorize(ROLES.BODEGA);

productosRouter.use(authenticate);

productosRouter.get('/categorias', controller.listarCategorias);
productosRouter.post('/categorias', gestion, validate(categoriaValidator), controller.crearCategoria);

productosRouter.get('/', controller.listar);
productosRouter.get('/:id', controller.obtener);
productosRouter.post('/', gestion, validate(productoValidator), controller.crear);
productosRouter.put('/:id', gestion, validate(productoValidator), controller.actualizar);
productosRouter.put('/:id/receta', gestion, validate(recetaValidator), controller.actualizarReceta);
productosRouter.patch('/:id/estado', gestion, controller.cambiarEstado);
