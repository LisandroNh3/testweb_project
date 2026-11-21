import { createValidator, isEmail, isOneOf, isPresent } from '../../utils/validators.js';
import { ROLES } from '../../utils/constants.js';

const esRol = isOneOf(Object.values(ROLES));

export const crearUsuarioValidator = createValidator((d, check) => {
  check(isPresent(d.nombre), 'El nombre es obligatorio');
  check(isEmail(d.email), 'El correo electrónico no es válido');
  check(typeof d.password === 'string' && d.password.length >= 8, 'La contraseña debe tener al menos 8 caracteres');
  check(esRol(d.rol), 'El rol no es válido');
});

export const actualizarUsuarioValidator = createValidator((d, check) => {
  if (d.nombre !== undefined) check(isPresent(d.nombre), 'El nombre no puede estar vacío');
  if (d.email !== undefined) check(isEmail(d.email), 'El correo electrónico no es válido');
  if (d.password) check(d.password.length >= 8, 'La contraseña debe tener al menos 8 caracteres');
  if (d.rol !== undefined) check(esRol(d.rol), 'El rol no es válido');
});
