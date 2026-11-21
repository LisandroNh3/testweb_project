import {
  createValidator,
  isDate,
  isInteger,
  isNonEmptyArray,
  isNonNegative,
  isOneOf,
  isPositive,
  isPresent,
} from '../../utils/validators.js';
import { CONDICIONES_COMPRA, TIPOS_DOCUMENTO } from '../../utils/constants.js';

export const compraValidator = createValidator((d, check) => {
  check(isInteger(d.proveedorId), 'El proveedor es obligatorio');
  check(isOneOf(TIPOS_DOCUMENTO)(d.tipoDocumento), 'El tipo de documento debe ser FACTURA o CCF');
  check(isPresent(d.numeroDocumento), 'El número de documento es obligatorio');
  check(isDate(d.fechaEmision), 'La fecha de emisión no es válida');
  check(isOneOf(CONDICIONES_COMPRA)(d.condicion), 'La condición debe ser CONTADO o CREDITO');
  if (isPresent(d.fechaVencimiento)) {
    check(isDate(d.fechaVencimiento), 'La fecha de vencimiento no es válida');
  }

  check(isNonEmptyArray(d.detalles), 'La compra debe tener al menos un artículo');
  (d.detalles ?? []).forEach((linea, i) => {
    check(isInteger(linea.articuloId), `Línea ${i + 1}: artículo inválido`);
    check(isPositive(linea.cantidad), `Línea ${i + 1}: la cantidad debe ser mayor a 0`);
    check(isNonNegative(linea.costoUnitario), `Línea ${i + 1}: el costo unitario no puede ser negativo`);
  });
});
