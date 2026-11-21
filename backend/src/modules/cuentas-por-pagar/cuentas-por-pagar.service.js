import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, sumBy, toNumber } from '../../utils/money.js';
import { optionalString } from '../../utils/validators.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const inicioDeHoyUTC = () => {
  const hoy = new Date();
  return Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

/** Agrega a cada cuenta los días para vencer (negativo = días de atraso). */
const conVencimiento = (compra) => {
  const diasParaVencer = compra.fechaVencimiento
    ? Math.round((new Date(compra.fechaVencimiento).getTime() - inicioDeHoyUTC()) / MS_POR_DIA)
    : null;
  return { ...compra, diasParaVencer, vencida: diasParaVencer !== null && diasParaVencer < 0 };
};

export async function listarPendientes({ proveedorId, soloVencidas } = {}) {
  const compras = await prisma.compra.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'PARCIAL'] },
      ...(proveedorId ? { proveedorId: Number(proveedorId) } : {}),
    },
    include: {
      proveedor: { select: { id: true, nombre: true } },
      abonos: { orderBy: { fecha: 'asc' } },
    },
    orderBy: { fechaVencimiento: 'asc' },
  });
  const cuentas = compras.map(conVencimiento);
  return soloVencidas === 'true' ? cuentas.filter((c) => c.vencida) : cuentas;
}

export async function resumen() {
  const cuentas = await listarPendientes();
  const vencidas = cuentas.filter((c) => c.vencida);

  const porProveedor = Object.values(
    cuentas.reduce((grupos, cuenta) => {
      const clave = cuenta.proveedor.id;
      const actual = grupos[clave] ?? { proveedor: cuenta.proveedor, cuentas: 0, saldo: 0 };
      return {
        ...grupos,
        [clave]: { ...actual, cuentas: actual.cuentas + 1, saldo: round2(actual.saldo + toNumber(cuenta.saldo)) },
      };
    }, {})
  ).sort((a, b) => b.saldo - a.saldo);

  return {
    totalPendiente: sumBy(cuentas, (c) => c.saldo),
    totalVencido: sumBy(vencidas, (c) => c.saldo),
    cantidadCuentas: cuentas.length,
    cantidadVencidas: vencidas.length,
    porProveedor,
  };
}

export async function abonar(compraId, { monto, metodo, referencia }, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.findUnique({ where: { id: compraId } });
    if (!compra) throw notFound('Compra');
    if (compra.estado === 'PAGADA') throw new AppError('Esta cuenta ya está pagada', 409);

    const saldoActual = toNumber(compra.saldo);
    const abono = round2(monto);
    if (abono - saldoActual > 0.005) {
      throw new AppError(`El abono ($${abono.toFixed(2)}) supera el saldo pendiente ($${saldoActual.toFixed(2)})`, 400);
    }

    const saldo = round2(saldoActual - abono);
    await tx.abonoCompra.create({
      data: { compraId, monto: abono, metodo, referencia: optionalString(referencia), usuarioId },
    });
    return tx.compra.update({
      where: { id: compraId },
      data: { saldo, estado: saldo <= 0 ? 'PAGADA' : 'PARCIAL' },
      include: { proveedor: { select: { id: true, nombre: true } }, abonos: { orderBy: { fecha: 'asc' } } },
    });
  });
}
