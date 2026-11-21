import { createValidator, isEmail, isInteger, isPresent } from '../../utils/validators.js';

export const proveedorValidator = createValidator((d, check) => {
  check(isPresent(d.nombre), 'El nombre del proveedor es obligatorio');
  if (isPresent(d.email)) check(isEmail(d.email), 'El correo electrónico no es válido');
  if (isPresent(d.diasCredito)) {
    check(isInteger(d.diasCredito) && Number(d.diasCredito) >= 0, 'Los días de crédito deben ser un entero mayor o igual a 0');
  }
});
