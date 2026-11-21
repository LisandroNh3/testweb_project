import { createValidator, isOneOf, isPositive } from '../../utils/validators.js';
import { METODOS_PAGO } from '../../utils/constants.js';

export const abonoValidator = createValidator((d, check) => {
  check(isPositive(d.monto), 'El monto del abono debe ser mayor a 0');
  check(isOneOf(METODOS_PAGO)(d.metodo), 'El método de pago no es válido');
});
