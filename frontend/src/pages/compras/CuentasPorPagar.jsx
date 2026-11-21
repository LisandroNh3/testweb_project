import { useState } from 'react';
import { cuentasPorPagarApi } from '../../api/compras.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDate, formatMoney } from '../../utils/formatters.js';
import { METODO_PAGO_LABEL, TIPO_DOCUMENTO_CORTO } from '../../utils/constants.js';

const etiquetaVencimiento = (c) => {
  if (c.diasParaVencer === null) return <Badge>Sin fecha</Badge>;
  if (c.vencida) return <Badge color="red">Vencida hace {-c.diasParaVencer} d</Badge>;
  if (c.diasParaVencer <= 7) return <Badge color="yellow">Vence en {c.diasParaVencer} d</Badge>;
  return <Badge color="green">En {c.diasParaVencer} d</Badge>;
};

export default function CuentasPorPagar() {
  const [soloVencidas, setSoloVencidas] = useState(false);
  const { data, loading, error, reload } = useFetch(
    () => Promise.all([cuentasPorPagarApi.listar(soloVencidas ? { soloVencidas: 'true' } : {}), cuentasPorPagarApi.resumen()]),
    [soloVencidas]
  );
  const [cuentas, resumen] = data ?? [[], null];
  const [abono, setAbono] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const guardarAbono = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      await cuentasPorPagarApi.abonar(abono.cuenta.id, { monto: Number(abono.monto), metodo: abono.metodo, referencia: abono.referencia });
      setAbono(null);
      setAviso({ type: 'success', text: 'Abono registrado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: 'proveedor', header: 'Proveedor', render: (c) => c.proveedor.nombre },
    { key: 'doc', header: 'Documento', render: (c) => `${TIPO_DOCUMENTO_CORTO[c.tipoDocumento]} ${c.numeroDocumento}` },
    { key: 'emision', header: 'Emisión', render: (c) => formatDate(c.fechaEmision) },
    { key: 'vence', header: 'Vencimiento', render: (c) => formatDate(c.fechaVencimiento) },
    { key: 'estado', header: 'Plazo', render: etiquetaVencimiento },
    { key: 'total', header: 'Total', className: 'text-right', render: (c) => formatMoney(c.total) },
    { key: 'abonado', header: 'Abonado', className: 'text-right', render: (c) => formatMoney(Number(c.total) - Number(c.saldo)) },
    { key: 'saldo', header: 'Saldo', className: 'text-right font-semibold', render: (c) => formatMoney(c.saldo) },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (c) => (
        <Button size="sm" onClick={() => { setErrorModal(''); setAbono({ cuenta: c, monto: Number(c.saldo).toFixed(2), metodo: 'TARJETA', referencia: '' }); }}>
          Abonar
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Cuentas por pagar" subtitle="Facturas de proveedores al crédito pendientes de pago" />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      {resumen && (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total pendiente" value={formatMoney(resumen.totalPendiente)} tone="brand" hint={`${resumen.cantidadCuentas} facturas`} />
          <StatCard label="Vencido" value={formatMoney(resumen.totalVencido)} tone={resumen.cantidadVencidas ? 'red' : 'green'} hint={`${resumen.cantidadVencidas} facturas vencidas`} />
          <StatCard label="Mayor acreedor" value={resumen.porProveedor[0] ? formatMoney(resumen.porProveedor[0].saldo) : '—'} hint={resumen.porProveedor[0]?.proveedor.nombre} />
        </div>
      )}
      <Card
        bodyClassName=""
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soloVencidas} onChange={(e) => setSoloVencidas(e.target.checked)} /> Solo vencidas
          </label>
        }
        title="Cuentas abiertas"
      >
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={cuentas} emptyMessage="No hay cuentas pendientes" />}
      </Card>

      <Modal
        open={Boolean(abono)}
        onClose={() => setAbono(null)}
        title="Registrar abono"
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setAbono(null)}>Cancelar</Button><Button type="submit" form="form-abono" loading={enviando}>Registrar</Button></>}
      >
        {abono && (
          <form id="form-abono" onSubmit={guardarAbono} className="space-y-3">
            <Alert type="error">{errorModal}</Alert>
            <p className="text-sm text-stone-600">{abono.cuenta.proveedor.nombre} · saldo {formatMoney(abono.cuenta.saldo)}</p>
            <Input label="Monto" type="number" step="0.01" min="0.01" max={abono.cuenta.saldo} value={abono.monto} onChange={(e) => setAbono({ ...abono, monto: e.target.value })} required />
            <Select label="Método" value={abono.metodo} onChange={(e) => setAbono({ ...abono, metodo: e.target.value })}>
              {Object.entries(METODO_PAGO_LABEL).map(([v, t]) => <option key={v} value={v}>{v === 'TARJETA' ? 'Tarjeta / transferencia' : t}</option>)}
            </Select>
            <Input label="Referencia" value={abono.referencia} onChange={(e) => setAbono({ ...abono, referencia: e.target.value })} placeholder="N.º de cheque, transferencia…" />
          </form>
        )}
      </Modal>
    </>
  );
}
