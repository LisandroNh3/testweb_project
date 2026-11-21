import { api } from './axiosClient.js';

export const nominaApi = {
  empleados: (params) => api.get('/nomina/empleados', { params }),
  crearEmpleado: (datos) => api.post('/nomina/empleados', datos),
  actualizarEmpleado: (id, datos) => api.put(`/nomina/empleados/${id}`, datos),
  cambiarEstadoEmpleado: (id, activo) => api.patch(`/nomina/empleados/${id}/estado`, { activo }),

  parametros: () => api.get('/nomina/parametros'),
  actualizarParametro: (clave, valor) => api.put(`/nomina/parametros/${clave}`, { valor }),
  tramos: () => api.get('/nomina/tramos-renta'),
  actualizarTramo: (id, datos) => api.put(`/nomina/tramos-renta/${id}`, datos),

  planillas: (params) => api.get('/nomina/planillas', { params }),
  planilla: (id) => api.get(`/nomina/planillas/${id}`),
  generarPlanilla: (datos) => api.post('/nomina/planillas', datos),
  actualizarDetalle: (id, detalleId, datos) => api.put(`/nomina/planillas/${id}/detalles/${detalleId}`, datos),
  aprobarPlanilla: (id) => api.patch(`/nomina/planillas/${id}/aprobar`),
  eliminarPlanilla: (id) => api.delete(`/nomina/planillas/${id}`),
};
