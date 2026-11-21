import { api } from './axiosClient.js';

export const ventasApi = {
  listar: (params) => api.get('/ventas', { params }),
  obtener: (id) => api.get(`/ventas/${id}`),
  crear: (venta) => api.post('/ventas', venta),
  anular: (id, motivo) => api.patch(`/ventas/${id}/anular`, { motivo }),
  correlativos: () => api.get('/ventas/correlativos'),
};
