import { prisma } from '../config/prisma.js';
import { PARAMETROS_DEFECTO } from './constants.js';

/** Devuelve los parámetros de ley como objeto { CLAVE: numero }, con valores por defecto. */
export async function obtenerParametros(cliente = prisma) {
  const registros = await cliente.parametroLey.findMany();
  return registros.reduce(
    (acumulado, { clave, valor }) => ({ ...acumulado, [clave]: Number(valor) }),
    { ...PARAMETROS_DEFECTO }
  );
}
