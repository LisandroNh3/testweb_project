import { useState } from 'react';
import { proveedoresApi } from '../../api/compras.api.js';
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

const VACIO = { nombre: '', nit: '', nrc: '', telefono: '', email: '', direccion: '', diasCredito: '0' };

export default function Proveedores() {
  const { data, loading, error, reload } = useFetch(() => proveedoresApi.listar());
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const abrir = (proveedor) => {
    setErrorModal('');
    setForm(proveedor ? Object.fromEntries(Object.keys(VACIO).map((k) => [k, proveedor[k] ?? ''])) : VACIO);
    setEditando(proveedor ?? 'nuevo');
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      if (editando === 'nuevo') await proveedoresApi.crear(form);
      else await proveedoresApi.actualizar(editando.id, form);
      setEditando(null);
      setAviso({ type: 'success', text: 'Proveedor guardado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const alternar = async (p) => {
    try {
      await proveedoresApi.cambiarEstado(p.id, !p.activo);
      reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const columnas = [
    { key: 'nombre', header: 'Proveedor', render: (p) => <span className="font-medium">{p.nombre}</span> },
    { key: 'nit', header: 'NIT', render: (p) => p.nit ?? '—' },
    { key: 'nrc', header: 'NRC', render: (p) => p.nrc ?? '—' },
    { key: 'telefono', header: 'Teléfono', render: (p) => p.telefono ?? '—' },
    { key: 'diasCredito', header: 'Crédito', render: (p) => (p.diasCredito ? `${p.diasCredito} días` : 'Contado') },
    { key: 'activo', header: 'Estado', render: (p) => <Badge color={p.activo ? 'green' : 'gray'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => abrir(p)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => alternar(p)}>{p.activo ? 'Desactivar' : 'Activar'}</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Proveedores" actions={<Button onClick={() => abrir(null)}>+ Nuevo proveedor</Button>} />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      <Card bodyClassName="">{loading ? <LoadingBlock /> : <Table columns={columnas} data={data ?? []} />}</Card>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-proveedor" loading={enviando}>Guardar</Button></>}
      >
        <form id="form-proveedor" onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
          <Alert type="error" className="sm:col-span-2">{errorModal}</Alert>
          <Input className="sm:col-span-2" label="Nombre o razón social" name="nombre" value={form.nombre} onChange={cambiar} required />
          <Input label="NIT" name="nit" value={form.nit} onChange={cambiar} />
          <Input label="NRC" name="nrc" value={form.nrc} onChange={cambiar} />
          <Input label="Teléfono" name="telefono" value={form.telefono} onChange={cambiar} />
          <Input label="Correo" name="email" type="email" value={form.email} onChange={cambiar} />
          <Input className="sm:col-span-2" label="Dirección" name="direccion" value={form.direccion} onChange={cambiar} />
          <Input label="Días de crédito" name="diasCredito" type="number" min="0" step="1" value={form.diasCredito} onChange={cambiar} hint="0 = contado" />
        </form>
      </Modal>
    </>
  );
}
