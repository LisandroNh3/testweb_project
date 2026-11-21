import { api } from './axiosClient.js';

export const inventarioApi = {
  listar: (params) => api.get('/inventario/articulos', { params }),
  obtener: (id) => api.get(`/inventario/articulos/${id}`),
  crear: (datos) => api.post('/inventario/articulos', datos),
  actualizar: (id, datos) => api.put(`/inventario/articulos/${id}`, datos),
  ajustar: (datos) => api.post('/inventario/ajustes', datos),
  kardex: (id, params) => api.get(`/inventario/articulos/${id}/kardex`, { params }),
  alertas: () => api.get('/inventario/alertas'),
};

export const productosApi = {
  listar: (params) => api.get('/productos', { params }),
  obtener: (id) => api.get(`/productos/${id}`),
  crear: (datos) => api.post('/productos', datos),
  actualizar: (id, datos) => api.put(`/productos/${id}`, datos),
  cambiarEstado: (id, activo) => api.patch(`/productos/${id}/estado`, { activo }),
  categorias: () => api.get('/productos/categorias'),
  crearCategoria: (nombre) => api.post('/productos/categorias', { nombre }),
};
