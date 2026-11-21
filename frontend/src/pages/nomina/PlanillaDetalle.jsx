import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { nominaApi } from '../../api/nomina.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDate, formatDateTime, formatMoney } from '../../utils/formatters.js';
import { EMPRESA } from '../../utils/constants.js';
import { nombrePlanilla } from './Planillas.jsx';

const COLUMNAS_MONTO = [
  ['salarioQuincenal', 'Salario quincenal'],
  ['otrosIngresos', 'Otros ingresos'],
  ['devengado', 'Devengado'],
  ['isss', 'ISSS'],
  ['afp', 'AFP'],
  ['renta', 'Renta'],
  ['otrosDescuentos', 'Otros desc.'],
  ['liquido', 'Líquido'],
];

export default function PlanillaDetalle() {
  const { id } = useParams();
  const { data: planilla, loading, error, setData } = useFetch(() => nominaApi.planilla(id), [id]);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert type="error">{error}</Alert>;

  const borrador = planilla.estado === 'BORRADOR';
  const totalCol = (campo) => planilla.detalles.reduce((acc, d) => acc + Number(d[campo]), 0);

  const guardarDetalle = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      setData(await nominaApi.actualizarDetalle(planilla.id, editando.id, { otrosIngresos: Number(editando.otrosIngresos || 0), otrosDescuentos: Number(editando.otrosDescuentos || 0) }));
      setEditando(null);
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const aprobar = async () => {
    if (!window.confirm('Una planilla aprobada ya no se puede modificar. ¿Aprobar?')) return;
    try {
      setData(await nominaApi.aprobarPlanilla(planilla.id));
      setAviso({ type: 'success', text: 'Planilla aprobada.' });
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const columnas = [
    { key: 'empleado', header: 'Empleado', render: (d) => <div><p className="font-medium">{d.empleado.apellidos}, {d.empleado.nombres}</p><p className="text-xs text-stone-500">{d.empleado.cargo} · DUI {d.empleado.dui}</p></div> },
    ...COLUMNAS_MONTO.map(([campo, header]) => ({
      key: campo,
      header,
      className: `text-right ${campo === 'liquido' ? 'font-semibold' : ''}`,
      render: (d) => formatMoney(d[campo]),
    })),
    ...(borrador
      ? [{ key: 'acciones', header: '', className: 'no-print text-right', render: (d) => <Button size="sm" variant="ghost" onClick={() => { setErrorModal(''); setEditando({ ...d }); }}>Ajustar</Button> }]
      : []),
  ];

  const pie = (
    <tr>
      <td className="px-3 py-2">Totales</td>
      {COLUMNAS_MONTO.map(([campo]) => <td key={campo} className="px-3 py-2 text-right">{formatMoney(totalCol(campo))}</td>)}
      {borrador && <td className="no-print" />}
    </tr>
  );

  return (
    <>
      <PageHeader
        title={`Planilla: ${nombrePlanilla(planilla)}`}
        subtitle={`Del ${formatDate(planilla.fechaInicio)} al ${formatDate(planilla.fechaFin)}`}
        actions={
          <>
            <Link to="/nomina/planillas"><Button variant="secondary">← Planillas</Button></Link>
            <Link to={`/nomina/boletas?planillaId=${planilla.id}`}><Button variant="secondary">Boletas</Button></Link>
            <Button variant="secondary" onClick={() => window.print()}>🖨 Imprimir</Button>
            {borrador && <Button variant="success" onClick={aprobar}>Aprobar planilla</Button>}
          </>
        }
      />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>

      <Card
        className="print-area"
        bodyClassName=""
        title={
          <span>
            {EMPRESA.razonSocial} · {nombrePlanilla(planilla)}{' '}
            <Badge color={borrador ? 'yellow' : 'green'}>{borrador ? 'Borrador' : `Aprobada ${formatDateTime(planilla.aprobadaEn)}`}</Badge>
          </span>
        }
      >
        <Table columns={columnas} data={planilla.detalles} footer={pie} />
      </Card>
      <p className="mt-2 text-xs text-stone-500">
        ISSS y AFP se calculan sobre el devengado hasta el techo de cotización. La Renta se retiene según la tabla quincenal vigente sobre (devengado − ISSS − AFP). Los parámetros se editan en «Parámetros de ley».
      </p>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando ? `Ajustar: ${editando.empleado.nombres} ${editando.empleado.apellidos}` : ''}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-detalle" loading={enviando}>Recalcular</Button></>}
      >
        {editando && (
          <form id="form-detalle" onSubmit={guardarDetalle} className="space-y-3">
            <Alert type="error">{errorModal}</Alert>
            <Input label="Otros ingresos gravados (horas extra, bonos)" type="number" step="0.01" min="0" value={editando.otrosIngresos} onChange={(e) => setEditando({ ...editando, otrosIngresos: e.target.value })} />
            <Input label="Otros descuentos (préstamos, anticipos)" type="number" step="0.01" min="0" value={editando.otrosDescuentos} onChange={(e) => setEditando({ ...editando, otrosDescuentos: e.target.value })} />
          </form>
        )}
      </Modal>
    </>
  );
}
