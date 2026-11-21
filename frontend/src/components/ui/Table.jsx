/**
 * Tabla genérica.
 * columns: [{ key, header, render?: (fila) => node, className? }]
 */
export default function Table({ columns, data = [], rowKey = 'id', emptyMessage = 'Sin registros', footer, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-crema-200 text-sm">
        <thead className="bg-crema-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-espresso-500 ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-crema-100 bg-white/70">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-stone-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((fila) => (
              <tr
                key={typeof rowKey === 'function' ? rowKey(fila) : fila[rowKey]}
                onClick={onRowClick ? () => onRowClick(fila) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-brand-50' : 'hover:bg-crema-100'}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`whitespace-nowrap px-3 py-2 ${col.className ?? ''}`}>
                    {col.render ? col.render(fila) : fila[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && <tfoot className="bg-crema-100 font-semibold">{footer}</tfoot>}
      </table>
    </div>
  );
}
