import { AppError } from '../../utils/AppError.js';

/**
 * Reserva el siguiente número del documento. El UPDATE ... SET actual = actual + 1
 * bloquea la fila hasta que termina la transacción, así dos cajas nunca obtienen el mismo número.
 * Si la venta falla, la transacción se revierte y el número no se consume.
 */
export async function siguienteCorrelativo(tx, tipoDocumento) {
  const correlativo = await tx.correlativo.findFirst({
    where: { tipoDocumento },
    orderBy: { id: 'asc' },
  });
  if (!correlativo) {
    throw new AppError(`No hay correlativo configurado para ${tipoDocumento}`, 409);
  }
  const actualizado = await tx.correlativo.update({
    where: { id: correlativo.id },
    data: { actual: { increment: 1 } },
  });
  return { serie: actualizado.serie, numero: actualizado.actual };
}

export const listarCorrelativos = (cliente) =>
  cliente.correlativo.findMany({ orderBy: [{ tipoDocumento: 'asc' }, { serie: 'asc' }] });
