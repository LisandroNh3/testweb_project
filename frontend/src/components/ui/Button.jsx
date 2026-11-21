import Spinner from './Spinner.jsx';

const VARIANTES = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-300',
  secondary: 'bg-white text-espresso-700 border border-crema-300 hover:bg-crema-100 focus:ring-crema-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300',
  ghost: 'text-espresso-600 hover:bg-crema-200 focus:ring-crema-200',
};

const TAMANOS = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition
        focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
