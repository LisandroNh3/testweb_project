import { useState } from 'react';
import { nominaApi } from '../../api/nomina.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatMoney, formatNumber } from '../../utils/formatters.js';

const esPorcentaje = (clave) => !clave.includes('TECHO');
const mostrarValor = (p) => (esPorcentaje(p.clave) ? `${formatNumber(Number(p.valor) * 100, 2)} %` : formatMoney(p.valor));

export default function Parametros() {
  const { tieneRol } = useAuth();
  const esAdmin = tieneRol('ADMIN');
  const { data, loading, error, reload } = useFetch(() => Promise.all([nominaApi.parametros(), nominaApi.tramos()]));
  const [parametros, tramos] = data ?? [[], []];
  const [editParam, setEditParam] = useState(null);
  const [editTramo, setEditTramo] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const ejecutar = async (accion, cerrar) => {
    setEnviando(true);
    setErrorModal('');
    try {
      await accion();
      cerrar();
      setAviso({ type: 'success', text: 'Parámetro actualizado. Aplica a las planillas que se generen desde ahora.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const columnasParametros = [
    { key: 'descripcion', header: 'Parámetro' },
    { key: 'clave', header: 'Clave', render: (p) => <code className="text-xs">{p.clave}</code> },
    { key: 'valor', header: 'Valor', className: 'text-right font-semibold', render: mostrarValor },
    ...(esAdmin ? [{ key: 'acc', header: '', className: 'text-right', render: (p) => <Button size="sm" variant="ghost" onClick={() => { setErrorModal(''); setEditParam({ ...p }); }}>Editar</Button> }] : []),
  ];

  const columnasTramos = [
    { key: 'tramo', header: 'Tramo', render: (t) => ['I', 'II', 'III', 'IV', 'V'][t.tramo - 1] ?? t.tramo },
    { key: 'desde', header: 'Desde', className: 'text-right', render: (t) => formatMoney(t.desde) },
    { key: 'hasta', header: 'Hasta', className: 'text-right', render: (t) => (t.hasta === null ? 'En adelante' : formatMoney(t.hasta)) },
    { key: 'porcentaje', header: '% a aplicar', className: 'text-right', render: (t) => (Number(t.porcentaje) ? `${formatNumber(Number(t.porcentaje) * 100, 2)} %` : 'Sin retención') },
    { key: 'sobreExceso', header: 'Sobre el exceso de', className: 'text-right', render: (t) => formatMoney(t.sobreExceso) },
    { key: 'cuotaFija', header: 'Más cuota fija', className: 'text-right', render: (t) => formatMoney(t.cuotaFija) },
    ...(esAdmin ? [{ key: 'acc', header: '', className: 'text-right', render: (t) => <Button size="sm" variant="ghost" onClick={() => { setErrorModal(''); setEditTramo({ ...t, hasta: t.hasta ?? '' }); }}>Editar</Button> }] : []),
  ];

  return (
    <>
      <PageHeader title="Parámetros de ley" subtitle="Porcentajes, techos de cotización y tabla de retención de Renta usados por la planilla" />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      {!esAdmin && <Alert type="info" className="mb-4">Solo el administrador puede modificar estos valores.</Alert>}
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-6">
          <Card title="Porcentajes y techos" bodyClassName=""><Table columns={columnasParametros} data={parametros} rowKey="clave" /></Card>
          <Card title="Tabla de retención de Renta — remuneraciones quincenales" bodyClassName=""><Table columns={columnasTramos} data={tramos} /></Card>
          <p className="text-xs text-stone-500">Verifique los valores contra la tabla vigente publicada por el Ministerio de Hacienda de El Salvador.</p>
        </div>
      )}

      <Modal
        open={Boolean(editParam)}
        onClose={() => setEditParam(null)}
        title={editParam?.descripcion ?? ''}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditParam(null)}>Cancelar</Button><Button loading={enviando} onClick={() => ejecutar(() => nominaApi.actualizarParametro(editParam.clave, Number(editParam.valor)), () => setEditParam(null))}>Guardar</Button></>}
      >
        {editParam && (
          <div className="space-y-3">
            <Alert type="error">{errorModal}</Alert>
            <Input
              label={esPorcentaje(editParam.clave) ? 'Valor (fracción decimal, ej. 0.03 = 3 %)' : 'Monto mensual ($)'}
              type="number" step="0.0001" min="0" value={editParam.valor} onChange={(e) => setEditParam({ ...editParam, valor: e.target.value })}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editTramo)}
        onClose={() => setEditTramo(null)}
        title={`Tramo ${editTramo?.tramo ?? ''}`}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditTramo(null)}>Cancelar</Button><Button loading={enviando} onClick={() => ejecutar(() => nominaApi.actualizarTramo(editTramo.id, { ...editTramo, hasta: editTramo.hasta === '' ? null : editTramo.hasta }), () => setEditTramo(null))}>Guardar</Button></>}
      >
        {editTramo && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert type="error" className="sm:col-span-2">{errorModal}</Alert>
            <Input label="Desde ($)" type="number" step="0.01" value={editTramo.desde} onChange={(e) => setEditTramo({ ...editTramo, desde: e.target.value })} />
            <Input label="Hasta ($)" type="number" step="0.01" value={editTramo.hasta} onChange={(e) => setEditTramo({ ...editTramo, hasta: e.target.value })} hint="Vacío = en adelante" />
            <Input label="Porcentaje (0.10 = 10 %)" type="number" step="0.0001" value={editTramo.porcentaje} onChange={(e) => setEditTramo({ ...editTramo, porcentaje: e.target.value })} />
            <Input label="Sobre el exceso de ($)" type="number" step="0.01" value={editTramo.sobreExceso} onChange={(e) => setEditTramo({ ...editTramo, sobreExceso: e.target.value })} />
            <Input label="Cuota fija ($)" type="number" step="0.01" value={editTramo.cuotaFija} onChange={(e) => setEditTramo({ ...editTramo, cuotaFija: e.target.value })} />
          </div>
        )}
      </Modal>
    </>
  );
}
