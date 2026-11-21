import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ventasApi } from '../../api/ventas.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Textarea } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney, round2 } from '../../utils/formatters.js';
import { EMPRESA, METODO_PAGO_LABEL, TIPO_DOCUMENTO_LABEL, TIPO_SERVICIO_LABEL } from '../../utils/constants.js';

export default function DetalleDocumento() {
  const { id } = useParams();
  const { tieneRol } = useAuth();
  const { data: venta, loading, error, setData } = useFetch(() => ventasApi.obtener(id), [id]);
  const [anulando, setAnulando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert type="error">{error}</Alert>;

  const esCcf = venta.tipoDocumento === 'CCF';
  const tasa = Number(venta.total) ? Number(venta.iva) / Number(venta.subtotal) : 0.13;
  // En CCF los precios se muestran sin IVA; en factura de consumidor final, con IVA incluido.
  const precioMostrado = (valor) => (esCcf ? round2(Number(valor) / (1 + tasa)) : Number(valor));

  const anular = async () => {
    setEnviando(true);
    try {
      setData(await ventasApi.anular(venta.id, motivo));
      setAnulando(false);
      setAviso({ type: 'success', text: 'Documento anulado. El inventario fue restituido.' });
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Link to="/ventas" className="mr-auto text-sm text-brand-700 hover:underline">← Historial de ventas</Link>
        <Link to="/ventas/pos"><Button variant="secondary">Nueva venta</Button></Link>
        {tieneRol('ADMIN') && venta.estado === 'PAGADA' && (
          <Button variant="danger" onClick={() => setAnulando(true)}>Anular</Button>
        )}
        <Button onClick={() => window.print()}>🖨 Imprimir</Button>
      </div>
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>

      <article className="print-area card relative overflow-hidden p-8">
        {venta.estado === 'ANULADA' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 border-4 border-red-500 px-6 py-2 text-6xl font-black text-red-500/40">ANULADO</span>
          </div>
        )}

        <header className="flex flex-wrap justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h1 className="text-xl font-bold">{EMPRESA.nombre}</h1>
            <p className="text-sm text-stone-600">{EMPRESA.razonSocial}</p>
            <p className="text-xs text-stone-500">Giro: {EMPRESA.giro} · {EMPRESA.direccion}</p>
            <p className="text-xs text-stone-500">NIT {EMPRESA.nit} · NRC {EMPRESA.nrc}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase text-brand-700">{TIPO_DOCUMENTO_LABEL[venta.tipoDocumento]}</p>
            <p className="font-mono text-lg font-bold">{venta.numeroDocumento}</p>
            <p className="text-xs text-stone-500">{formatDateTime(venta.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-2 border-b border-stone-200 py-4 text-sm sm:grid-cols-2">
          <div>
            <p><span className="text-stone-500">Cliente:</span> {venta.clienteNombre ?? 'Consumidor final'}</p>
            {esCcf && (
              <>
                <p><span className="text-stone-500">NIT:</span> {venta.clienteNit} · <span className="text-stone-500">NRC:</span> {venta.clienteNrc}</p>
                <p><span className="text-stone-500">Giro:</span> {venta.clienteGiro}</p>
                {venta.clienteDireccion && <p><span className="text-stone-500">Dirección:</span> {venta.clienteDireccion}</p>}
              </>
            )}
          </div>
          <div className="sm:text-right">
            <p><span className="text-stone-500">Servicio:</span> {TIPO_SERVICIO_LABEL[venta.tipoServicio]} {venta.mesa ?? ''}</p>
            <p><span className="text-stone-500">Atendió:</span> {venta.usuario?.nombre}</p>
          </div>
        </section>

        <table className="my-4 w-full text-sm">
          <thead className="border-b border-stone-300 text-left text-xs uppercase text-stone-500">
            <tr>
              <th className="py-1">Cant.</th>
              <th>Descripción</th>
              <th className="text-right">{esCcf ? 'Precio sin IVA' : 'Precio'}</th>
              <th className="text-right">{esCcf ? 'Ventas gravadas' : 'Total'}</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles.map((d) => (
              <tr key={d.id} className="border-b border-stone-100">
                <td className="py-1">{d.cantidad}</td>
                <td>{d.descripcion}</td>
                <td className="text-right">{formatMoney(precioMostrado(d.precioUnitario))}</td>
                <td className="text-right">{formatMoney(precioMostrado(d.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">{esCcf ? 'Sumas' : 'Subtotal sin IVA'}</span><span>{formatMoney(venta.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">IVA 13 %</span><span>{formatMoney(venta.iva)}</span></div>
          <div className="flex justify-between border-t border-stone-300 pt-1 text-lg font-bold"><span>Total</span><span>{formatMoney(venta.total)}</span></div>
          {!esCcf && <p className="text-right text-xs text-stone-400">Precios con IVA incluido</p>}
        </div>

        <section className="mt-6 text-sm">
          <p className="mb-1 font-semibold">Forma de pago</p>
          <ul className="space-y-0.5">
            {venta.pagos.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{METODO_PAGO_LABEL[p.metodo]}{p.referencia ? ` · ${p.referencia}` : ''}</span>
                <span>{formatMoney(p.monto)}</span>
              </li>
            ))}
          </ul>
        </section>

        {venta.estado === 'ANULADA' && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">Motivo de anulación: {venta.motivoAnulacion}</p>
        )}
        <p className="mt-8 text-center text-xs text-stone-400">¡Gracias por su visita!</p>
      </article>

      <Modal
        open={anulando}
        onClose={() => setAnulando(false)}
        title={`Anular ${venta.numeroDocumento}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAnulando(false)}>Cancelar</Button>
            <Button variant="danger" loading={enviando} disabled={!motivo.trim()} onClick={anular}>Anular documento</Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-stone-600">
          El número correlativo se conserva como anulado y el inventario descontado se devuelve. Esta acción no se puede deshacer.
        </p>
        <Textarea label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Modal>
    </div>
  );
}
