import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desglosarIva, agregarIva } from '../../src/utils/fiscal.js';
import { calcularConsumos } from '../../src/modules/inventario/receta.service.js';

test('desglosarIva separa el 13 % de un precio con IVA incluido', () => {
  assert.deepEqual(desglosarIva(11.3, 0.13), { subtotal: 10, iva: 1.3, total: 11.3 });
});

test('desglosarIva mantiene subtotal + iva = total con redondeo a centavos', () => {
  const { subtotal, iva, total } = desglosarIva(7.25, 0.13);
  assert.equal(subtotal, 6.42);
  assert.equal(iva, 0.83);
  assert.equal(Math.round((subtotal + iva) * 100) / 100, total);
});

test('agregarIva suma el 13 % a una compra con CCF', () => {
  assert.deepEqual(agregarIva(100, 0.13), { subtotal: 100, iva: 13, total: 113 });
});

test('calcularConsumos multiplica la receta y agrupa artículos repetidos', () => {
  const cafeConLeche = { tipo: 'ELABORADO', nombre: 'Café con leche', receta: [{ articuloId: 1, cantidad: '0.25' }, { articuloId: 2, cantidad: '0.05' }] };
  const otra = { tipo: 'ELABORADO', nombre: 'Otra', receta: [{ articuloId: 1, cantidad: '0.5' }] };
  const soda = { tipo: 'REVENTA', nombre: 'Soda', articuloId: 9 };

  const consumos = calcularConsumos([
    { producto: cafeConLeche, cantidad: 4 },
    { producto: otra, cantidad: 1 },
    { producto: soda, cantidad: 2 },
  ]);

  assert.deepEqual(consumos, [
    { articuloId: 1, cantidad: 1.5 },
    { articuloId: 2, cantidad: 0.2 },
    { articuloId: 9, cantidad: 2 },
  ]);
});

test('calcularConsumos rechaza un producto de reventa sin artículo vinculado', () => {
  assert.throws(() => calcularConsumos([{ producto: { tipo: 'REVENTA', nombre: 'X' }, cantidad: 1 }]), /no tiene artículo/);
});
