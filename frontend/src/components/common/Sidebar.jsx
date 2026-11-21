import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { MENU } from '../../utils/constants.js';
import { Marca } from './Logo.jsx';

export default function Sidebar({ abierto, onNavegar }) {
  const { tieneRol } = useAuth();

  const secciones = MENU.map((seccion) => ({
    ...seccion,
    items: seccion.items.filter((item) => tieneRol(...item.roles)),
  })).filter((seccion) => seccion.items.length > 0);

  return (
    <aside
      className={`no-print bg-granos fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-espresso-900 text-espresso-100 transition-transform lg:static lg:translate-x-0 ${
        abierto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="border-b border-espresso-700 px-5 py-4">
        <Marca claro />
      </div>
      <nav className="space-y-5 px-3 py-4">
        {secciones.map((seccion) => (
          <div key={seccion.titulo}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-oro-400/70">{seccion.titulo}</p>
            <ul className="space-y-0.5">
              {seccion.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    onClick={onNavegar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        isActive
                          ? 'bg-brand-600 font-medium text-white shadow-inner shadow-brand-900/40'
                          : 'hover:bg-espresso-800 hover:text-crema-50'
                      }`
                    }
                  >
                    <span aria-hidden="true">{item.icono}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
