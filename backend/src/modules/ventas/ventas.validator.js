import {
  createValidator,
  isInteger,
  isNonEmptyArray,
  isOneOf,
  isPositive,
  isPresent,
} from '../../utils/validators.js';
import { METODOS_PAGO, TIPOS_DOCUMENTO, TIPOS_SERVICIO } from '../../utils/constants.js';

export const ventaValidator = createValidator((d, check) => {
  check(isOneOf(TIPOS_DOCUMENTO)(d.tipoDocumento), 'El tipo de documento debe ser FACTURA o CCF');
  check(isOneOf(TIPOS_SERVICIO)(d.tipoServicio), 'El tipo de servicio no es válido');
  if (d.tipoServicio === 'MESA') check(isPresent(d.mesa), 'Indique el número de mesa');

  check(isNonEmptyArray(d.items), 'El pedido debe tener al menos un producto');
  (d.items ?? []).forEach((item, i) => {
    check(isInteger(item.productoId), `Producto ${i + 1}: identificador inválido`);
    check(isInteger(item.cantidad) && Number(item.cantidad) > 0, `Producto ${i + 1}: la cantidad debe ser un entero mayor a 0`);
  });

  check(isNonEmptyArray(d.pagos), 'Debe registrar al menos un pago');
  (d.pagos ?? []).forEach((pago, i) => {
    check(isOneOf(METODOS_PAGO)(pago.metodo), `Pago ${i + 1}: método no válido`);
    check(isPositive(pago.monto), `Pago ${i + 1}: el monto debe ser mayor a 0`);
    if (pago.metodo === 'BITCOIN') {
      check(isPresent(pago.referencia), `Pago ${i + 1}: ingrese el ID de transacción de Bitcoin / Chivo Wallet`);
    }
  });

  if (d.tipoDocumento === 'CCF') {
    const cliente = d.cliente ?? {};
    check(isPresent(cliente.nombre), 'CCF: el nombre o razón social del cliente es obligatorio');
    check(isPresent(cliente.nrc), 'CCF: el NRC del cliente es obligatorio');
    check(isPresent(cliente.nit), 'CCF: el NIT del cliente es obligatorio');
    check(isPresent(cliente.giro), 'CCF: el giro del cliente es obligatorio');
  }
});

export const anularValidator = createValidator((d, check) => {
  check(isPresent(d.motivo), 'Indique el motivo de la anulación');
});
