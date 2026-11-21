import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './usuarios.service.js';

export const listar = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.listar() });
});

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body) });
});

export const actualizar = asyncHandler(async (req, res) => {
  const data = await service.actualizar(parseId(req.params.id, 'usuario'), req.body);
  res.json({ success: true, data });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const data = await service.cambiarEstado(parseId(req.params.id, 'usuario'), req.body.activo, req.user.id);
  res.json({ success: true, data });
});
