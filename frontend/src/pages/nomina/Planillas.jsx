import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nominaApi } from '../../api/nomina.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDate, formatMoney } from '../../utils/formatters.js';
import { MESES } from '../../utils/constants.js';

export const nombrePlanilla = (p) => `${p.quincena === 1 ? '1.ª' : '2.ª'} quincena de ${MESES[p.mes - 1]} ${p.anio}`;

export default function Planillas() {
  const navigate = useNavigate();
  const hoy = new Date();
  const { data, loading, error, reload } = useFetch(() => nominaApi.planillas());
  const [form, setForm] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() + 1, quincena: hoy.getDate() <= 15 ? 1 : 2 });
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const generar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const planilla = await nominaApi.generarPlanilla({ anio: Number(form.anio), mes: Number(form.mes), quincena: Number(form.quincena) });
      navigate(`/nomina/planillas/${planilla.id}`);
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (p) => {
    if (!window.confirm(`¿Eliminar el borrador de la ${nombrePlanilla(p)}?`)) return;
    try {
      await nominaApi.eliminarPlanilla(p.id);
      reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const columnas = [
    { key: 'periodo', header: 'Período', render: (p) => <span className="font-medium">{nombrePlanilla(p)}</span> },
    { key: 'rango', header: 'Del / al', render: (p) => `${formatDate(p.fechaInicio)} – ${formatDate(p.fechaFin)}` },
    { key: 'empleados', header: 'Empleados', className: 'text-right', render: (p) => p._count.detalles },
    { key: 'devengado', header: 'Devengado', className: 'text-right', render: (p) => formatMoney(p.totalDevengado) },
    { key: 'descuentos', header: 'ISSS + AFP + Renta', className: 'text-right', render: (p) => formatMoney(Number(p.totalIsss) + Number(p.totalAfp) + Number(p.totalRenta)) },
    { key: 'liquido', header: 'Líquido a pagar', className: 'text-right font-semibold', render: (p) => formatMoney(p.totalLiquido) },
    { key: 'estado', header: 'Estado', render: (p) => <Badge color={p.estado === 'APROBADA' ? 'green' : 'yellow'}>{p.estado === 'APROBADA' ? 'Aprobada' : 'Borrador'}</Badge> },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/nomina/planillas/${p.id}`)}>Ver</Button>
          {p.estado === 'BORRADOR' && <Button size="sm" variant="ghost" onClick={() => eliminar(p)}>Eliminar</Button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Planillas quincenales" subtitle="Cálculo de salario quincenal con descuentos de ISSS (3 %), AFP (7.25 %) y retención de Renta" />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Card title="Generar planilla" className="mb-4">
        <form onSubmit={generar} className="grid items-end gap-3 sm:grid-cols-4">
          <Input label="Año" type="number" min="2000" max="2100" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} required />
          <Select label="Mes" value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
          <Select label="Quincena" value={form.quincena} onChange={(e) => setForm({ ...form, quincena: e.target.value })}>
            <option value={1}>1.ª (del 1 al 15)</option>
            <option value={2}>2.ª (del 16 al fin de mes)</option>
          </Select>
          <Button type="submit" loading={enviando}>Generar</Button>
        </form>
      </Card>
      <Alert type="error">{error}</Alert>
      <Card bodyClassName="" title="Planillas generadas">
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={data ?? []} emptyMessage="Aún no hay planillas" />}
      </Card>
    </>
  );
}
