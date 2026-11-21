import { AppError } from './AppError.js';

export const isPresent = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export const isNumber = (v) => isPresent(v) && Number.isFinite(Number(v));
export const isPositive = (v) => isNumber(v) && Number(v) > 0;
export const isNonNegative = (v) => isNumber(v) && Number(v) >= 0;
export const isInteger = (v) => isNumber(v) && Number.isInteger(Number(v));
export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isDate = (v) => isPresent(v) && !Number.isNaN(new Date(v).getTime());
export const isOneOf = (lista) => (v) => lista.includes(v);
export const isNonEmptyArray = (v) => Array.isArray(v) && v.length > 0;

/**
 * Crea un validador. `reglas` recibe los datos y una función `check(condicion, mensaje)`;
 * el validador devuelve el arreglo de mensajes de error (vacío si todo es válido).
 */
export const createValidator = (reglas) => (data) => {
  const errores = [];
  const check = (condicion, mensaje) => {
    if (!condicion) errores.push(mensaje);
  };
  reglas(data ?? {}, check);
  return errores;
};

export const parseId = (valor, entidad = 'registro') => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Identificador de ${entidad} inválido`, 400);
  }
  return id;
};

export const optionalString = (valor) => (isPresent(valor) ? String(valor).trim() : null);
