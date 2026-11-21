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
import AperturaCaja from '../pages/caja/AperturaCaja.jsx';
import Cobros from '../pages/caja/Cobros.jsx';
import CierreCaja from '../pages/caja/CierreCaja.jsx';
import Recetas from '../pages/inventario/Recetas.jsx';
import MateriaPrima from '../pages/inventario/MateriaPrima.jsx';
import Reventa from '../pages/inventario/Reventa.jsx';
import Kardex from '../pages/inventario/Kardex.jsx';
import Proveedores from '../pages/compras/Proveedores.jsx';
import FacturasCompra from '../pages/compras/FacturasCompra.jsx';
import CuentasPorPagar from '../pages/compras/CuentasPorPagar.jsx';
import Empleados from '../pages/nomina/Empleados.jsx';
import Planillas from '../pages/nomina/Planillas.jsx';
import PlanillaDetalle from '../pages/nomina/PlanillaDetalle.jsx';
import Boletas from '../pages/nomina/Boletas.jsx';
import Parametros from '../pages/nomina/Parametros.jsx';
import Usuarios from '../pages/usuarios/Usuarios.jsx';
import NotFound from '../pages/NotFound.jsx';

const { ADMIN, CAJERO, BODEGA, RRHH } = ROLES;

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
            <Route path="/caja" element={<AperturaCaja />} />
            <Route path="/caja/cobros" element={<Cobros />} />
            <Route path="/caja/cierre" element={<CierreCaja />} />
          </Route>

          <Route element={<ProtectedRoute roles={[BODEGA]} />}>
            <Route path="/inventario/productos" element={<Recetas />} />
            <Route path="/inventario/materia-prima" element={<MateriaPrima />} />
            <Route path="/inventario/reventa" element={<Reventa />} />
            <Route path="/inventario/kardex" element={<Kardex />} />
            <Route path="/compras/proveedores" element={<Proveedores />} />
            <Route path="/compras/facturas" element={<FacturasCompra />} />
            <Route path="/compras/cuentas-por-pagar" element={<CuentasPorPagar />} />
          </Route>

          <Route element={<ProtectedRoute roles={[RRHH]} />}>
            <Route path="/nomina/empleados" element={<Empleados />} />
            <Route path="/nomina/planillas" element={<Planillas />} />
            <Route path="/nomina/planillas/:id" element={<PlanillaDetalle />} />
            <Route path="/nomina/boletas" element={<Boletas />} />
            <Route path="/nomina/parametros" element={<Parametros />} />
          </Route>

          <Route element={<ProtectedRoute roles={[ADMIN]} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
