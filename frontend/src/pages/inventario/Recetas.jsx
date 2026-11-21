import { useState } from 'react';
import { inventarioApi, productosApi } from '../../api/inventario.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Input, { Select, Textarea } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatMoney, formatNumber, round2 } from '../../utils/formatters.js';
import { TIPO_PRODUCTO_LABEL } from '../../utils/constants.js';

const VACIO = { nombre: '', descripcion: '', precio: '', tipo: 'ELABORADO', categoriaId: '', articuloId: '', receta: [] };

/** Costo de la receta según el costo promedio de cada materia prima. */
const costoReceta = (receta, articulos) =>
  round2(
    receta.reduce((acc, r) => {
      const articulo = r.articulo ?? articulos.find((a) => a.id === Number(r.articuloId));
      return acc + Number(r.cantidad || 0) * Number(articulo?.costoUnitario ?? 0);
    }, 0)
  );

export default function Recetas() {
  const { data, loading, error, reload } = useFetch(() =>
    Promise.all([productosApi.listar(), productosApi.categorias(), inventarioApi.listar({ activo: 'true' })])
  );
  const [productos, categorias, articulos] = data ?? [[], [], []];
  const materiasPrimas = articulos.filter((a) => a.tipo === 'MATERIA_PRIMA');
  const deReventa = articulos.filter((a) => a.tipo === 'REVENTA');

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [errorModal, setErrorModal] = useState('');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const visibles = productos.filter((p) => !filtroCategoria || p.categoriaId === Number(filtroCategoria));

  const abrir = (producto) => {
    setErrorModal('');
    if (!producto) {
      setForm({ ...VACIO, categoriaId: categorias[0]?.id ?? '' });
      setEditando('nuevo');
      return;
    }
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precio: producto.precio,
      tipo: producto.tipo,
      categoriaId: producto.categoriaId,
      articuloId: producto.articuloId ?? '',
      receta: producto.receta.map((r) => ({ articuloId: r.articuloId, cantidad: r.cantidad })),
    });
    setEditando(producto);
  };

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const cambiarIngrediente = (i, campo, valor) =>
    setForm({ ...form, receta: form.receta.map((r, j) => (j === i ? { ...r, [campo]: valor } : r)) });

  const nuevaCategoria = async () => {
    const nombre = window.prompt('Nombre de la nueva categoría');
    if (!nombre?.trim()) return;
    try {
      const categoria = await productosApi.crearCategoria(nombre.trim());
      reload();
      setForm((f) => ({ ...f, categoriaId: categoria.id }));
    } catch (err) {
      setErrorModal(mensajeError(err));
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrorModal('');
    const datos = {
      ...form,
      precio: Number(form.precio),
      categoriaId: Number(form.categoriaId),
      articuloId: form.tipo === 'REVENTA' ? Number(form.articuloId) : undefined,
      receta: form.tipo === 'ELABORADO' ? form.receta.map((r) => ({ articuloId: Number(r.articuloId), cantidad: Number(r.cantidad) })) : [],
    };
    try {
      if (editando === 'nuevo') await productosApi.crear(datos);
      else await productosApi.actualizar(editando.id, datos);
      setEditando(null);
      setAviso({ type: 'success', text: 'Producto guardado.' });
      reload();
    } catch (err) {
      setErrorModal(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  };

  const alternarEstado = async (producto) => {
    try {
      await productosApi.cambiarEstado(producto.id, !producto.activo);
      reload();
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    }
  };

  const costoDe = (p) => (p.tipo === 'ELABORADO' ? costoReceta(p.receta, articulos) : Number(articulos.find((a) => a.id === p.articuloId)?.costoUnitario ?? 0));

  const columnas = [
    { key: 'nombre', header: 'Producto', render: (p) => <span className={p.activo ? 'font-medium' : 'text-stone-400 line-through'}>{p.nombre}</span> },
    { key: 'categoria', header: 'Categoría', render: (p) => p.categoria?.nombre },
    { key: 'tipo', header: 'Tipo', render: (p) => <Badge color={p.tipo === 'ELABORADO' ? 'brand' : 'blue'}>{p.tipo === 'ELABORADO' ? 'Receta' : 'Reventa'}</Badge> },
    {
      key: 'receta',
      header: 'Consume',
      render: (p) =>
        p.tipo === 'ELABORADO' ? (
          <span className="text-xs text-stone-600">{p.receta.map((r) => `${r.articulo.nombre} ${formatNumber(r.cantidad, 3)} ${r.articulo.unidad}`).join(' · ') || <Badge color="red">Sin receta</Badge>}</span>
        ) : (
          <span className="text-xs text-stone-600">1 × {p.articulo?.nombre}</span>
        ),
    },
    { key: 'precio', header: 'Precio', className: 'text-right', render: (p) => formatMoney(p.precio) },
    { key: 'costo', header: 'Costo', className: 'text-right', render: (p) => formatMoney(costoDe(p)) },
    {
      key: 'margen',
      header: 'Margen',
      className: 'text-right',
      render: (p) => {
        const sinIva = Number(p.precio) / 1.13;
        const margen = sinIva ? ((sinIva - costoDe(p)) / sinIva) * 100 : 0;
        return <span className={margen < 30 ? 'text-red-600' : 'text-emerald-700'}>{formatNumber(margen, 1)} %</span>;
      },
    },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => abrir(p)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => alternarEstado(p)}>{p.activo ? 'Desactivar' : 'Activar'}</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Menú y recetas"
        subtitle="Menú de la cafetería. Al vender un producto elaborado se descuenta su receta del inventario."
        actions={<Button onClick={() => abrir(null)}>+ Nuevo producto</Button>}
      />
      <Alert type={aviso?.type} onClose={() => setAviso(null)} className="mb-4">{aviso?.text}</Alert>
      <Alert type="error">{error}</Alert>
      <Card
        bodyClassName=""
        title={`${visibles.length} productos`}
        actions={
          <select className="input w-48" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        }
      >
        {loading ? <LoadingBlock /> : <Table columns={columnas} data={visibles} />}
      </Card>
      <p className="mt-2 text-xs text-stone-500">El margen se calcula sobre el precio sin IVA y el costo promedio de los insumos.</p>

      <Modal
        open={Boolean(editando)}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo producto' : `Editar ${editando?.nombre ?? ''}`}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button><Button type="submit" form="form-producto" loading={enviando}>Guardar</Button></>}
      >
        <form id="form-producto" onSubmit={guardar} className="space-y-4">
          <Alert type="error">{errorModal}</Alert>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required />
            <Input label="Precio de venta (IVA incluido)" name="precio" type="number" step="0.01" min="0.01" value={form.precio} onChange={cambiar} required />
            <div className="flex items-end gap-2">
              <Select className="flex-1" label="Categoría" name="categoriaId" value={form.categoriaId} onChange={cambiar} required>
                <option value="">Seleccione…</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
              <Button variant="secondary" onClick={nuevaCategoria}>+</Button>
            </div>
            <Select label="Tipo" name="tipo" value={form.tipo} onChange={cambiar}>
              {Object.entries(TIPO_PRODUCTO_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </Select>
            <Textarea className="sm:col-span-2" label="Descripción" name="descripcion" value={form.descripcion} onChange={cambiar} />
          </div>

          {form.tipo === 'REVENTA' ? (
            <Select label="Artículo de inventario que se descuenta" name="articuloId" value={form.articuloId} onChange={cambiar} required>
              <option value="">Seleccione…</option>
              {deReventa.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </Select>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Receta (por unidad vendida)</p>
                <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, receta: [...form.receta, { articuloId: '', cantidad: '' }] })}>
                  + Ingrediente
                </Button>
              </div>
              {form.receta.length === 0 && <p className="text-sm text-amber-700">Sin ingredientes: la venta no descontará inventario.</p>}
              <div className="space-y-2">
                {form.receta.map((r, i) => {
                  const articulo = materiasPrimas.find((a) => a.id === Number(r.articuloId));
                  return (
                    <div key={i} className="grid grid-cols-[1fr_120px_auto] items-end gap-2">
                      <Select label={i === 0 ? 'Materia prima' : undefined} value={r.articuloId} onChange={(e) => cambiarIngrediente(i, 'articuloId', e.target.value)} required>
                        <option value="">Seleccione…</option>
                        {materiasPrimas.map((a) => <option key={a.id} value={a.id}>{a.nombre} ({a.unidad})</option>)}
                      </Select>
                      <Input label={i === 0 ? `Cantidad${articulo ? ` (${articulo.unidad})` : ''}` : undefined} type="number" step="0.001" min="0.001" value={r.cantidad} onChange={(e) => cambiarIngrediente(i, 'cantidad', e.target.value)} required />
                      <Button variant="ghost" onClick={() => setForm({ ...form, receta: form.receta.filter((_, j) => j !== i) })} aria-label="Quitar ingrediente">✕</Button>
                    </div>
                  );
                })}
              </div>
              {form.receta.length > 0 && (
                <p className="mt-2 text-sm text-stone-600">Costo estimado por unidad: <strong>{formatMoney(costoReceta(form.receta, articulos))}</strong></p>
              )}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
