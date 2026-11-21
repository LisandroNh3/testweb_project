import { createValidator, isNonNegative } from '../../utils/validators.js';

export const aperturaValidator = createValidator((d, check) => {
  check(isNonNegative(d.fondoInicial), 'El fondo inicial debe ser un monto mayor o igual a 0');
});

export const cierreValidator = createValidator((d, check) => {
  check(isNonNegative(d.contadoEfectivo), 'Ingrese el efectivo contado');
  check(isNonNegative(d.contadoTarjeta), 'Ingrese el total de vouchers de tarjeta');
  check(isNonNegative(d.contadoBitcoin), 'Ingrese el total recibido en Bitcoin / Chivo Wallet');
});
