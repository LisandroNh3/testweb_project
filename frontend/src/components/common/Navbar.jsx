import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { ROL_LABEL } from '../../utils/constants.js';
import Button from '../ui/Button.jsx';

export default function Navbar({ onToggleMenu }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-crema-200 bg-crema-50/90 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onToggleMenu}
        className="rounded-md p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
        aria-label="Abrir menú"
      >
        ☰
      </button>
      <div className="hidden text-sm text-stone-500 lg:block">
        {new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-stone-800">{usuario?.nombre}</p>
          <p className="text-xs text-stone-500">{ROL_LABEL[usuario?.rol]}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={salir}>
          Salir
        </Button>
      </div>
    </header>
  );
}
