export const ROLES = { ADMIN: 'ADMIN', CAJERO: 'CAJERO', BODEGA: 'BODEGA', RRHH: 'RRHH' };

export const ROL_LABEL = {
  ADMIN: 'Administrador',
  CAJERO: 'Cajero',
  BODEGA: 'Bodega y compras',
  RRHH: 'Recursos humanos',
};

export const TIPO_DOCUMENTO_LABEL = { FACTURA: 'Factura consumidor final', CCF: 'Comprobante de crédito fiscal' };
export const TIPO_DOCUMENTO_CORTO = { FACTURA: 'Factura', CCF: 'CCF' };
export const TIPO_SERVICIO_LABEL = { MESA: 'Mesa', LLEVAR: 'Para llevar', DOMICILIO: 'Domicilio' };
export const METODO_PAGO_LABEL = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', BITCOIN: 'Bitcoin / Chivo' };
export const TIPO_ARTICULO_LABEL = { MATERIA_PRIMA: 'Materia prima', REVENTA: 'Reventa' };
export const TIPO_PRODUCTO_LABEL = { ELABORADO: 'Elaborado (receta)', REVENTA: 'Reventa' };
export const TIPO_MOVIMIENTO_LABEL = { ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste', MERMA: 'Merma' };
export const CONDICION_LABEL = { CONTADO: 'Contado', CREDITO: 'Crédito' };

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const EMPRESA = {
  nombre: 'Coffee Click',
  razonSocial: 'Coffee Click, S.A. de C.V.',
  giro: 'Cafetería y venta de pan dulce',
  nit: '0614-000000-000-0',
  nrc: '000000-0',
  direccion: 'San Salvador, El Salvador',
};

const { ADMIN, CAJERO, BODEGA, RRHH } = ROLES;

/** Menú lateral: cada sección se muestra si el usuario tiene alguno de los roles. */
export const MENU = [
  { titulo: 'General', items: [{ to: '/', label: 'Inicio', icono: '🏠', roles: [] }] },
  {
    titulo: 'Ventas',
    items: [
      { to: '/ventas/pos', label: 'Punto de venta', icono: '🧾', roles: [CAJERO] },
      { to: '/ventas', label: 'Historial de ventas', icono: '📋', roles: [CAJERO] },
    ],
  },
  {
    titulo: 'Caja',
    items: [
      { to: '/caja', label: 'Apertura y turnos', icono: '💵', roles: [CAJERO] },
      { to: '/caja/cobros', label: 'Cobros del turno', icono: '💳', roles: [CAJERO] },
      { to: '/caja/cierre', label: 'Cierre y cuadre', icono: '🔒', roles: [CAJERO] },
    ],
  },
  {
    titulo: 'Inventario',
    items: [
      { to: '/inventario/productos', label: 'Menú y recetas', icono: '☕', roles: [BODEGA] },
      { to: '/inventario/materia-prima', label: 'Materia prima', icono: '🫘', roles: [BODEGA] },
      { to: '/inventario/reventa', label: 'Pan dulce y reventa', icono: '🥐', roles: [BODEGA] },
      { to: '/inventario/kardex', label: 'Kardex', icono: '📦', roles: [BODEGA] },
    ],
  },
  {
    titulo: 'Compras',
    items: [
      { to: '/compras/proveedores', label: 'Proveedores', icono: '🚚', roles: [BODEGA] },
      { to: '/compras/facturas', label: 'Facturas de compra', icono: '🧮', roles: [BODEGA] },
      { to: '/compras/cuentas-por-pagar', label: 'Cuentas por pagar', icono: '📆', roles: [BODEGA] },
    ],
  },
  {
    titulo: 'Nómina',
    items: [
      { to: '/nomina/empleados', label: 'Empleados', icono: '👥', roles: [RRHH] },
      { to: '/nomina/planillas', label: 'Planillas', icono: '🗂️', roles: [RRHH] },
      { to: '/nomina/boletas', label: 'Boletas de pago', icono: '✉️', roles: [RRHH] },
      { to: '/nomina/parametros', label: 'Parámetros de ley', icono: '⚖️', roles: [RRHH] },
    ],
  },
  { titulo: 'Administración', items: [{ to: '/usuarios', label: 'Usuarios', icono: '🔑', roles: [ADMIN] }] },
];
