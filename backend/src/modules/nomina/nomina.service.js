import { prisma } from '../../config/prisma.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, sumBy, toNumber } from '../../utils/money.js';
import { optionalString } from '../../utils/validators.js';
import { obtenerParametros } from '../../utils/parametros.js';
import { calcularDeducciones } from './deducciones.service.js';

// ─────────────── Empleados ───────────────

const datosEmpleado = (d) => ({
  nombres: d.nombres.trim(),
  apellidos: d.apellidos.trim(),
  dui: d.dui.trim(),
  nit: optionalString(d.nit),
  numeroIsss: optionalString(d.numeroIsss),
  nup: optionalString(d.nup),
  cargo: d.cargo.trim(),
  salarioMensual: round2(d.salarioMensual),
  fechaIngreso: new Date(d.fechaIngreso),
});

export const listarEmpleados = ({ activo, q } = {}) =>
  prisma.empleado.findMany({
    where: {
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(q
        ? {
            OR: [
              { nombres: { contains: q, mode: 'insensitive' } },
              { apellidos: { contains: q, mode: 'insensitive' } },
              { dui: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });

async function obtenerEmpleado(id) {
  const empleado = await prisma.empleado.findUnique({ where: { id } });
  if (!empleado) throw notFound('Empleado');
  return empleado;
}

export const crearEmpleado = (datos) => prisma.empleado.create({ data: datosEmpleado(datos) });

export async function actualizarEmpleado(id, datos) {
  await obtenerEmpleado(id);
  return prisma.empleado.update({ where: { id }, data: datosEmpleado(datos) });
}

export async function cambiarEstadoEmpleado(id, activo) {
  await obtenerEmpleado(id);
  return prisma.empleado.update({ where: { id }, data: { activo: Boolean(activo) } });
}

// ─────────────── Parámetros y tabla de Renta ───────────────

export const listarParametros = () => prisma.parametroLey.findMany({ orderBy: { clave: 'asc' } });

export async function actualizarParametro(clave, valor) {
  const existe = await prisma.parametroLey.findUnique({ where: { clave } });
  if (!existe) throw notFound('Parámetro');
  return prisma.parametroLey.update({ where: { clave }, data: { valor: Number(valor) } });
}

export const listarTramos = () =>
  prisma.tramoRenta.findMany({ where: { periodicidad: 'QUINCENAL' }, orderBy: { tramo: 'asc' } });

export async function actualizarTramo(id, d) {
  const existe = await prisma.tramoRenta.findUnique({ where: { id } });
  if (!existe) throw notFound('Tramo de renta');
  return prisma.tramoRenta.update({
    where: { id },
    data: {
      desde: Number(d.desde),
      hasta: d.hasta === null || d.hasta === '' || d.hasta === undefined ? null : Number(d.hasta),
      porcentaje: Number(d.porcentaje),
      sobreExceso: Number(d.sobreExceso),
      cuotaFija: Number(d.cuotaFija),
    },
  });
}

const tramosNumericos = (tramos) =>
  tramos.map((t) => ({
    desde: toNumber(t.desde),
    hasta: t.hasta === null ? null : toNumber(t.hasta),
    porcentaje: toNumber(t.porcentaje),
    sobreExceso: toNumber(t.sobreExceso),
    cuotaFija: toNumber(t.cuotaFija),
  }));

// ─────────────── Planillas ───────────────

const incluirPlanilla = {
  detalles: {
    include: {
      empleado: { select: { id: true, nombres: true, apellidos: true, dui: true, cargo: true, numeroIsss: true, nup: true } },
    },
    orderBy: { empleado: { apellidos: 'asc' } },
  },
};

/** Quincena 1: del 1 al 15. Quincena 2: del 16 al último día del mes. */
export function rangoQuincena(anio, mes, quincena) {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return quincena === 1
    ? { fechaInicio: new Date(Date.UTC(anio, mes - 1, 1)), fechaFin: new Date(Date.UTC(anio, mes - 1, 15)) }
    : { fechaInicio: new Date(Date.UTC(anio, mes - 1, 16)), fechaFin: new Date(Date.UTC(anio, mes - 1, ultimoDia)) };
}

const totalesPlanilla = (detalles) => ({
  totalDevengado: sumBy(detalles, (d) => d.devengado),
  totalIsss: sumBy(detalles, (d) => d.isss),
  totalAfp: sumBy(detalles, (d) => d.afp),
  totalRenta: sumBy(detalles, (d) => d.renta),
  totalLiquido: sumBy(detalles, (d) => d.liquido),
});

export const listarPlanillas = ({ anio } = {}) =>
  prisma.planilla.findMany({
    where: anio ? { anio: Number(anio) } : {},
    include: { _count: { select: { detalles: true } } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { quincena: 'desc' }],
  });

export async function obtenerPlanilla(id) {
  const planilla = await prisma.planilla.findUnique({ where: { id }, include: incluirPlanilla });
  if (!planilla) throw notFound('Planilla');
  return planilla;
}

export async function generarPlanilla({ anio, mes, quincena }) {
  const [a, m, q] = [Number(anio), Number(mes), Number(quincena)];
  const { fechaInicio, fechaFin } = rangoQuincena(a, m, q);

  const existente = await prisma.planilla.findUnique({ where: { anio_mes_quincena: { anio: a, mes: m, quincena: q } } });
  if (existente) throw new AppError('Ya existe una planilla para esa quincena', 409);

  const empleados = await prisma.empleado.findMany({
    where: { activo: true, fechaIngreso: { lte: fechaFin } },
  });
  if (empleados.length === 0) throw new AppError('No hay empleados activos para esa quincena', 409);

  const parametros = await obtenerParametros();
  const tramos = tramosNumericos(await listarTramos());

  const detalles = empleados.map((empleado) => {
    const salarioQuincenal = round2(toNumber(empleado.salarioMensual) / 2);
    const deducciones = calcularDeducciones({ devengado: salarioQuincenal }, parametros, tramos);
    return {
      empleadoId: empleado.id,
      salarioQuincenal,
      otrosIngresos: 0,
      devengado: salarioQuincenal,
      isss: deducciones.isss,
      afp: deducciones.afp,
      renta: deducciones.renta,
      otrosDescuentos: 0,
      totalDescuentos: deducciones.totalDescuentos,
      liquido: deducciones.liquido,
    };
  });

  const planilla = await prisma.planilla.create({
    data: {
      anio: a,
      mes: m,
      quincena: q,
      fechaInicio,
      fechaFin,
      ...totalesPlanilla(detalles),
      detalles: { create: detalles },
    },
  });
  return obtenerPlanilla(planilla.id);
}

async function planillaEnBorrador(id) {
  const planilla = await obtenerPlanilla(id);
  if (planilla.estado !== 'BORRADOR') {
    throw new AppError('La planilla ya fue aprobada y no puede modificarse', 409);
  }
  return planilla;
}

/** Ajusta otros ingresos / descuentos de un empleado y recalcula sus deducciones y los totales. */
export async function actualizarDetalle(planillaId, detalleId, { otrosIngresos = 0, otrosDescuentos = 0 }) {
  const planilla = await planillaEnBorrador(planillaId);
  const detalle = planilla.detalles.find((d) => d.id === detalleId);
  if (!detalle) throw notFound('Detalle de planilla');

  const parametros = await obtenerParametros();
  const tramos = tramosNumericos(await listarTramos());
  const devengado = round2(toNumber(detalle.salarioQuincenal) + Number(otrosIngresos));
  const deducciones = calcularDeducciones({ devengado, otrosDescuentos }, parametros, tramos);

  await prisma.$transaction(async (tx) => {
    await tx.planillaDetalle.update({
      where: { id: detalleId },
      data: {
        otrosIngresos: round2(otrosIngresos),
        otrosDescuentos: round2(otrosDescuentos),
        devengado,
        isss: deducciones.isss,
        afp: deducciones.afp,
        renta: deducciones.renta,
        totalDescuentos: deducciones.totalDescuentos,
        liquido: deducciones.liquido,
      },
    });
    const detalles = await tx.planillaDetalle.findMany({ where: { planillaId } });
    await tx.planilla.update({ where: { id: planillaId }, data: totalesPlanilla(detalles) });
  });
  return obtenerPlanilla(planillaId);
}

export async function aprobarPlanilla(id) {
  await planillaEnBorrador(id);
  await prisma.planilla.update({ where: { id }, data: { estado: 'APROBADA', aprobadaEn: new Date() } });
  return obtenerPlanilla(id);
}

export async function eliminarPlanilla(id) {
  await planillaEnBorrador(id);
  await prisma.planilla.delete({ where: { id } });
}
