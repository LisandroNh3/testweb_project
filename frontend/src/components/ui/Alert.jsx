const ESTILOS = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

export default function Alert({ type = 'info', children, onClose, className = '' }) {
  if (!children) return null;
  return (
    <div className={`no-print flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${ESTILOS[type]} ${className}`} role="alert">
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Cerrar aviso">
          ✕
        </button>
      )}
    </div>
  );
}
