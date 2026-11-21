import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inventarioApi } from '../../api/inventario.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatMoney, formatNumber } from '../../utils/formatters.js';

const VACIO = { nombre: '', unidad: '', stockMinimo: '0', costoUnitario: '0', stockInicial: '0', activo: true };

/** Pantalla compartida por Materia prima y Artículos de reventa. */
export default function ArticulosPage({ tipo, titulo, subtitulo, unidadSugerida }) {
  const [busqueda, setBusqueda] = useState('');
  const { data, loading, error, reload } = useFetch(() => inventarioApi.listar({ tipo }), [tipo]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [ajuste, setAjuste] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [errorModal, setErrorModal] = useState('');
  const [enviando, setEnviando] = useState(false);

  const articulos = (data ?? []).filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const valorInventario = articulos.reduce((acc, a) => acc + Number(a.stock) * Number(a.costoUnitario), 0);

  const abrirNuevo = () => {
    setForm({ ...VACIO, unidad: unidadSugerida });
    setErrorModal('');
    setEditando('nuevo');
  };

  const abrirEdicion = (a) => {
    setForm({ nombre: a.nombre, unidad: a.unidad, stockMinimo: a.stockMinimo, costoUnitario: a.costoUnitario, activo: a.activo });
    setErrorModal('');
    setEditando(a);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      const datos = { ...form, tipo };
      if (editando === 'nuevo') await inventarioApi.crear(datos);
      else await inventarioApi.actualizar(editando.id, datos);
      setEditando(null);
      setAviso({ type: 'success', text: 'Artículo guardado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const guardarAjuste = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    try {
      await inventarioApi.ajustar({ articuloId: ajuste.articulo.id, tipo: ajuste.tipo, cantidad: Number(ajuste.cantidad), motivo: ajuste.motivo });
      setAjuste(null);
      setAviso({ type: 'success', text: 'Movimiento registrado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: 'nombre', header: 'Artículo', render: (a) => <span className={a.activo ? 'font-medium' : 'text-stone-400 line-through'}>{a.nombre}</span> },
    { key: 'stock', header: 'Existencia', className: 'text-right', render: (a) => `${formatNumber(a.stock, 3)} ${a.unidad}` },
    { key: 'stockMinimo', header: 'Mínimo', className: 'text-right', render: (a) => `${formatNumber(a.stockMinimo, 3)} ${a.unidad}` },
    { key: 'costo', header: 'Costo unit.', className: 'text-right', render: (a) => formatMoney(a.costoUnitario) },
    { key: 'valor', header: 'Valor', className: 'text-right', render: (a) => formatMoney(Number(a.stock) * Number(a.costoUnitario)) },
    {
      key: 'estado',
      header: 'Estado',
      render: (a) =>
        Number(a.stock) <= 0 ? <Badge color="red">Agotado</Badge> : Number(a.stock) <= Number(a.stockMinimo) ? <Badge color="yellow">Stock bajo</Badge> : <Badge color="green">OK</Badge>,
    },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => { setErrorModal(''); setAjuste({ articulo: a, tipo: 'ENTRADA', cantidad: '', motivo: '' }); }}>Movimiento</Button>
          <Button size="sm" variant="ghost" onClick={() => abrirEdicion(a)}>Editar</Button>
          <Link to={`/inventario/kardex?articuloId=${a.id}`}><Button size="sm" variant="ghost">Kardex</Button></Link>
        </div>
      ),
    },
  ];

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <PageHeader title={titulo} subtitle={subtitulo} actions={<Button onClick={abrirNuevo}>+ Nuevo artículo</Button>} />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      <Card
        bodyClassName=""
        title={`${articulos.length} artículos · valor ${formatMoney(valorInventario)}`}
        actions={<input className="input w-56" placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />}
      >
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={articulos} />}
      </Card>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo artículo' : 'Editar artículo'}
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-articulo" loading={enviando}>Guardar</Button></>}
      >
        <form id="form-articulo" onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
          <Alert type="error" className="sm:col-span-2">{errorModal}</Alert>
          <Input className="sm:col-span-2" label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required />
          <Input label="Unidad de medida" name="unidad" value={form.unidad} onChange={cambiar} hint="lb, kg, unidad, litro…" required />
          <Input label="Stock mínimo" name="stockMinimo" type="number" step="0.001" min="0" value={form.stockMinimo} onChange={cambiar} />
          <Input label="Costo unitario ($)" name="costoUnitario" type="number" step="0.0001" min="0" value={form.costoUnitario} onChange={cambiar} />
          {editando === 'nuevo' ? (
            <Input label="Existencia inicial" name="stockInicial" type="number" step="0.001" min="0" value={form.stockInicial} onChange={cambiar} />
          ) : (
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" name="activo" checked={form.activo} onChange={cambiar} /> Activo
            </label>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(ajuste)}
        onClose={() => setAjuste(null)}
        title={`Movimiento: ${ajuste?.articulo.nombre ?? ''}`}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setAjuste(null)}>Cancelar</Button><Button type="submit" form="form-ajuste" loading={enviando}>Registrar</Button></>}
      >
        {ajuste && (
          <form id="form-ajuste" onSubmit={guardarAjuste} className="space-y-3">
            <Alert type="error">{errorModal}</Alert>
            <p className="text-sm text-stone-500">Existencia actual: {formatNumber(ajuste.articulo.stock, 3)} {ajuste.articulo.unidad}</p>
            <Select label="Tipo" value={ajuste.tipo} onChange={(e) => setAjuste({ ...ajuste, tipo: e.target.value })}>
              <option value="ENTRADA">Entrada (suma)</option>
              <option value="MERMA">Merma / desperdicio (resta)</option>
              <option value="AJUSTE">Ajuste por conteo físico (fija la existencia)</option>
            </Select>
            <Input
              label={ajuste.tipo === 'AJUSTE' ? `Existencia contada (${ajuste.articulo.unidad})` : `Cantidad (${ajuste.articulo.unidad})`}
              type="number" step="0.001" min="0" value={ajuste.cantidad} onChange={(e) => setAjuste({ ...ajuste, cantidad: e.target.value })} required
            />
            <Input label="Motivo" value={ajuste.motivo} onChange={(e) => setAjuste({ ...ajuste, motivo: e.target.value })} required />
          </form>
        )}
      </Modal>
    </>
  );
}
