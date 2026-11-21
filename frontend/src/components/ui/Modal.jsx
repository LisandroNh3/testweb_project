import { useEffect } from 'react';

const ANCHOS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const alPresionar = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-espresso-950/60 p-4 sm:items-center">
      <div className={`card w-full ${ANCHOS[size]} my-8`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-crema-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-espresso-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-crema-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
