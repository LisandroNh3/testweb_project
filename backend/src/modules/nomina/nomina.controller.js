import { asyncHandler } from '../../utils/asyncHandler.js';
import { parseId } from '../../utils/validators.js';
import * as service from './nomina.service.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

export const listarEmpleados = asyncHandler(async (req, res) => ok(res, await service.listarEmpleados(req.query)));
export const crearEmpleado = asyncHandler(async (req, res) => ok(res, await service.crearEmpleado(req.body), 201));
export const actualizarEmpleado = asyncHandler(async (req, res) =>
  ok(res, await service.actualizarEmpleado(parseId(req.params.id, 'empleado'), req.body))
);
export const cambiarEstadoEmpleado = asyncHandler(async (req, res) =>
  ok(res, await service.cambiarEstadoEmpleado(parseId(req.params.id, 'empleado'), req.body.activo))
);

export const listarParametros = asyncHandler(async (_req, res) => ok(res, await service.listarParametros()));
export const actualizarParametro = asyncHandler(async (req, res) =>
  ok(res, await service.actualizarParametro(req.params.clave, req.body.valor))
);
export const listarTramos = asyncHandler(async (_req, res) => ok(res, await service.listarTramos()));
export const actualizarTramo = asyncHandler(async (req, res) =>
  ok(res, await service.actualizarTramo(parseId(req.params.id, 'tramo'), req.body))
);

export const listarPlanillas = asyncHandler(async (req, res) => ok(res, await service.listarPlanillas(req.query)));
export const obtenerPlanilla = asyncHandler(async (req, res) =>
  ok(res, await service.obtenerPlanilla(parseId(req.params.id, 'planilla')))
);
export const generarPlanilla = asyncHandler(async (req, res) => ok(res, await service.generarPlanilla(req.body), 201));
export const actualizarDetalle = asyncHandler(async (req, res) =>
  ok(
    res,
    await service.actualizarDetalle(
      parseId(req.params.id, 'planilla'),
      parseId(req.params.detalleId, 'detalle'),
      req.body
    )
  )
);
export const aprobarPlanilla = asyncHandler(async (req, res) =>
  ok(res, await service.aprobarPlanilla(parseId(req.params.id, 'planilla')))
);
export const eliminarPlanilla = asyncHandler(async (req, res) => {
  await service.eliminarPlanilla(parseId(req.params.id, 'planilla'));
  res.status(204).end();
});
