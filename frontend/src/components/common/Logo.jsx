/** Isotipo de Coffee Click: taza color cereza con un grano de café y vapor dorado. */
export default function Logo({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Coffee Click"
    >
      <circle cx="32" cy="32" r="31" fill="#241813" />
      <path
        d="M25 13c-3 3 3 5 0 9M33 11c-3 3 3 6 0 10"
        fill="none"
        stroke="#f0cf7a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M15 26h30v8c0 9-6.7 15-15 15s-15-6-15-15z" fill="#bf4436" />
      <path d="M45 29h3a6 6 0 0 1 0 12h-4.5" fill="none" stroke="#bf4436" strokeWidth="4" />
      <ellipse cx="30" cy="51" rx="19" ry="3.5" fill="#f8f1e6" />
      <ellipse cx="30" cy="34" rx="5" ry="7" transform="rotate(25 30 34)" fill="#5a201e" />
      <path d="M27.5 29c2 2.5 2.5 7.5 5 10" fill="none" stroke="#e5978a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Marca({ claro = false, grande = false }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={grande ? 64 : 40} />
      <div className={grande ? 'text-left' : ''}>
        <p className={`font-display font-bold leading-tight ${grande ? 'text-3xl' : 'text-lg'} ${claro ? 'text-crema-50' : 'text-espresso-900'}`}>
          Coffee <span className="text-oro-400">Click</span>
        </p>
        <p className={`text-xs ${claro ? 'text-espresso-200' : 'text-espresso-500'}`}>
          {grande ? 'Cafetería salvadoreña · ERP y POS' : 'Cafetería salvadoreña'}
        </p>
      </div>
    </div>
  );
}
