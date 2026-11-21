import { Link } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';
import { formatNumber } from '../../utils/formatters.js';
import { TIPO_ARTICULO_LABEL } from '../../utils/constants.js';

export default function StockAlert({ alertas = [], enlazar = false }) {
  if (alertas.length === 0) {
    return <p className="text-sm text-emerald-700">✔ Todo el inventario está sobre el stock mínimo.</p>;
  }
  return (
    <ul className="divide-y divide-stone-100">
      {alertas.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div>
            {enlazar ? (
              <Link to={`/inventario/kardex?articuloId=${a.id}`} className="font-medium text-brand-700 hover:underline">
                {a.nombre}
              </Link>
            ) : (
              <span className="font-medium">{a.nombre}</span>
            )}
            <p className="text-xs text-stone-500">{TIPO_ARTICULO_LABEL[a.tipo]}</p>
          </div>
          <div className="text-right">
            <Badge color={a.agotado ? 'red' : 'yellow'}>{a.agotado ? 'Agotado' : 'Stock bajo'}</Badge>
            <p className="mt-0.5 text-xs text-stone-500">
              {formatNumber(a.stock, 3)} / mín. {formatNumber(a.stockMinimo, 3)} {a.unidad}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
