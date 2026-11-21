import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './caja.service.js';

export const turnoActual = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.turnoActual(req.user.id) });
});

export const abrir = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await service.abrir(req.body, req.user.id) });
});

export const resumenActual = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.resumenActual(req.user.id) });
});

export const pagosActuales = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.pagosActuales(req.user.id) });
});

export const cerrar = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.cerrar(req.body, req.user.id) });
});

export const listarTurnos = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.listarTurnos(req.user, req.query) });
});

export const resumenTurno = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.resumen(parseId(req.params.id, 'turno')) });
});
