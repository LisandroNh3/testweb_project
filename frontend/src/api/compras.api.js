import { api } from './axiosClient.js';

export const proveedoresApi = {
  listar: (params) => api.get('/proveedores', { params }),
  crear: (datos) => api.post('/proveedores', datos),
  actualizar: (id, datos) => api.put(`/proveedores/${id}`, datos),
  cambiarEstado: (id, activo) => api.patch(`/proveedores/${id}/estado`, { activo }),
};

export const comprasApi = {
  listar: (params) => api.get('/compras', { params }),
  obtener: (id) => api.get(`/compras/${id}`),
  crear: (datos) => api.post('/compras', datos),
};

export const cuentasPorPagarApi = {
  listar: (params) => api.get('/cuentas-por-pagar', { params }),
  resumen: () => api.get('/cuentas-por-pagar/resumen'),
  abonar: (compraId, datos) => api.post(`/cuentas-por-pagar/${compraId}/abonos`, datos),
};
