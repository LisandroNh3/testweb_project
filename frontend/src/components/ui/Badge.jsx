const COLORES = {
  gray: 'bg-stone-100 text-stone-700',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
  brand: 'bg-brand-100 text-brand-800',
  purple: 'bg-violet-100 text-violet-800',
};

export default function Badge({ color = 'gray', children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORES[color]}`}>
      {children}
    </span>
  );
}
