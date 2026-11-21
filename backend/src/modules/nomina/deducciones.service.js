import { round2 } from '../../utils/money.js';

/**
 * Busca el tramo de la tabla de retención de Renta que corresponde al salario gravado.
 * @param {number} gravado
 * @param {Array<{desde:number, hasta:number|null, porcentaje:number, sobreExceso:number, cuotaFija:number}>} tramos
 */
export const buscarTramo = (gravado, tramos) =>
  [...tramos]
    .sort((a, b) => Number(a.desde) - Number(b.desde))
    .find((t) => gravado >= Number(t.desde) - 0.005 && (t.hasta === null || gravado <= Number(t.hasta) + 0.005));

/** Retención de Renta: (gravado − sobre exceso) × porcentaje + cuota fija. */
export function calcularRenta(gravado, tramos) {
  const tramo = buscarTramo(gravado, tramos);
  if (!tramo || Number(tramo.porcentaje) === 0) return 0;
  return round2((gravado - Number(tramo.sobreExceso)) * Number(tramo.porcentaje) + Number(tramo.cuotaFija));
}

/**
 * Deducciones de ley para una quincena en El Salvador.
 * - ISSS laboral: 3 % hasta el techo de cotización (techo mensual / 2 por quincena).
 * - AFP laboral: 7.25 % hasta el techo de cotización (techo mensual / 2 por quincena).
 * - Renta: tabla quincenal aplicada sobre devengado − ISSS − AFP.
 */
export function calcularDeducciones({ devengado, otrosDescuentos = 0 }, parametros, tramos) {
  const baseIsss = Math.min(devengado, parametros.ISSS_TECHO_MENSUAL / 2);
  const baseAfp = Math.min(devengado, parametros.AFP_TECHO_MENSUAL / 2);

  const isss = round2(baseIsss * parametros.ISSS_EMPLEADO);
  const afp = round2(baseAfp * parametros.AFP_EMPLEADO);
  const gravado = round2(devengado - isss - afp);
  const renta = calcularRenta(gravado, tramos);

  const totalDescuentos = round2(isss + afp + renta + Number(otrosDescuentos));
  return {
    isss,
    afp,
    gravado,
    renta,
    totalDescuentos,
    liquido: round2(devengado - totalDescuentos),
  };
}
