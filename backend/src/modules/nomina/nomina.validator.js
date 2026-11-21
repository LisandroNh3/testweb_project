import {
  createValidator,
  isDate,
  isInteger,
  isNonNegative,
  isNumber,
  isOneOf,
  isPositive,
  isPresent,
} from '../../utils/validators.js';

export const empleadoValidator = createValidator((d, check) => {
  check(isPresent(d.nombres), 'Los nombres son obligatorios');
  check(isPresent(d.apellidos), 'Los apellidos son obligatorios');
  check(/^\d{8}-\d$/.test(d.dui ?? ''), 'El DUI debe tener el formato 00000000-0');
  check(isPresent(d.cargo), 'El cargo es obligatorio');
  check(isPositive(d.salarioMensual), 'El salario mensual debe ser mayor a 0');
  check(isDate(d.fechaIngreso), 'La fecha de ingreso no es válida');
});

export const planillaValidator = createValidator((d, check) => {
  check(isInteger(d.anio) && Number(d.anio) >= 2000 && Number(d.anio) <= 2100, 'El año no es válido');
  check(isInteger(d.mes) && Number(d.mes) >= 1 && Number(d.mes) <= 12, 'El mes debe estar entre 1 y 12');
  check(isOneOf([1, 2])(Number(d.quincena)), 'La quincena debe ser 1 o 2');
});

export const detallePlanillaValidator = createValidator((d, check) => {
  check(isNonNegative(d.otrosIngresos ?? 0), 'Otros ingresos no puede ser negativo');
  check(isNonNegative(d.otrosDescuentos ?? 0), 'Otros descuentos no puede ser negativo');
});

export const parametroValidator = createValidator((d, check) => {
  check(isNonNegative(d.valor), 'El valor debe ser un número mayor o igual a 0');
});

export const tramoValidator = createValidator((d, check) => {
  check(isNonNegative(d.desde), '"Desde" debe ser mayor o igual a 0');
  if (d.hasta !== null && d.hasta !== '' && d.hasta !== undefined) {
    check(isNumber(d.hasta) && Number(d.hasta) > Number(d.desde), '"Hasta" debe ser mayor que "desde"');
  }
  check(isNonNegative(d.porcentaje) && Number(d.porcentaje) <= 1, 'El porcentaje debe estar entre 0 y 1 (ej. 0.10)');
  check(isNonNegative(d.sobreExceso), 'El valor "sobre exceso de" no puede ser negativo');
  check(isNonNegative(d.cuotaFija), 'La cuota fija no puede ser negativa');
});
