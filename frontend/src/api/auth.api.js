import { api } from './axiosClient.js';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const usuariosApi = {
  listar: () => api.get('/usuarios'),
  crear: (datos) => api.post('/usuarios', datos),
  actualizar: (id, datos) => api.put(`/usuarios/${id}`, datos),
  cambiarEstado: (id, activo) => api.patch(`/usuarios/${id}/estado`, { activo }),
};

export const dashboardApi = {
  resumen: () => api.get('/dashboard/resumen'),
};
