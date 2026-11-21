import { createValidator, isEmail, isPresent } from '../../utils/validators.js';

export const loginValidator = createValidator((d, check) => {
  check(isEmail(d.email), 'El correo electrónico no es válido');
  check(isPresent(d.password), 'La contraseña es obligatoria');
});
