import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cajaApi } from '../../api/caja.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Table from '../../components/ui/Table.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney } from '../../utils/formatters.js';

export default function AperturaCaja() {
  const turnoFetch = useFetch(async () => {
    const turno = await cajaApi.turnoActual();
    return turno ? { turno, resumen: await cajaApi.resumenActual() } : { turno: null };
  });
  const historial = useFetch(() => cajaApi.turnos());
  const [fondo, setFondo] = useState('50.00');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const abrir = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      await cajaApi.abrir(Number(fondo));
      setAviso({ type: 'success', text: 'Turno de caja abierto.' });
      turnoFetch.reload();
      historial.reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: 'id', header: 'Turno', render: (t) => `#${t.id}` },
    { key: 'usuario', header: 'Cajero', render: (t) => t.usuario?.nombre },
    { key: 'abiertoEn', header: 'Apertura', render: (t) => formatDateTime(t.abiertoEn) },
    { key: 'cerradoEn', header: 'Cierre', render: (t) => formatDateTime(t.cerradoEn) },
    { key: 'fondo', header: 'Fondo', className: 'text-right', render: (t) => formatMoney(t.fondoInicial) },
    {
      key: 'diferencia',
      header: 'Diferencia',
      className: 'text-right',
      render: (t) =>
        t.diferencia === null ? '—' : (
          <span className={Number(t.diferencia) === 0 ? 'text-emerald-700' : 'font-semibold text-red-600'}>{formatMoney(t.diferencia)}</span>
        ),
    },
    { key: 'estado', header: 'Estado', render: (t) => <Badge color={t.estado === 'ABIERTO' ? 'green' : 'gray'}>{t.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'}</Badge> },
  ];

  const { turno, resumen } = turnoFetch.data ?? {};

  return (
    <>
      <PageHeader title="Caja" subtitle="Apertura de turno y registro histórico" />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{turnoFetch.error}</Alert>

      {turnoFetch.loading ? (
        <LoadingBlock />
      ) : turno ? (
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Turno abierto" value={`#${turno.id}`} tone="green" hint={`Desde ${formatDateTime(turno.abiertoEn)}`} />
            <StatCard label="Fondo inicial" value={formatMoney(turno.fondoInicial)} />
            <StatCard label="Ventas del turno" value={formatMoney(resumen.totalVendido)} tone="brand" hint={`${resumen.cantidadVentas} documentos`} />
            <StatCard label="Efectivo esperado en caja" value={formatMoney(resumen.esperado.EFECTIVO)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/ventas/pos"><Button>🧾 Ir al punto de venta</Button></Link>
            <Link to="/caja/cobros"><Button variant="secondary">Ver cobros</Button></Link>
            <Link to="/caja/cierre"><Button variant="secondary">Cerrar caja</Button></Link>
          </div>
        </div>
      ) : (
        <Card title="Abrir turno de caja" className="mb-6 max-w-md">
          <form onSubmit={abrir} className="space-y-4">
            <Input
              label="Fondo inicial (efectivo para cambio)"
              type="number"
              step="0.01"
              min="0"
              value={fondo}
              onChange={(e) => setFondo(e.target.value)}
              required
            />
            <Button type="submit" loading={enviando} className="w-full">Abrir caja</Button>
          </form>
        </Card>
      )}

      <Card title="Historial de turnos" bodyClassName="">
        {historial.loading ? <LoadingBlock /> : <Table columns={columnas} data={historial.data ?? []} emptyMessage="Sin turnos registrados" />}
      </Card>
    </>
  );
}
