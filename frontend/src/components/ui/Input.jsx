import { useId } from 'react';

// Si no se recibe `id`, se genera uno para que la etiqueta quede asociada al control.
const useFieldId = (id) => {
  const generado = useId();
  return id ?? generado;
};

export default function Input({ label, error, hint, id, className = '', ...props }) {
  const inputId = useFieldId(id);
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <input id={inputId} className={`input ${error ? 'border-red-400' : ''}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, id, className = '', children, ...props }) {
  const selectId = useFieldId(id);
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <select id={selectId} className="input" {...props}>
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, id, className = '', ...props }) {
  const textareaId = useFieldId(id);
  return (
    <div className={className}>
      {label && (
        <label htmlFor={textareaId} className="label">
          {label}
        </label>
      )}
      <textarea id={textareaId} rows={3} className="input" {...props} />
    </div>
  );
}
