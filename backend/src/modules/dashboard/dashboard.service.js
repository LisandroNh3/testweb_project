import { prisma } from '../../config/prisma.js';
import { round2, sumBy } from '../../utils/money.js';
import { ROLES } from '../../utils/constants.js';
import { alertas } from '../inventario/inventario.service.js';
import { resumen as resumenCxp } from '../cuentas-por-pagar/cuentas-por-pagar.service.js';
import { turnoActual } from '../caja/caja.service.js';

const puedeVer = (rol, ...roles) => rol === ROLES.ADMIN || roles.includes(rol);

async function ventasDeHoy() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  const ventas = await prisma.venta.findMany({
    where: { createdAt: { gte: inicio }, estado: 'PAGADA' },
    include: { detalles: true },
  });

  const porProducto = ventas
    .flatMap((v) => v.detalles)
    .reduce((mapa, d) => {
      const actual = mapa.get(d.descripcion) ?? { producto: d.descripcion, cantidad: 0, total: 0 };
      return mapa.set(d.descripcion, {
        ...actual,
        cantidad: actual.cantidad + d.cantidad,
        total: round2(actual.total + Number(d.subtotal)),
      });
    }, new Map());

  const total = sumBy(ventas, (v) => v.total);
  return {
    total,
    cantidad: ventas.length,
    ticketPromedio: ventas.length ? round2(total / ventas.length) : 0,
    topProductos: [...porProducto.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5),
  };
}

export async function resumen(usuario) {
  const { rol, id } = usuario;
  const [ventas, alertasStock, cuentasPorPagar, turno] = await Promise.all([
    puedeVer(rol, ROLES.CAJERO) ? ventasDeHoy() : null,
    alertas(),
    puedeVer(rol, ROLES.BODEGA) ? resumenCxp() : null,
    puedeVer(rol, ROLES.CAJERO) ? turnoActual(id) : null,
  ]);
  return { ventas, alertasStock, cuentasPorPagar, turno };
}
