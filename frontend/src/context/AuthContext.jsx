import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api.js';
import { tokenStorage } from '../api/axiosClient.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
  }, []);

  useEffect(() => {
    const restaurarSesion = async () => {
      if (!tokenStorage.get()) {
        setCargando(false);
        return;
      }
      try {
        setUsuario(await authApi.me());
      } catch {
        tokenStorage.clear();
      } finally {
        setCargando(false);
      }
    };
    restaurarSesion();
  }, []);

  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { token, usuario: datos } = await authApi.login(email, password);
    tokenStorage.set(token);
    setUsuario(datos);
    return datos;
  }, []);

  const tieneRol = useCallback(
    (...roles) => Boolean(usuario) && (usuario.rol === 'ADMIN' || roles.length === 0 || roles.includes(usuario.rol)),
    [usuario]
  );

  const valor = useMemo(
    () => ({ usuario, cargando, login, logout, tieneRol }),
    [usuario, cargando, login, logout, tieneRol]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
