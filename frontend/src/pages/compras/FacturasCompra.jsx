import { useState } from 'react';
import { comprasApi, proveedoresApi } from '../../api/compras.api.js';
import { inventarioApi } from '../../api/inventario.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDate, formatMoney, formatNumber, hoyISO, round2 } from '../../utils/formatters.js';
import { CONDICION_LABEL, TIPO_DOCUMENTO_CORTO } from '../../utils/constants.js';

const ESTADO = { PENDIENTE: ['yellow', 'Pendiente'], PARCIAL: ['blue', 'Abonada'], PAGADA: ['green', 'Pagada'] };
const linea = () => ({ articuloId: '', cantidad: '', costoUnitario: '' });

export default function FacturasCompra() {
  const compras = useFetch(() => comprasApi.listar());
  const catalogos = useFetch(() => Promise.all([proveedoresApi.listar({ activo: 'true' }), inventarioApi.listar({ activo: 'true' })]));
  const [proveedores, articulos] = catalogos.data ?? [[], []];

  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const abrirNueva = () => {
    setErrorModal('');
    setForm({ proveedorId: '', tipoDocumento: 'CCF', numeroDocumento: '', fechaEmision: hoyISO(), condicion: 'CREDITO', fechaVencimiento: '', detalles: [linea()] });
    setCreando(true);
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const cambiarLinea = (i, campo, valor) => setForm({ ...form, detalles: form.detalles.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)) });

  const subtotal = form ? round2(form.detalles.reduce((acc, l) => acc + Number(l.cantidad || 0) * Number(l.costoUnitario || 0), 0)) : 0;
  const iva = form?.tipoDocumento === 'CCF' ? round2(subtotal * 0.13) : 0;

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      await comprasApi.crear({
        ...form,
        proveedorId: Number(form.proveedorId),
        fechaVencimiento: form.condicion === 'CREDITO' && form.fechaVencimiento ? form.fechaVencimiento : null,
        detalles: form.detalles.map((l) => ({ articuloId: Number(l.articuloId), cantidad: Number(l.cantidad), costoUnitario: Number(l.costoUnitario) })),
      });
      setCreando(false);
      setAviso({ type: 'success', text: 'Compra registrada. El inventario y el costo promedio fueron actualizados.' });
      compras.reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: 'fecha', header: 'Emisión', render: (c) => formatDate(c.fechaEmision) },
    { key: 'proveedor', header: 'Proveedor', render: (c) => c.proveedor.nombre },
    { key: 'doc', header: 'Documento', render: (c) => `${TIPO_DOCUMENTO_CORTO[c.tipoDocumento]} ${c.numeroDocumento}` },
    { key: 'condicion', header: 'Condición', render: (c) => CONDICION_LABEL[c.condicion] },
    { key: 'iva', header: 'IVA crédito', className: 'text-right', render: (c) => formatMoney(c.iva) },
    { key: 'total', header: 'Total', className: 'text-right', render: (c) => formatMoney(c.total) },
    { key: 'saldo', header: 'Saldo', className: 'text-right', render: (c) => formatMoney(c.saldo) },
    { key: 'estado', header: 'Estado', render: (c) => <Badge color={ESTADO[c.estado][0]}>{ESTADO[c.estado][1]}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Facturas de compra" subtitle="Registro de facturas y CCF de proveedores; cada compra aumenta el inventario" actions={<Button onClick={abrirNueva}>+ Registrar compra</Button>} />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{compras.error}</Alert>
      <Card bodyClassName="">
        {compras.loading ? <LoadingBlock /> : <Table columns={columnas} data={compras.data ?? []} onRowClick={setDetalle} emptyMessage="Sin compras registradas" />}
      </Card>

      <Modal
        open={creando}
        onClose={() => setCreando(false)}
        title="Registrar compra"
        size="xl"
        footer={<><Button variant="secondary" onClick={() => setCreando(false)}>Cancelar</Button><Button type="submit" form="form-compra" loading={enviando}>Guardar compra</Button></>}
      >
        {form && (
          <form id="form-compra" onSubmit={guardar} className="space-y-4">
            <Alert type="error">{errorModal}</Alert>
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Proveedor" name="proveedorId" value={form.proveedorId} onChange={cambiar} required>
                <option value="">Seleccione…</option>
                {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Select>
              <Select label="Tipo de documento" name="tipoDocumento" value={form.tipoDocumento} onChange={cambiar}>
                <option value="CCF">Comprobante de crédito fiscal</option>
                <option value="FACTURA">Factura consumidor final</option>
              </Select>
              <Input label="Número de documento" name="numeroDocumento" value={form.numeroDocumento} onChange={cambiar} required />
              <Input label="Fecha de emisión" type="date" name="fechaEmision" value={form.fechaEmision} onChange={cambiar} required />
              <Select label="Condición de pago" name="condicion" value={form.condicion} onChange={cambiar}>
                <option value="CREDITO">Crédito (cuenta por pagar)</option>
                <option value="CONTADO">Contado</option>
              </Select>
              {form.condicion === 'CREDITO' && (
                <Input label="Vencimiento" type="date" name="fechaVencimiento" value={form.fechaVencimiento} onChange={cambiar} hint="Vacío = días de crédito del proveedor" />
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Detalle {form.tipoDocumento === 'CCF' ? '(costos sin IVA)' : '(costos con IVA incluido)'}</p>
                <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, detalles: [...form.detalles, linea()] })}>+ Línea</Button>
              </div>
              <div className="space-y-2">
                {form.detalles.map((l, i) => {
                  const articulo = articulos.find((a) => a.id === Number(l.articuloId));
                  return (
                    <div key={i} className="grid grid-cols-[1fr_110px_120px_100px_auto] items-end gap-2">
                      <Select label={i === 0 ? 'Artículo' : undefined} value={l.articuloId} onChange={(e) => cambiarLinea(i, 'articuloId', e.target.value)} required>
                        <option value="">Seleccione…</option>
                        {articulos.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidad})</option>)}
                      </Select>
                      <Input label={i === 0 ? 'Cantidad' : undefined} type="number" step="0.001" min="0.001" value={l.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} required />
                      <Input label={i === 0 ? 'Costo unitario' : undefined} type="number" step="0.0001" min="0" value={l.costoUnitario} onChange={(e) => cambiarLinea(i, 'costoUnitario', e.target.value)} required hint={articulo ? `Prom. ${formatMoney(articulo.costoUnitario)}` : undefined} />
                      <p className="pb-2 text-right text-sm font-medium">{formatMoney(Number(l.cantidad || 0) * Number(l.costoUnitario || 0))}</p>
                      <Button variant="ghost" onClick={() => setForm({ ...form, detalles: form.detalles.filter((_, j) => j !== i) })} disabled={form.detalles.length === 1} aria-label="Quitar línea">✕</Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <dl className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>IVA 13 % (crédito fiscal)</dt><dd>{formatMoney(iva)}</dd></div>
              <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>Total</dt><dd>{formatMoney(subtotal + iva)}</dd></div>
            </dl>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(detalle)} onClose={() => setDetalle(null)} title={detalle ? `${TIPO_DOCUMENTO_CORTO[detalle.tipoDocumento]} ${detalle.numeroDocumento}` : ''} size="lg">
        {detalle && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-stone-500">Proveedor:</span> {detalle.proveedor.nombre}</p>
              <p><span className="text-stone-500">Emisión:</span> {formatDate(detalle.fechaEmision)}</p>
              <p><span className="text-stone-500">Condición:</span> {CONDICION_LABEL[detalle.condicion]}</p>
              <p><span className="text-stone-500">Vencimiento:</span> {formatDate(detalle.fechaVencimiento)}</p>
              <p><span className="text-stone-500">Registró:</span> {detalle.usuario?.nombre}</p>
            </div>
            <Table
              columns={[
                { key: 'articulo', header: 'Artículo', render: (d) => d.articulo.nombre },
                { key: 'cantidad', header: 'Cantidad', className: 'text-right', render: (d) => `${formatNumber(d.cantidad, 3)} ${d.articulo.unidad}` },
                { key: 'costo', header: 'Costo unit.', className: 'text-right', render: (d) => formatMoney(d.costoUnitario) },
                { key: 'subtotal', header: 'Subtotal', className: 'text-right', render: (d) => formatMoney(d.subtotal) },
              ]}
              data={detalle.detalles}
            />
            <p className="text-right">Subtotal {formatMoney(detalle.subtotal)} · IVA {formatMoney(detalle.iva)} · <strong>Total {formatMoney(detalle.total)}</strong></p>
            {detalle.abonos.length > 0 && (
              <div>
                <p className="mb-1 font-semibold">Abonos</p>
                <ul>{detalle.abonos.map((a) => <li key={a.id}>{formatDate(a.fecha)} · {formatMoney(a.monto)} · {a.metodo}{a.referencia ? ` · ${a.referencia}` : ''}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
