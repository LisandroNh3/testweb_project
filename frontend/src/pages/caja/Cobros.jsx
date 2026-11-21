import { Link } from 'react-router-dom';
import { cajaApi } from '../../api/caja.api.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney } from '../../utils/formatters.js';
import { METODO_PAGO_LABEL } from '../../utils/constants.js';

const COLOR_METODO = { EFECTIVO: 'green', TARJETA: 'blue', BITCOIN: 'yellow' };

export default function Cobros() {
  const { data, loading, error, reload } = useFetch(async () => {
    const turno = await cajaApi.turnoActual();
    if (!turno) return null;
    const [resumen, pagos] = await Promise.all([cajaApi.resumenActual(), cajaApi.pagosActuales()]);
    return { resumen, pagos };
  });

  if (loading) return <LoadingBlock />;
  if (error || !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-sm text-stone-600">{error ?? 'No tiene un turno de caja abierto.'}</p>
        <Link to="/caja"><Button className="mt-4">Ir a caja</Button></Link>
      </div>
    );
  }

  const { resumen, pagos } = data;
  const columnas = [
    { key: 'fecha', header: 'Hora', render: (p) => formatDateTime(p.fecha) },
    { key: 'doc', header: 'Documento', render: (p) => <Link className="font-mono text-brand-700 hover:underline" to={`/ventas/${p.ventaId}`}>{p.numeroDocumento}</Link> },
    { key: 'metodo', header: 'Método', render: (p) => <Badge color={COLOR_METODO[p.metodo]}>{METODO_PAGO_LABEL[p.metodo]}</Badge> },
    { key: 'referencia', header: 'Referencia', render: (p) => p.referencia ?? '—' },
    { key: 'monto', header: 'Monto', className: 'text-right', render: (p) => formatMoney(p.monto) },
    { key: 'estado', header: 'Venta', render: (p) => (p.estadoVenta === 'ANULADA' ? <Badge color="red">Anulada</Badge> : <Badge color="green">Pagada</Badge>) },
  ];

  return (
    <>
      <PageHeader
        title="Cobros del turno"
        subtitle={`Turno #${resumen.turno.id} · abierto ${formatDateTime(resumen.turno.abiertoEn)}`}
        actions={<Button variant="secondary" onClick={reload}>Actualizar</Button>}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Efectivo" value={formatMoney(resumen.porMetodo.EFECTIVO)} tone="green" />
        <StatCard label="Tarjeta" value={formatMoney(resumen.porMetodo.TARJETA)} />
        <StatCard label="Bitcoin / Chivo" value={formatMoney(resumen.porMetodo.BITCOIN)} tone="amber" />
        <StatCard label="Total cobrado" value={formatMoney(resumen.totalVendido)} tone="brand" hint={`${resumen.cantidadVentas} ventas · ${resumen.cantidadAnuladas} anuladas`} />
      </div>
      <Card bodyClassName="">
        <Table columns={columnas} data={pagos} emptyMessage="Aún no hay cobros en este turno" />
      </Card>
    </>
  );
}
