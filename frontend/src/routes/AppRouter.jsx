import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { ROLES } from '../utils/constants.js';

import Login from '../pages/auth/Login.jsx';
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import POS from '../pages/ventas/POS.jsx';
import HistorialVentas from '../pages/ventas/HistorialVentas.jsx';
import DetalleDocumento from '../pages/ventas/DetalleDocumento.jsx';
import NotFound from '../pages/NotFound.jsx';

const { CAJERO } = ROLES;

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route element={<ProtectedRoute roles={[CAJERO]} />}>
            <Route path="/ventas/pos" element={<POS />} />
            <Route path="/ventas" element={<HistorialVentas />} />
            <Route path="/ventas/:id" element={<DetalleDocumento />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
