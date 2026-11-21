import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './compras.service.js';

export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listar(req.query) });
});

export const obtener = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.obtener(parseId(req.params.id, 'compra')) });
});

export const crear = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.crear(req.body, req.user.id) });
});
