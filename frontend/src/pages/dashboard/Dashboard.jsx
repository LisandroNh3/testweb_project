import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/auth.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import StockAlert from '../../components/common/StockAlert.jsx';
import Card, { StatCard } from '../../components/ui/Card.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { LoadingBlock } from '../../components/ui/Spinner.jsx';
import { formatDateTime, formatMoney } from '../../utils/formatters.js';

export default function Dashboard() {
  const { usuario, tieneRol } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardApi.resumen());

  return (
    <>
      <PageHeader
        title={`Hola, ${usuario.nombre.split(' ')[0]}`}
        subtitle="Así va el día en Coffee Click"
        actions={<Button variant="secondary" onClick={reload}>Actualizar</Button>}
      />
      <Alert type="error">{error}</Alert>
      {loading && !data ? (
        <LoadingBlock />
      ) : (
        data && (
          <div className="space-y-6">
            {tieneRol('CAJERO') && data.ventas && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Ventas de hoy" value={formatMoney(data.ventas.total)} tone="brand" />
                <StatCard label="Documentos emitidos" value={data.ventas.cantidad} />
                <StatCard label="Ticket promedio" value={formatMoney(data.ventas.ticketPromedio)} />
                <StatCard
                  label="Mi turno de caja"
                  value={data.turno ? 'Abierto' : 'Cerrado'}
                  tone={data.turno ? 'green' : 'amber'}
                  hint={data.turno ? `Desde ${formatDateTime(data.turno.abiertoEn)}` : 'Abra caja para vender'}
                />
              </div>
            )}

            {tieneRol('BODEGA') && data.cuentasPorPagar && (
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Cuentas por pagar" value={formatMoney(data.cuentasPorPagar.totalPendiente)} hint={`${data.cuentasPorPagar.cantidadCuentas} facturas pendientes`} />
                <StatCard label="Vencido" value={formatMoney(data.cuentasPorPagar.totalVencido)} tone={data.cuentasPorPagar.cantidadVencidas ? 'red' : 'green'} hint={`${data.cuentasPorPagar.cantidadVencidas} facturas vencidas`} />
                <StatCard label="Alertas de stock" value={data.alertasStock.length} tone={data.alertasStock.length ? 'amber' : 'green'} />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Alertas de stock mínimo">
                <StockAlert alertas={data.alertasStock} enlazar={tieneRol('BODEGA')} />
              </Card>

              {data.ventas && (
                <Card title="Productos más vendidos hoy">
                  {data.ventas.topProductos.length === 0 ? (
                    <p className="text-sm text-stone-500">Aún no hay ventas hoy.</p>
                  ) : (
                    <ol className="space-y-2">
                      {data.ventas.topProductos.map((p, i) => (
                        <li key={p.producto} className="flex items-center justify-between text-sm">
                          <span>
                            <span className="mr-2 font-bold text-brand-600">{i + 1}.</span>
                            {p.producto}
                          </span>
                          <span className="text-stone-500">
                            {p.cantidad} u. · {formatMoney(p.total)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              )}

              {tieneRol('RRHH') && (
                <Card title="Nómina">
                  <p className="text-sm text-stone-600">Genere la planilla quincenal con ISSS, AFP y retención de Renta.</p>
                  <Link to="/nomina/planillas" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                    Ir a planillas →
                  </Link>
                </Card>
              )}
            </div>

            {tieneRol('CAJERO') && (
              <div className="flex flex-wrap gap-3">
                <Link to="/ventas/pos">
                  <Button size="lg">🧾 Nueva venta</Button>
                </Link>
                <Link to="/caja">
                  <Button size="lg" variant="secondary">💵 Caja</Button>
                </Link>
              </div>
            )}
          </div>
        )
      )}
    </>
  );
}
