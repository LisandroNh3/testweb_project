import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventarioApi } from '../../api/inventario.api.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatNumber } from '../../utils/formatters.js';
import { TIPO_ARTICULO_LABEL, TIPO_MOVIMIENTO_LABEL } from '../../utils/constants.js';

const COLOR = { ENTRADA: 'green', SALIDA: 'blue', AJUSTE: 'purple', MERMA: 'red' };

export default function Kardex() {
  const [params, setParams] = useSearchParams();
  const articuloId = params.get('articuloId') ?? '';
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });

  const articulos = useFetch(() => inventarioApi.listar());
  const kardex = useFetch(
    () => (articuloId ? inventarioApi.kardex(articuloId, Object.fromEntries(Object.entries(fechas).filter(([, v]) => v))) : Promise.resolve(null)),
    [articuloId, fechas]
  );

  const columnas = [
    { key: 'fecha', header: 'Fecha', render: (m) => formatDateTime(m.createdAt) },
    { key: 'tipo', header: 'Tipo', render: (m) => <Badge color={COLOR[m.tipo]}>{TIPO_MOVIMIENTO_LABEL[m.tipo]}</Badge> },
    { key: 'referencia', header: 'Referencia', render: (m) => m.referencia ?? '—' },
    {
      key: 'cantidad',
      header: 'Cantidad',
      className: 'text-right',
      render: (m) => <span className={Number(m.cantidad) < 0 ? 'text-red-600' : 'text-emerald-700'}>{Number(m.cantidad) > 0 ? '+' : ''}{formatNumber(m.cantidad, 3)}</span>,
    },
    { key: 'anterior', header: 'Anterior', className: 'text-right', render: (m) => formatNumber(m.stockAnterior, 3) },
    { key: 'nuevo', header: 'Saldo', className: 'text-right font-semibold', render: (m) => formatNumber(m.stockNuevo, 3) },
    { key: 'usuario', header: 'Usuario', render: (m) => m.usuario?.nombre ?? '—' },
  ];

  const articulo = kardex.data?.articulo;

  return (
    <>
      <PageHeader title="Kardex de inventario" subtitle="Historial de entradas, salidas por venta, compras, mermas y ajustes" />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Artículo" value={articuloId} onChange={(e) => setParams(e.target.value ? { articuloId: e.target.value } : {})}>
            <option value="">Seleccione…</option>
            {(articulos.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} ({TIPO_ARTICULO_LABEL[a.tipo]})</option>
            ))}
          </Select>
          <Input label="Desde" type="date" value={fechas.desde} onChange={(e) => setFechas({ ...fechas, desde: e.target.value })} />
          <Input label="Hasta" type="date" value={fechas.hasta} onChange={(e) => setFechas({ ...fechas, hasta: e.target.value })} />
        </div>
      </Card>
      <Alert type="error">{kardex.error}</Alert>
      {!articuloId ? (
        <p className="py-10 text-center text-stone-400">Seleccione un artículo para ver sus movimientos.</p>
      ) : kardex.loading ? (
        <LoadingBlock />
      ) : (
        articulo && (
          <Card bodyClassName="" title={`${articulo.nombre} · existencia ${formatNumber(articulo.stock, 3)} ${articulo.unidad}`}>
            <Table columns={columnas} data={kardex.data.movimientos} emptyMessage="Sin movimientos en el período" />
          </Card>
        )
      )}
    </>
  );
}
