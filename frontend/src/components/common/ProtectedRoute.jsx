import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LoadingBlock } from '../ui/Spinner.jsx';

export default function ProtectedRoute({ roles = [] }) {
  const { usuario, cargando, tieneRol } = useAuth();
  const location = useLocation();

  if (cargando) return <LoadingBlock label="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (!tieneRol(...roles)) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-2 text-lg font-semibold">Acceso restringido</h1>
        <p className="mt-1 text-sm text-stone-500">Su rol no tiene permiso para ver esta sección.</p>
      </div>
    );
  }
  return <Outlet />;
}
