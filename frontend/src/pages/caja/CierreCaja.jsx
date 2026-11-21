import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cajaApi } from '../../api/caja.api.js';
import { mensajeError } from '../../api/axiosClient.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input, { Textarea } from '../../components/ui/Input.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney, round2 } from '../../utils/formatters.js';
import { METODO_PAGO_LABEL } from '../../utils/constants.js';

const CAMPOS = { EFECTIVO: 'contadoEfectivo', TARJETA: 'contadoTarjeta', BITCOIN: 'contadoBitcoin' };

function TablaCuadre({ esperado, contado }) {
  const filas = Object.keys(CAMPOS).map((metodo) => ({
    metodo,
    esperado: Number(esperado[metodo]),
    contado: Number(contado[metodo] || 0),
  }));
  const diferenciaTotal = round2(filas.reduce((acc, f) => acc + (f.contado - f.esperado), 0));

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase text-stone-500">
        <tr><th className="py-1">Método</th><th className="text-right">Esperado</th><th className="text-right">Contado</th><th className="text-right">Diferencia</th></tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {filas.map((f) => {
          const dif = round2(f.contado - f.esperado);
          return (
            <tr key={f.metodo}>
              <td className="py-1.5">{METODO_PAGO_LABEL[f.metodo]}</td>
              <td className="text-right">{formatMoney(f.esperado)}</td>
              <td className="text-right">{formatMoney(f.contado)}</td>
              <td className={`text-right font-medium ${dif === 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatMoney(dif)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t border-stone-300 font-bold">
          <td className="py-2" colSpan={3}>{diferenciaTotal === 0 ? 'Caja cuadrada' : diferenciaTotal > 0 ? 'Sobrante' : 'Faltante'}</td>
          <td className={`text-right ${diferenciaTotal === 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatMoney(diferenciaTotal)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function CierreCaja() {
  const { data: resumen, loading, error } = useFetch(async () => {
    const turno = await cajaApi.turnoActual();
    return turno ? cajaApi.resumenActual() : null;
  });
  const [contado, setContado] = useState({ EFECTIVO: '', TARJETA: '', BITCOIN: '' });
  const [observaciones, setObservaciones] = useState('');
  const [resultado, setResultado] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (loading) return <LoadingBlock />;

  if (resultado) {
    const t = resultado.turno;
    return (
      <>
        <PageHeader title="Cierre de caja" subtitle={`Turno #${t.id} cerrado ${formatDateTime(t.cerradoEn)}`} actions={<Button onClick={() => window.print()}>🖨 Imprimir</Button>} />
        <Card title="Resultado del cuadre" className="print-area max-w-2xl">
          <TablaCuadre
            esperado={{ EFECTIVO: t.esperadoEfectivo, TARJETA: t.esperadoTarjeta, BITCOIN: t.esperadoBitcoin }}
            contado={{ EFECTIVO: t.contadoEfectivo, TARJETA: t.contadoTarjeta, BITCOIN: t.contadoBitcoin }}
          />
          <p className="mt-3 text-sm text-stone-500">Ventas: {resultado.cantidadVentas} · Total vendido {formatMoney(resultado.totalVendido)} · Fondo inicial {formatMoney(t.fondoInicial)}</p>
          {t.observaciones && <p className="mt-2 text-sm">Observaciones: {t.observaciones}</p>}
        </Card>
      </>
    );
  }

  if (error || !resumen) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <p className="text-sm text-stone-600">{error ?? 'No tiene un turno de caja abierto.'}</p>
        <Link to="/caja"><Button className="mt-4">Ir a caja</Button></Link>
      </div>
    );
  }

  const cerrar = async (e) => {
    e.preventDefault();
    if (!window.confirm('¿Cerrar el turno de caja? Ya no podrá registrar ventas en él.')) return;
    setEnviando(true);
    setAviso(null);
    try {
      const datos = Object.fromEntries(Object.entries(CAMPOS).map(([metodo, campo]) => [campo, Number(contado[metodo] || 0)]));
      setResultado(await cajaApi.cerrar({ ...datos, observaciones }));
    } catch (err) {
      setAviso({ type: 'error', text: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <PageHeader title="Cierre y cuadre de caja" subtitle={`Turno #${resumen.turno.id} · abierto ${formatDateTime(resumen.turno.abiertoEn)}`} />
      <Alert type={aviso?.type} className="mb-4">{aviso?.text}</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Conteo físico">
          <form onSubmit={cerrar} className="space-y-4">
            <p className="text-sm text-stone-500">Cuente el efectivo (incluido el fondo inicial de {formatMoney(resumen.turno.fondoInicial)}), sume los vouchers de tarjeta y verifique los pagos recibidos en la billetera Bitcoin / Chivo.</p>
            {Object.keys(CAMPOS).map((metodo) => (
              <Input
                key={metodo}
                label={`${METODO_PAGO_LABEL[metodo]} contado`}
                type="number"
                step="0.01"
                min="0"
                value={contado[metodo]}
                onChange={(e) => setContado({ ...contado, [metodo]: e.target.value })}
                required
              />
            ))}
            <Textarea label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            <Button type="submit" variant="danger" loading={enviando} className="w-full">Cerrar turno</Button>
          </form>
        </Card>
        <Card title="Cuadre en tiempo real">
          <TablaCuadre esperado={resumen.esperado} contado={contado} />
          <p className="mt-3 text-xs text-stone-500">{resumen.cantidadVentas} ventas · {resumen.cantidadAnuladas} anuladas · total {formatMoney(resumen.totalVendido)}</p>
        </Card>
      </div>
    </>
  );
}
