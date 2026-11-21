import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDeducciones, calcularRenta } from '../../src/modules/nomina/deducciones.service.js';

const parametros = {
  ISSS_EMPLEADO: 0.03,
  ISSS_TECHO_MENSUAL: 1000,
  AFP_EMPLEADO: 0.0725,
  AFP_TECHO_MENSUAL: 7045.06,
};

const tramos = [
  { desde: 0.01, hasta: 236.0, porcentaje: 0, sobreExceso: 0, cuotaFija: 0 },
  { desde: 236.01, hasta: 447.62, porcentaje: 0.1, sobreExceso: 236.0, cuotaFija: 8.83 },
  { desde: 447.63, hasta: 1019.05, porcentaje: 0.2, sobreExceso: 447.62, cuotaFija: 30.0 },
  { desde: 1019.06, hasta: null, porcentaje: 0.3, sobreExceso: 1019.05, cuotaFija: 144.28 },
];

test('salario quincenal bajo: ISSS 3 %, AFP 7.25 % y sin Renta', () => {
  const r = calcularDeducciones({ devengado: 182.5 }, parametros, tramos);
  assert.equal(r.isss, 5.48);
  assert.equal(r.afp, 13.23);
  assert.equal(r.renta, 0);
  assert.equal(r.liquido, 163.79);
});

test('ISSS respeta el techo de cotización ($500 por quincena)', () => {
  const r = calcularDeducciones({ devengado: 600 }, parametros, tramos);
  assert.equal(r.isss, 15);
  assert.equal(r.afp, 43.5);
});

test('Renta tramo III sobre el gravado (devengado − ISSS − AFP)', () => {
  const r = calcularDeducciones({ devengado: 600 }, parametros, tramos);
  // gravado = 600 − 15 − 43.50 = 541.50 → (541.50 − 447.62) × 20 % + 30 = 48.78
  assert.equal(r.gravado, 541.5);
  assert.equal(r.renta, 48.78);
  assert.equal(r.liquido, 492.72);
});

test('Renta tramo IV', () => {
  // (1119.05 − 1019.05) × 30 % + 144.28 = 174.28
  assert.equal(calcularRenta(1119.05, tramos), 174.28);
});

test('otros descuentos se suman al total de descuentos', () => {
  const r = calcularDeducciones({ devengado: 182.5, otrosDescuentos: 10 }, parametros, tramos);
  assert.equal(r.totalDescuentos, 28.71);
});
