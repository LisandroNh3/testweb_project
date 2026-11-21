import { round2 } from './money.js';

/**
 * Los precios de venta incluyen IVA. Separa el monto gravado (sin IVA) y el IVA.
 * Se usa para Factura de Consumidor Final y para Comprobante de Crédito Fiscal.
 */
export function desglosarIva(totalConIva, tasaIva) {
  const total = round2(totalConIva);
  const subtotal = round2(total / (1 + Number(tasaIva)));
  return { subtotal, iva: round2(total - subtotal), total };
}

/** Para compras con CCF: el costo viene sin IVA y se agrega el impuesto. */
export function agregarIva(subtotalSinIva, tasaIva) {
  const subtotal = round2(subtotalSinIva);
  const iva = round2(subtotal * Number(tasaIva));
  return { subtotal, iva, total: round2(subtotal + iva) };
}
