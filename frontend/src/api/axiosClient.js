import axios from 'axios';

const TOKEN_KEY = 'coffeeclick_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Devuelve directamente `data` de la respuesta { success, data } y normaliza los errores.
api.interceptors.response.use(
  (response) => response.data?.data,
  (error) => {
    const status = error.response?.status;
    let message = error.response?.data?.message;
    if (!message) {
      message = !error.response
        ? 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo.'
        : 'Ocurrió un error inesperado';
    }
    if (status === 401 && tokenStorage.get()) {
      window.dispatchEvent(new Event('auth:logout'));
    }
    const normalizado = new Error(message);
    normalizado.status = status;
    normalizado.errors = error.response?.data?.errors ?? [];
    return Promise.reject(normalizado);
  }
);

/** Texto del error incluyendo el detalle de validación, si existe. */
export const mensajeError = (error) =>
  error?.errors?.length ? `${error.message}: ${error.errors.join('. ')}` : (error?.message ?? 'Error');
