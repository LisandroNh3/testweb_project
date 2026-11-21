import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './inventario.service.js';

export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listar(req.query) });
});

export const obtener = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.obtener(parseId(req.params.id, 'artículo')) });
});

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body, req.user.id) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const data = await service.actualizar(parseId(req.params.id, 'artículo'), req.body);
  res.json({ success: true, data });
});

export const ajustar = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.ajustar(req.body, req.user.id) });
});

export const kardex = asyncHandler(async (req, res) => {
  const data = await service.kardex(parseId(req.params.id, 'artículo'), req.query);
  res.json({ success: true, data });
});

export const alertas = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.alertas() });
});
