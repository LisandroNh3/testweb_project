import { Outlet } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';

export default function AuthLayout() {
  return (
    <div className="bg-granos flex min-h-screen items-center justify-center bg-gradient-to-br from-espresso-950 via-espresso-800 to-brand-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size={80} className="mx-auto drop-shadow-xl" />
          <h1 className="mt-3 font-display text-4xl font-bold text-crema-50">
            Coffee <span className="text-oro-400">Click</span>
          </h1>
          <p className="mt-1 text-espresso-200">Cafetería salvadoreña · ERP y punto de venta</p>
        </div>
        <Outlet />
        <p className="mt-6 text-center text-xs text-espresso-300">Café de altura, pan dulce y buena plática ☕</p>
      </div>
    </div>
  );
}
