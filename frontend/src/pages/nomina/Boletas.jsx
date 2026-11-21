import { useSearchParams } from 'react-router-dom';
import { nominaApi } from '../../api/nomina.api.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { Select } from '../../components/ui/Input.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDate, formatMoney } from '../../utils/formatters.js';
import { EMPRESA } from '../../utils/constants.js';
import { nombrePlanilla } from './Planillas.jsx';

function Fila({ label, valor, negativo = false, fuerte = false }) {
  return (
    <div className={`flex justify-between py-0.5 ${fuerte ? 'border-t border-stone-300 pt-1 font-bold' : ''}`}>
      <span>{label}</span>
      <span className={negativo && Number(valor) > 0 ? 'text-red-700' : ''}>
        {negativo && Number(valor) > 0 ? '−' : ''}
        {formatMoney(valor)}
      </span>
    </div>
  );
}

export default function Boletas() {
  const [params, setParams] = useSearchParams();
  const planillaId = params.get('planillaId') ?? '';
  const lista = useFetch(() => nominaApi.planillas());
  const planilla = useFetch(() => (planillaId ? nominaApi.planilla(planillaId) : Promise.resolve(null)), [planillaId]);

  return (
    <>
      <PageHeader title="Boletas de pago" subtitle="Comprobante individual de pago para cada empleado" actions={planilla.data && <Button onClick={() => window.print()}>🖨 Imprimir boletas</Button>} />
      <Card className="no-print mb-4 max-w-md">
        <Select label="Planilla" value={planillaId} onChange={(e) => setParams(e.target.value ? { planillaId: e.target.value } : {})}>
          <option value="">Seleccione…</option>
          {(lista.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{nombrePlanilla(p)} {p.estado === 'BORRADOR' ? '(borrador)' : ''}</option>
          ))}
        </Select>
      </Card>
      <Alert type="error">{planilla.error}</Alert>
      {planilla.loading && planillaId ? (
        <LoadingBlock />
      ) : (
        planilla.data && (
          <div className="grid gap-4 lg:grid-cols-2">
            {planilla.data.detalles.map((d) => (
              <article key={d.id} className="print-area card break-inside-avoid p-5 text-sm">
                <header className="mb-3 border-b border-dashed border-stone-300 pb-2">
                  <p className="font-bold">{EMPRESA.razonSocial}</p>
                  <p className="text-xs text-stone-500">Boleta de pago · {nombrePlanilla(planilla.data)} ({formatDate(planilla.data.fechaInicio)} – {formatDate(planilla.data.fechaFin)})</p>
                </header>
                <p className="font-semibold">{d.empleado.nombres} {d.empleado.apellidos}</p>
                <p className="mb-3 text-xs text-stone-500">{d.empleado.cargo} · DUI {d.empleado.dui} · ISSS {d.empleado.numeroIsss ?? '—'} · NUP {d.empleado.nup ?? '—'}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-stone-500">Ingresos</p>
                    <Fila label="Salario quincenal" valor={d.salarioQuincenal} />
                    <Fila label="Otros ingresos" valor={d.otrosIngresos} />
                    <Fila label="Total devengado" valor={d.devengado} fuerte />
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-stone-500">Descuentos</p>
                    <Fila label="ISSS (3 %)" valor={d.isss} negativo />
                    <Fila label="AFP (7.25 %)" valor={d.afp} negativo />
                    <Fila label="Renta" valor={d.renta} negativo />
                    <Fila label="Otros" valor={d.otrosDescuentos} negativo />
                    <Fila label="Total descuentos" valor={d.totalDescuentos} negativo fuerte />
                  </div>
                </div>
                <div className="mt-3 flex justify-between rounded-lg bg-brand-50 px-3 py-2 text-base font-bold text-brand-800">
                  <span>Líquido a recibir</span>
                  <span>{formatMoney(d.liquido)}</span>
                </div>
                <div className="mt-8 flex justify-between gap-6 text-center text-xs text-stone-500">
                  <span className="flex-1 border-t border-stone-400 pt-1">Firma del empleado</span>
                  <span className="flex-1 border-t border-stone-400 pt-1">Recursos humanos</span>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </>
  );
}
