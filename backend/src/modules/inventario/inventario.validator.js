import {
  createValidator,
  isInteger,
  isNonNegative,
  isOneOf,
  isPositive,
  isPresent,
} from '../../utils/validators.js';
import { TIPOS_ARTICULO, TIPOS_AJUSTE } from '../../utils/constants.js';

export const articuloValidator = createValidator((d, check) => {
  check(isPresent(d.nombre), 'El nombre es obligatorio');
  check(isOneOf(TIPOS_ARTICULO)(d.tipo), 'El tipo debe ser MATERIA_PRIMA o REVENTA');
  check(isPresent(d.unidad), 'La unidad de medida es obligatoria');
  check(isNonNegative(d.stockMinimo ?? 0), 'El stock mínimo no puede ser negativo');
  check(isNonNegative(d.costoUnitario ?? 0), 'El costo unitario no puede ser negativo');
  if (d.stockInicial !== undefined) {
    check(isNonNegative(d.stockInicial), 'El stock inicial no puede ser negativo');
  }
});

export const ajusteValidator = createValidator((d, check) => {
  check(isInteger(d.articuloId), 'El artículo es obligatorio');
  check(isOneOf(TIPOS_AJUSTE)(d.tipo), 'El tipo debe ser ENTRADA, MERMA o AJUSTE');
  if (d.tipo === 'AJUSTE') {
    check(isNonNegative(d.cantidad), 'El stock contado no puede ser negativo');
  } else {
    check(isPositive(d.cantidad), 'La cantidad debe ser mayor a 0');
  }
  check(isPresent(d.motivo), 'El motivo es obligatorio');
});
