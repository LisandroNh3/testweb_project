import { useMemo, useState } from 'react';
import { round2 } from '../utils/formatters.js';

/** Estado del pedido en el POS. */
export function useCart() {
  const [items, setItems] = useState([]);

  const agregar = (producto) =>
    setItems((actuales) =>
      actuales.some((i) => i.producto.id === producto.id)
        ? actuales.map((i) => (i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : [...actuales, { producto, cantidad: 1 }]
    );

  const cambiarCantidad = (productoId, cantidad) =>
    setItems((actuales) =>
      cantidad <= 0
        ? actuales.filter((i) => i.producto.id !== productoId)
        : actuales.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
    );

  const quitar = (productoId) => setItems((actuales) => actuales.filter((i) => i.producto.id !== productoId));

  const limpiar = () => setItems([]);

  const resumen = useMemo(
    () => ({
      total: round2(items.reduce((acc, i) => acc + Number(i.producto.precio) * i.cantidad, 0)),
      unidades: items.reduce((acc, i) => acc + i.cantidad, 0),
    }),
    [items]
  );

  return { items, agregar, cambiarCantidad, quitar, limpiar, ...resumen };
}
