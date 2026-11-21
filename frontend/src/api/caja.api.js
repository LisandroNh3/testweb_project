import { api } from './axiosClient.js';

export const cajaApi = {
  turnoActual: () => api.get('/caja/turno-actual'),
  resumenActual: () => api.get('/caja/turno-actual/resumen'),
  pagosActuales: () => api.get('/caja/turno-actual/pagos'),
  abrir: (fondoInicial) => api.post('/caja/apertura', { fondoInicial }),
  cerrar: (datos) => api.post('/caja/cierre', datos),
  turnos: (params) => api.get('/caja/turnos', { params }),
  resumenTurno: (id) => api.get(`/caja/turnos/${id}/resumen`),
};
