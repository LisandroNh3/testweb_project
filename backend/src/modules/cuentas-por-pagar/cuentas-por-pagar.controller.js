import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './cuentas-por-pagar.service.js';

export const listar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listarPendientes(req.query) });
});

export const resumen = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.resumen() });
});

export const abonar = asyncHandler(async (req, res) => {
  const data = await service.abonar(parseId(req.params.compraId, 'compra'), req.body, req.user.id);
  res.status(201).json({ success: true, data });
});
