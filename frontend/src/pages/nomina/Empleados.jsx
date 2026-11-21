import { useState } from 'react';
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
import { formatDate, formatMoney, hoyISO, toInputDate } from '../../utils/formatters.js';

const VACIO = { nombres: '', apellidos: '', dui: '', nit: '', numeroIsss: '', nup: '', cargo: '', salarioMensual: '', fechaIngreso: hoyISO() };

export default function Empleados() {
  const { data, loading, error, reload } = useFetch(() => nominaApi.empleados());
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const empleados = (data ?? []).filter((e) =>
    `${e.nombres} ${e.apellidos} ${e.dui} ${e.cargo}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const planillaMensual = empleados.filter((e) => e.activo).reduce((acc, e) => acc + Number(e.salarioMensual), 0);

  const abrir = (empleado) => {
    setErrorModal('');
    setForm(
      empleado
        ? { ...Object.fromEntries(Object.keys(VACIO).map((k) => [k, empleado[k] ?? ''])), fechaIngreso: toInputDate(empleado.fechaIngreso) }
        : VACIO
    );
    setEditando(empleado ?? 'nuevo');
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      const datos = { ...form, salarioMensual: Number(form.salarioMensual) };
      if (editando === 'nuevo') await nominaApi.crearEmpleado(datos);
      else await nominaApi.actualizarEmpleado(editando.id, datos);
      setEditando(null);
      setAviso({ type: 'success', text: 'Empleado guardado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (empleado) => {
    try {
      await nominaApi.cambiarEstadoEmpleado(empleado.id, !empleado.activo);
      reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const columnas = [
    { key: 'nombre', header: 'Empleado', render: (e) => <span className="font-medium">{e.apellidos}, {e.nombres}</span> },
    { key: 'dui', header: 'DUI' },
    { key: 'cargo', header: 'Cargo' },
    { key: 'ingreso', header: 'Ingreso', render: (e) => formatDate(e.fechaIngreso) },
    { key: 'salario', header: 'Salario mensual', className: 'text-right', render: (e) => formatMoney(e.salarioMensual) },
    { key: 'estado', header: 'Estado', render: (e) => <Badge color={e.activo ? 'green' : 'gray'}>{e.activo ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (e) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => abrir(e)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => alternar(e)}>{e.activo ? 'Dar de baja' : 'Reactivar'}</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Empleados" subtitle={`Salarios activos: ${formatMoney(planillaMensual)} mensuales`} actions={<Button onClick={() => abrir(null)}>+ Nuevo empleado</Button>} />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      <Card bodyClassName="" title={`${empleados.length} empleados`} actions={<input className="input w-56" placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />}>
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={empleados} />}
      </Card>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo empleado' : 'Editar empleado'}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-empleado" loading={enviando}>Guardar</Button></>}
      >
        <form id="form-empleado" onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
          <Alert type="error" className="sm:col-span-2">{errorModal}</Alert>
          <Input label="Nombres" name="nombres" value={form.nombres} onChange={cambiar} required />
          <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={cambiar} required />
          <Input label="DUI" name="dui" value={form.dui} onChange={cambiar} placeholder="00000000-0" required />
          <Input label="NIT" name="nit" value={form.nit} onChange={cambiar} />
          <Input label="N.º afiliación ISSS" name="numeroIsss" value={form.numeroIsss} onChange={cambiar} />
          <Input label="NUP (AFP)" name="nup" value={form.nup} onChange={cambiar} />
          <Input label="Cargo" name="cargo" value={form.cargo} onChange={cambiar} required />
          <Input label="Salario mensual ($)" name="salarioMensual" type="number" step="0.01" min="0.01" value={form.salarioMensual} onChange={cambiar} required />
          <Input label="Fecha de ingreso" name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={cambiar} required />
        </form>
      </Modal>
    </>
  );
}
