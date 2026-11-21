import { round3 } from '../../utils/money.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Calcula cuánto inventario consume un pedido.
 * - Producto ELABORADO: cada ingrediente de la receta × cantidad vendida.
 * - Producto REVENTA: 1 unidad del artículo vinculado por cada unidad vendida.
 * Devuelve [{ articuloId, cantidad }] con los consumos agregados por artículo.
 *
 * @param {Array<{ producto: object, cantidad: number }>} lineas
 */
export function calcularConsumos(lineas) {
  const consumos = lineas.reduce((mapa, { producto, cantidad }) => {
    const agregar = (articuloId, porUnidad) =>
      mapa.set(articuloId, round3((mapa.get(articuloId) ?? 0) + Number(porUnidad) * cantidad));

    if (producto.tipo === 'REVENTA') {
      if (!producto.articuloId) {
        throw new AppError(`El producto "${producto.nombre}" no tiene artículo de inventario vinculado`, 409);
      }
      agregar(producto.articuloId, 1);
    } else {
      (producto.receta ?? []).forEach((ingrediente) =>
        agregar(ingrediente.articuloId, ingrediente.cantidad)
      );
    }
    return mapa;
  }, new Map());

  return [...consumos.entries()].map(([articuloId, cantidad]) => ({ articuloId, cantidad }));
}
