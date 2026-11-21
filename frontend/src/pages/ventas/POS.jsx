import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productosApi } from '../../api/inventario.api.js';
import { cajaApi } from '../../api/caja.api.js';
import { ventasApi } from '../../api/ventas.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useCart } from '../../hooks/useCart.js';
import Button from '../../components/ui/Button.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { desglosarIva, formatMoney, round2 } from '../../utils/formatters.js';
import { METODO_PAGO_LABEL, TIPO_DOCUMENTO_LABEL, TIPO_SERVICIO_LABEL } from '../../utils/constants.js';

const CLIENTE_VACIO = { nombre: '', nit: '', nrc: '', giro: '', direccion: '' };

export default function POS() {
  const navigate = useNavigate();
  const carrito = useCart();
  const { data, loading, error } = useFetch(() =>
    Promise.all([productosApi.listar({ activo: 'true' }), productosApi.categorias(), cajaApi.turnoActual()])
  );
  const [productos, categorias, turno] = data ?? [[], [], null];

  const [categoriaId, setCategoriaId] = useState('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('FACTURA');
  const [tipoServicio, setTipoServicio] = useState('MESA');
  const [mesa, setMesa] = useState('');
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [cobrando, setCobrando] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [recibido, setRecibido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [ventaCreada, setVentaCreada] = useState(null);

  const visibles = useMemo(
    () =>
      productos
        .filter((p) => categoriaId === 'TODAS' || p.categoriaId === Number(categoriaId))
        .filter((p) => p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())),
    [productos, categoriaId, busqueda]
  );

  const { subtotal, iva, total } = desglosarIva(carrito.total);
  const totalPagos = round2(pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0));
  const pendiente = round2(total - totalPagos);
  const efectivo = round2(pagos.filter((p) => p.metodo === 'EFECTIVO').reduce((acc, p) => acc + Number(p.monto || 0), 0));
  const cambio = recibido ? round2(Number(recibido) - efectivo) : 0;

  if (loading) return <LoadingBlock />;
  if (error) return <Alert type="error">{error}</Alert>;

  if (!turno) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-4xl">💵</p>
        <h1 className="mt-2 text-lg font-semibold">No tiene un turno de caja abierto</h1>
        <p className="mt-1 text-sm text-stone-500">Para registrar ventas primero abra caja con su fondo inicial.</p>
        <Link to="/caja">
          <Button className="mt-4">Abrir caja</Button>
        </Link>
      </div>
    );
  }

  const abrirCobro = () => {
    setAviso(null);
    if (carrito.items.length === 0) return setAviso({ type: 'warning', text: 'Agregue productos al pedido.' });
    if (tipoServicio === 'MESA' && !mesa.trim()) return setAviso({ type: 'warning', text: 'Indique el número de mesa.' });
    if (tipoDocumento === 'CCF' && (!cliente.nombre || !cliente.nrc || !cliente.nit || !cliente.giro)) {
      return setAviso({ type: 'warning', text: 'Para CCF complete nombre, NIT, NRC y giro del cliente.' });
    }
    setPagos([{ metodo: 'EFECTIVO', monto: total.toFixed(2), referencia: '' }]);
    setRecibido('');
    setCobrando(true);
  };

  const cambiarPago = (indice, campo, valor) =>
    setPagos((actuales) => actuales.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)));

  const agregarPago = () =>
    setPagos((actuales) => [...actuales, { metodo: 'TARJETA', monto: Math.max(pendiente, 0).toFixed(2), referencia: '' }]);

  const confirmarVenta = async () => {
    setEnviando(true);
    setAviso(null);
    try {
      const venta = await ventasApi.crear({
        tipoDocumento,
        tipoServicio,
        mesa: tipoServicio === 'MESA' ? mesa : null,
        cliente: tipoDocumento === 'CCF' ? cliente : undefined,
        items: carrito.items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        pagos: pagos.map((p) => ({ ...p, monto: Number(p.monto) })),
      });
      setVentaCreada({ ...venta, cambio: Math.max(cambio, 0) });
      setCobrando(false);
      carrito.limpiar();
      setMesa('');
      setCliente(CLIENTE_VACIO);
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
      {/* Catálogo */}
      <section className="card flex min-h-[70vh] flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-bold">Punto de venta</h1>
          <input
            className="input max-w-xs"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ id: 'TODAS', nombre: 'Todas' }, ...categorias].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoriaId(c.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                String(categoriaId) === String(c.id) ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => carrito.agregar(p)}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-gradient-to-br from-crema-50 to-oro-100 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow"
            >
              <span className="text-sm font-semibold text-stone-800">{p.nombre}</span>
              <span className="mt-1 text-xs text-stone-500">{p.categoria?.nombre}</span>
              <span className="mt-2 text-lg font-bold text-brand-700">{formatMoney(p.precio)}</span>
            </button>
          ))}
          {visibles.length === 0 && <p className="col-span-full py-10 text-center text-stone-400">Sin productos</p>}
        </div>
      </section>

      {/* Pedido */}
      <section className="card flex flex-col p-4">
        <h2 className="mb-3 text-lg font-semibold">Pedido actual</h2>
        <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-3">
          {!cobrando && aviso?.text}
        </Alert>

        <div className="grid grid-cols-2 gap-2">
          <Select label="Documento" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}>
            {Object.entries(TIPO_DOCUMENTO_LABEL).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </Select>
          <Select label="Servicio" value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)}>
            {Object.entries(TIPO_SERVICIO_LABEL).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </Select>
          {tipoServicio === 'MESA' && (
            <Input label="Mesa" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Ej. 4" />
          )}
        </div>

        {tipoDocumento === 'CCF' && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-3">
            <Input className="col-span-2" label="Nombre / razón social" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            <Input label="NIT" value={cliente.nit} onChange={(e) => setCliente({ ...cliente, nit: e.target.value })} />
            <Input label="NRC" value={cliente.nrc} onChange={(e) => setCliente({ ...cliente, nrc: e.target.value })} />
            <Input className="col-span-2" label="Giro" value={cliente.giro} onChange={(e) => setCliente({ ...cliente, giro: e.target.value })} />
            <Input className="col-span-2" label="Dirección" value={cliente.direccion} onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })} />
          </div>
        )}

        <ul className="mt-3 flex-1 divide-y divide-stone-100 overflow-y-auto">
          {carrito.items.length === 0 && <li className="py-8 text-center text-sm text-stone-400">Toque un producto para agregarlo</li>}
          {carrito.items.map(({ producto, cantidad }) => (
            <li key={producto.id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{producto.nombre}</p>
                <p className="text-xs text-stone-500">{formatMoney(producto.precio)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="secondary" onClick={() => carrito.cambiarCantidad(producto.id, cantidad - 1)}>−</Button>
                <span className="w-8 text-center text-sm font-semibold">{cantidad}</span>
                <Button size="sm" variant="secondary" onClick={() => carrito.cambiarCantidad(producto.id, cantidad + 1)}>+</Button>
              </div>
              <span className="w-16 text-right text-sm font-semibold">{formatMoney(Number(producto.precio) * cantidad)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-sm">
          <div className="flex justify-between text-stone-500">
            <dt>{tipoDocumento === 'CCF' ? 'Ventas gravadas' : 'Subtotal sin IVA'}</dt>
            <dd>{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-stone-500">
            <dt>IVA 13 %</dt>
            <dd>{formatMoney(iva)}</dd>
          </div>
          <div className="flex justify-between text-xl font-bold">
            <dt>Total</dt>
            <dd className="text-brand-700">{formatMoney(total)}</dd>
          </div>
        </dl>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="secondary" onClick={carrito.limpiar} disabled={carrito.items.length === 0}>Limpiar</Button>
          <Button className="col-span-2" size="lg" onClick={abrirCobro} disabled={carrito.items.length === 0}>
            Cobrar {formatMoney(total)}
          </Button>
        </div>
      </section>

      {/* Cobro */}
      <Modal
        open={cobrando}
        onClose={() => setCobrando(false)}
        title={`Cobrar ${formatMoney(total)}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCobrando(false)}>Cancelar</Button>
            <Button variant="success" loading={enviando} disabled={pendiente !== 0} onClick={confirmarVenta}>
              Confirmar venta
            </Button>
          </>
        }
      >
        <Alert type={aviso?.type} className="mb-3">{cobrando && aviso?.text}</Alert>
        <div className="space-y-3">
          {pagos.map((pago, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_1fr_auto] items-end gap-2">
              <Select label="Método" value={pago.metodo} onChange={(e) => cambiarPago(i, 'metodo', e.target.value)}>
                {Object.entries(METODO_PAGO_LABEL).map(([valor, texto]) => (
                  <option key={valor} value={valor}>{texto}</option>
                ))}
              </Select>
              <Input label="Monto" type="number" step="0.01" min="0" value={pago.monto} onChange={(e) => cambiarPago(i, 'monto', e.target.value)} />
              <Input
                label={pago.metodo === 'BITCOIN' ? 'ID transacción' : 'Referencia'}
                value={pago.referencia}
                placeholder={pago.metodo === 'EFECTIVO' ? 'Opcional' : pago.metodo === 'TARJETA' ? 'N.º voucher' : 'Obligatorio'}
                onChange={(e) => cambiarPago(i, 'referencia', e.target.value)}
              />
              <Button variant="ghost" onClick={() => setPagos(pagos.filter((_, j) => j !== i))} disabled={pagos.length === 1} aria-label="Quitar pago">
                ✕
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={agregarPago}>+ Dividir pago</Button>

          {efectivo > 0 && (
            <div className="grid grid-cols-2 items-end gap-3 rounded-lg bg-stone-50 p-3">
              <Input label="Efectivo recibido" type="number" step="0.01" min="0" value={recibido} onChange={(e) => setRecibido(e.target.value)} />
              <div className="text-right">
                <p className="text-xs text-stone-500">Cambio</p>
                <p className={`text-2xl font-bold ${cambio < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{formatMoney(Math.max(cambio, 0))}</p>
              </div>
            </div>
          )}

          <div className={`rounded-lg px-3 py-2 text-sm font-medium ${pendiente === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {pendiente === 0
              ? 'Los pagos cubren el total.'
              : pendiente > 0
                ? `Faltan ${formatMoney(pendiente)} por asignar.`
                : `Los pagos exceden el total por ${formatMoney(-pendiente)}.`}
          </div>
        </div>
      </Modal>

      {/* Venta registrada */}
      <Modal
        open={Boolean(ventaCreada)}
        onClose={() => setVentaCreada(null)}
        title="Venta registrada"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVentaCreada(null)}>Nueva venta</Button>
            <Button onClick={() => navigate(`/ventas/${ventaCreada.id}`)}>Ver comprobante</Button>
          </>
        }
      >
        {ventaCreada && (
          <div className="space-y-2 text-center">
            <p className="text-4xl">✅</p>
            <p className="font-mono text-lg font-semibold">{ventaCreada.numeroDocumento}</p>
            <p className="text-stone-500">Total {formatMoney(ventaCreada.total)}</p>
            {ventaCreada.cambio > 0 && <p className="text-2xl font-bold text-emerald-700">Cambio: {formatMoney(ventaCreada.cambio)}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
