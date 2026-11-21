import { useState } from 'react';
import { usuariosApi } from '../../api/auth.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateLocal } from '../../utils/formatters.js';
import { ROL_LABEL } from '../../utils/constants.js';

const VACIO = { nombre: '', email: '', password: '', rol: 'CAJERO' };

export default function Usuarios() {
  const { usuario: actual } = useAuth();
  const { data, loading, error, reload } = useFetch(() => usuariosApi.listar());
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const abrir = (u) => {
    setErrorModal('');
    setForm(u ? { nombre: u.nombre, email: u.email, password: '', rol: u.rol } : VACIO);
    setEditando(u ?? 'nuevo');
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      if (editando === 'nuevo') await usuariosApi.crear(form);
      else await usuariosApi.actualizar(editando.id, { ...form, password: form.password || undefined });
      setEditando(null);
      setAviso({ type: 'success', text: 'Usuario guardado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (u) => {
    try {
      await usuariosApi.cambiarEstado(u.id, !u.activo);
      reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const columnas = [
    { key: 'nombre', header: 'Nombre', render: (u) => <span className="font-medium">{u.nombre}</span> },
    { key: 'email', header: 'Correo' },
    { key: 'rol', header: 'Rol', render: (u) => <Badge color="brand">{ROL_LABEL[u.rol]}</Badge> },
    { key: 'creado', header: 'Creado', render: (u) => formatDateLocal(u.createdAt) },
    { key: 'activo', header: 'Estado', render: (u) => <Badge color={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => abrir(u)}>Editar</Button>
          {u.id !== actual.id && <Button size="sm" variant="ghost" onClick={() => alternar(u)}>{u.activo ? 'Desactivar' : 'Activar'}</Button>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Acceso al sistema por rol" actions={<Button onClick={() => abrir(null)}>+ Nuevo usuario</Button>} />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      <Card bodyClassName="">{loading ? <LoadingBlock /> : <Table columns={columnas} data={data ?? []} />}</Card>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-usuario" loading={enviando}>Guardar</Button></>}
      >
        <form id="form-usuario" onSubmit={guardar} className="space-y-3">
          <Alert type="error">{errorModal}</Alert>
          <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required />
          <Input label="Correo" name="email" type="email" value={form.email} onChange={cambiar} required />
          <Input
            label={editando === 'nuevo' ? 'Contraseña' : 'Nueva contraseña'}
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={cambiar}
            required={editando === 'nuevo'}
            minLength={8}
            hint={editando === 'nuevo' ? 'Mínimo 8 caracteres' : 'Déjela vacía para no cambiarla'}
          />
          <Select label="Rol" name="rol" value={form.rol} onChange={cambiar}>
            {Object.entries(ROL_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </Select>
        </form>
      </Modal>
    </>
  );
}
