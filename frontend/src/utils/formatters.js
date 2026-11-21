const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const formatMoney = (valor) => moneda.format(Number(valor ?? 0));

export const formatNumber = (valor, decimales = 2) =>
  Number(valor ?? 0).toLocaleString('es-SV', { minimumFractionDigits: 0, maximumFractionDigits: decimales });

export const formatDate = (valor) =>
  valor ? new Date(valor).toLocaleDateString('es-SV', { timeZone: 'UTC' }) : '—';

export const formatDateLocal = (valor) => (valor ? new Date(valor).toLocaleDateString('es-SV') : '—');

export const formatDateTime = (valor) =>
  valor
    ? new Date(valor).toLocaleString('es-SV', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

/** Fecha local de hoy en formato YYYY-MM-DD para inputs type="date". */
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const toInputDate = (valor) => (valor ? new Date(valor).toISOString().slice(0, 10) : '');

export const desglosarIva = (total, tasa = 0.13) => {
  const subtotal = round2(total / (1 + tasa));
  return { subtotal, iva: round2(total - subtotal), total: round2(total) };
};
