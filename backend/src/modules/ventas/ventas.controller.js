import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './ventas.service.js';

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body, req.user.id) });
});

export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listar(req.query) });
});

export const obtener = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.obtener(parseId(req.params.id, 'venta')) });
});

export const anular = asyncHandler(async (req, res) => {
  const data = await service.anular(parseId(req.params.id, 'venta'), req.body.motivo, req.user.id);
  res.json({ success: true, data });
});

export const correlativos = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.correlativos() });
});
