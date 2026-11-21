import {
  createValidator,
  isInteger,
  isOneOf,
  isPositive,
  isPresent,
} from '../../utils/validators.js';
import { TIPOS_PRODUCTO } from '../../utils/constants.js';

const validarReceta = (receta, check) => {
  check(Array.isArray(receta), 'La receta debe ser una lista de ingredientes');
  if (!Array.isArray(receta)) return;
  receta.forEach((ingrediente, i) => {
    check(isInteger(ingrediente.articuloId), `Ingrediente ${i + 1}: artículo inválido`);
    check(isPositive(ingrediente.cantidad), `Ingrediente ${i + 1}: la cantidad debe ser mayor a 0`);
  });
  const ids = receta.map((ingrediente) => Number(ingrediente.articuloId));
  check(new Set(ids).size === ids.length, 'La receta tiene ingredientes repetidos');
};

export const productoValidator = createValidator((d, check) => {
  check(isPresent(d.nombre), 'El nombre es obligatorio');
  check(isPositive(d.precio), 'El precio debe ser mayor a 0');
  check(isOneOf(TIPOS_PRODUCTO)(d.tipo), 'El tipo debe ser ELABORADO o REVENTA');
  check(isInteger(d.categoriaId), 'La categoría es obligatoria');
  if (d.tipo === 'REVENTA') {
    check(isInteger(d.articuloId), 'Un producto de reventa debe estar vinculado a un artículo de inventario');
  }
  if (d.tipo === 'ELABORADO' && d.receta !== undefined) validarReceta(d.receta, check);
});

export const recetaValidator = createValidator((d, check) => validarReceta(d.receta, check));

export const categoriaValidator = createValidator((d, check) => {
  check(isPresent(d.nombre), 'El nombre de la categoría es obligatorio');
});
