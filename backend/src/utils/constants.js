export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CAJERO: 'CAJERO',
  BODEGA: 'BODEGA',
  RRHH: 'RRHH',
});

export const TIPOS_DOCUMENTO = ['FACTURA', 'CCF'];
export const TIPOS_SERVICIO = ['MESA', 'LLEVAR', 'DOMICILIO'];
export const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'BITCOIN'];
export const TIPOS_PRODUCTO = ['ELABORADO', 'REVENTA'];
export const TIPOS_ARTICULO = ['MATERIA_PRIMA', 'REVENTA'];
export const TIPOS_AJUSTE = ['ENTRADA', 'MERMA', 'AJUSTE'];
export const CONDICIONES_COMPRA = ['CONTADO', 'CREDITO'];

// Valores por defecto si la tabla parametros_ley no tiene el registro.
export const PARAMETROS_DEFECTO = Object.freeze({
  IVA: 0.13,
  ISSS_EMPLEADO: 0.03,
  ISSS_TECHO_MENSUAL: 1000,
  AFP_EMPLEADO: 0.0725,
  AFP_TECHO_MENSUAL: 7045.06,
});

export const PREFIJO_DOCUMENTO = Object.freeze({ FACTURA: 'FAC', CCF: 'CCF' });

export const formatearNumeroDocumento = (tipoDocumento, serie, numero) =>
  `${PREFIJO_DOCUMENTO[tipoDocumento]}-${serie}-${String(numero).padStart(6, '0')}`;
