import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './productos.service.js';

export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listar(req.query) });
});

export const obtener = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.obtener(parseId(req.params.id, 'producto')) });
});

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const data = await service.actualizar(parseId(req.params.id, 'producto'), req.body);
  res.json({ success: true, data });
});

export const actualizarReceta = asyncHandler(async (req, res) => {
  const data = await service.actualizarReceta(parseId(req.params.id, 'producto'), req.body.receta);
  res.json({ success: true, data });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const data = await service.cambiarEstado(parseId(req.params.id, 'producto'), req.body.activo);
  res.json({ success: true, data });
});

export const listarCategorias = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listarCategorias() });
});

export const crearCategoria = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crearCategoria(req.body) });
});
