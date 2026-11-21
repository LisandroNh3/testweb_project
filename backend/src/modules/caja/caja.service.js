import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, sumBy, toNumber } from '../../utils/money.js';
import { METODOS_PAGO, ROLES, formatearNumeroDocumento } from '../../utils/constants.js';
import { optionalString } from '../../utils/validators.js';

const incluirUsuario = { usuario: { select: { id: true, nombre: true } } };

export const turnoActual = (usuarioId) =>
  prisma.turnoCaja.findFirst({
    where: { usuarioId, estado: 'ABIERTO' },
    include: incluirUsuario,
  });

async function turnoAbiertoObligatorio(usuarioId) {
  const turno = await turnoActual(usuarioId);
  if (!turno) throw new AppError('No tiene un turno de caja abierto', 404);
  return turno;
}

export async function abrir({ fondoInicial }, usuarioId) {
  const abierto = await turnoActual(usuarioId);
  if (abierto) throw new AppError('Ya tiene un turno de caja abierto', 409);
  return prisma.turnoCaja.create({
    data: { usuarioId, fondoInicial: round2(fondoInicial) },
    include: incluirUsuario,
  });
}

/** Totales cobrados por método de pago en un turno (solo ventas no anuladas). */
export async function resumen(turnoId) {
  const turno = await prisma.turnoCaja.findUnique({ where: { id: turnoId }, include: incluirUsuario });
  if (!turno) throw notFound('Turno de caja');

  const ventas = await prisma.venta.findMany({
    where: { turnoId },
    include: { pagos: true },
  });
  const pagadas = ventas.filter((v) => v.estado === 'PAGADA');
  const pagos = pagadas.flatMap((v) => v.pagos);

  const porMetodo = METODOS_PAGO.reduce(
    (acumulado, metodo) => ({
      ...acumulado,
      [metodo]: sumBy(pagos.filter((p) => p.metodo === metodo), (p) => p.monto),
    }),
    {}
  );

  const fondoInicial = toNumber(turno.fondoInicial);
  return {
    turno,
    cantidadVentas: pagadas.length,
    cantidadAnuladas: ventas.length - pagadas.length,
    totalVendido: sumBy(pagadas, (v) => v.total),
    porMetodo,
    esperado: {
      EFECTIVO: round2(fondoInicial + porMetodo.EFECTIVO),
      TARJETA: porMetodo.TARJETA,
      BITCOIN: porMetodo.BITCOIN,
    },
  };
}

export async function resumenActual(usuarioId) {
  const turno = await turnoAbiertoObligatorio(usuarioId);
  return resumen(turno.id);
}

export async function pagosActuales(usuarioId) {
  const turno = await turnoAbiertoObligatorio(usuarioId);
  const ventas = await prisma.venta.findMany({
    where: { turnoId: turno.id },
    include: { pagos: true },
    orderBy: { createdAt: 'desc' },
  });
  return ventas.flatMap((venta) =>
    venta.pagos.map((pago) => ({
      ...pago,
      fecha: venta.createdAt,
      estadoVenta: venta.estado,
      ventaId: venta.id,
      numeroDocumento: formatearNumeroDocumento(venta.tipoDocumento, venta.serie, venta.numero),
    }))
  );
}

/** Cierra el turno comparando lo esperado por el sistema contra lo contado físicamente. */
export async function cerrar(datos, usuarioId) {
  const turno = await turnoAbiertoObligatorio(usuarioId);
  const { esperado } = await resumen(turno.id);

  const contado = {
    EFECTIVO: round2(datos.contadoEfectivo),
    TARJETA: round2(datos.contadoTarjeta),
    BITCOIN: round2(datos.contadoBitcoin),
  };
  const diferencia = round2(
    METODOS_PAGO.reduce((total, metodo) => total + (contado[metodo] - esperado[metodo]), 0)
  );

  await prisma.turnoCaja.update({
    where: { id: turno.id },
    data: {
      estado: 'CERRADO',
      cerradoEn: new Date(),
      esperadoEfectivo: esperado.EFECTIVO,
      esperadoTarjeta: esperado.TARJETA,
      esperadoBitcoin: esperado.BITCOIN,
      contadoEfectivo: contado.EFECTIVO,
      contadoTarjeta: contado.TARJETA,
      contadoBitcoin: contado.BITCOIN,
      diferencia,
      observaciones: optionalString(datos.observaciones),
    },
  });
  return resumen(turno.id);
}

export function listarTurnos(usuario, { desde, hasta } = {}) {
  return prisma.turnoCaja.findMany({
    where: {
      ...(usuario.rol === ROLES.ADMIN ? {} : { usuarioId: usuario.id }),
      abiertoEn: {
        ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}),
        ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}),
      },
    },
    include: incluirUsuario,
    orderBy: { abiertoEn: 'desc' },
    take: 200,
  });
}
