import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventasApi } from '../../api/ventas.api.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney, hoyISO } from '../../utils/formatters.js';
import { TIPO_DOCUMENTO_CORTO, TIPO_SERVICIO_LABEL } from '../../utils/constants.js';

export default function HistorialVentas() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({ desde: hoyISO(), hasta: hoyISO(), tipoDocumento: '', estado: '' });
  const { data: ventas = [], loading, error } = useFetch(
    () => ventasApi.listar(Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))),
    [filtros]
  );

  const lista = ventas ?? [];
  const pagadas = lista.filter((v) => v.estado === 'PAGADA');
  const total = pagadas.reduce((acc, v) => acc + Number(v.total), 0);
  const ivaTotal = pagadas.reduce((acc, v) => acc + Number(v.iva), 0);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const columnas = [
    { key: 'numeroDocumento', header: 'Documento', render: (v) => <span className="font-mono">{v.numeroDocumento}</span> },
    { key: 'tipo', header: 'Tipo', render: (v) => TIPO_DOCUMENTO_CORTO[v.tipoDocumento] },
    { key: 'fecha', header: 'Fecha', render: (v) => formatDateTime(v.createdAt) },
    { key: 'servicio', header: 'Servicio', render: (v) => `${TIPO_SERVICIO_LABEL[v.tipoServicio]}${v.mesa ? ` ${v.mesa}` : ''}` },
    { key: 'cliente', header: 'Cliente', render: (v) => v.clienteNombre ?? 'Consumidor final' },
    { key: 'cajero', header: 'Cajero', render: (v) => v.usuario?.nombre },
    { key: 'total', header: 'Total', className: 'text-right', render: (v) => formatMoney(v.total) },
    {
      key: 'estado',
      header: 'Estado',
      render: (v) => <Badge color={v.estado === 'PAGADA' ? 'green' : 'red'}>{v.estado === 'PAGADA' ? 'Pagada' : 'Anulada'}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Historial de ventas" subtitle="Facturas y comprobantes de crédito fiscal emitidos" />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input label="Desde" type="date" name="desde" value={filtros.desde} onChange={cambiar} />
          <Input label="Hasta" type="date" name="hasta" value={filtros.hasta} onChange={cambiar} />
          <Select label="Documento" name="tipoDocumento" value={filtros.tipoDocumento} onChange={cambiar}>
            <option value="">Todos</option>
            <option value="FACTURA">Factura</option>
            <option value="CCF">CCF</option>
          </Select>
          <Select label="Estado" name="estado" value={filtros.estado} onChange={cambiar}>
            <option value="">Todos</option>
            <option value="PAGADA">Pagadas</option>
            <option value="ANULADA">Anuladas</option>
          </Select>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Documentos" value={lista.length} hint={`${lista.length - pagadas.length} anulados`} />
        <StatCard label="Total vendido" value={formatMoney(total)} tone="brand" />
        <StatCard label="IVA débito fiscal" value={formatMoney(ivaTotal)} />
      </div>

      <Alert type="error">{error}</Alert>
      <Card bodyClassName="">
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={lista} onRowClick={(v) => navigate(`/ventas/${v.id}`)} emptyMessage="No hay ventas en el período" />}
      </Card>
    </>
  );
}
