# Catálogo de endpoints REST

Base: `http://localhost:3000/api/v1`. Todas las respuestas son JSON:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "Descripción del error", "code": 400, "errors": ["detalle 1", "detalle 2"] }
```

Salvo `/health` y `/auth/login`, todas las rutas requieren el encabezado `Authorization: Bearer <token>`. El rol `ADMIN` tiene acceso a todas las rutas.

| Código | Uso |
|--------|-----|
| 200 | Consulta o actualización correcta |
| 201 | Registro creado |
| 204 | Eliminado (sin contenido) |
| 400 | Datos inválidos (incluye `errors`) |
| 401 | Sin sesión o token vencido |
| 403 | El rol no tiene permiso |
| 404 | Registro o ruta inexistente |
| 409 | Conflicto de negocio: stock insuficiente, caja cerrada, duplicado, etc. |
| 500 | Error interno |

## Autenticación y usuarios

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/health` | Público | Estado de la API |
| POST | `/auth/login` | Público | `{ email, password }` → `{ token, usuario }` |
| GET | `/auth/me` | Todos | Usuario de la sesión |
| GET | `/usuarios` | ADMIN | Lista de usuarios |
| POST | `/usuarios` | ADMIN | `{ nombre, email, password, rol }` |
| PUT | `/usuarios/:id` | ADMIN | Edita datos; `password` opcional |
| PATCH | `/usuarios/:id/estado` | ADMIN | `{ activo }` |
| GET | `/dashboard/resumen` | Todos | Indicadores según el rol |

## Productos y recetas

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/productos` | Todos | Filtros: `categoriaId`, `tipo`, `activo`, `q` |
| GET | `/productos/:id` | Todos | Incluye receta y artículo vinculado |
| POST | `/productos` | BODEGA | `{ nombre, precio, tipo, categoriaId, articuloId?, receta?: [{ articuloId, cantidad }] }` |
| PUT | `/productos/:id` | BODEGA | Mismo cuerpo que POST |
| PUT | `/productos/:id/receta` | BODEGA | `{ receta: [{ articuloId, cantidad }] }` reemplaza la receta |
| PATCH | `/productos/:id/estado` | BODEGA | `{ activo }` |
| GET | `/productos/categorias` | Todos | Categorías del menú |
| POST | `/productos/categorias` | BODEGA | `{ nombre }` |

## Inventario

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/inventario/alertas` | Todos | Artículos con stock ≤ mínimo |
| GET | `/inventario/articulos` | BODEGA | Filtros: `tipo` (`MATERIA_PRIMA`, `REVENTA`), `activo`, `q` |
| GET | `/inventario/articulos/:id` | BODEGA | Detalle |
| GET | `/inventario/articulos/:id/kardex` | BODEGA | Movimientos; filtros `desde`, `hasta` (YYYY-MM-DD) |
| POST | `/inventario/articulos` | BODEGA | `{ nombre, tipo, unidad, stockMinimo, costoUnitario, stockInicial? }` |
| PUT | `/inventario/articulos/:id` | BODEGA | Edita datos (el stock solo cambia por movimientos) |
| POST | `/inventario/ajustes` | BODEGA | `{ articuloId, tipo: ENTRADA \| MERMA \| AJUSTE, cantidad, motivo }`; en `AJUSTE` la cantidad es la existencia contada |

## Ventas (POS)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/ventas` | CAJERO | Crea venta, ver cuerpo abajo |
| GET | `/ventas` | CAJERO | Filtros: `desde`, `hasta`, `tipoDocumento`, `estado`, `turnoId` |
| GET | `/ventas/:id` | CAJERO | Documento con detalle y pagos |
| PATCH | `/ventas/:id/anular` | ADMIN | `{ motivo }`; solo si el turno sigue abierto |
| GET | `/ventas/correlativos` | CAJERO | Estado de los correlativos |

```json
{
  "tipoDocumento": "CCF",
  "tipoServicio": "MESA",
  "mesa": "4",
  "cliente": { "nombre": "Empresa X", "nit": "0614-...", "nrc": "1234-5", "giro": "Comercio", "direccion": "..." },
  "items": [{ "productoId": 1, "cantidad": 3 }],
  "pagos": [
    { "metodo": "EFECTIVO", "monto": 2.0 },
    { "metodo": "BITCOIN", "monto": 1.0, "referencia": "id-transaccion" }
  ]
}
```

La suma de `pagos` debe ser igual al total. `cliente` solo es obligatorio para CCF.

## Caja

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/caja/turno-actual` | CAJERO | Turno abierto del usuario o `null` |
| GET | `/caja/turno-actual/resumen` | CAJERO | Totales por método y montos esperados |
| GET | `/caja/turno-actual/pagos` | CAJERO | Cobros del turno |
| POST | `/caja/apertura` | CAJERO | `{ fondoInicial }` |
| POST | `/caja/cierre` | CAJERO | `{ contadoEfectivo, contadoTarjeta, contadoBitcoin, observaciones? }` |
| GET | `/caja/turnos` | CAJERO | Historial (ADMIN ve todos los cajeros) |
| GET | `/caja/turnos/:id/resumen` | CAJERO | Resumen de un turno |

## Compras y cuentas por pagar

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/proveedores` | BODEGA | Filtros: `activo`, `q` |
| POST | `/proveedores` | BODEGA | `{ nombre, nit?, nrc?, telefono?, email?, direccion?, diasCredito? }` |
| PUT | `/proveedores/:id` | BODEGA | Mismo cuerpo |
| PATCH | `/proveedores/:id/estado` | BODEGA | `{ activo }` |
| GET | `/compras` | BODEGA | Filtros: `proveedorId`, `estado`, `desde`, `hasta` |
| GET | `/compras/:id` | BODEGA | Detalle con abonos |
| POST | `/compras` | BODEGA | `{ proveedorId, tipoDocumento, numeroDocumento, fechaEmision, condicion, fechaVencimiento?, detalles: [{ articuloId, cantidad, costoUnitario }] }` |
| GET | `/cuentas-por-pagar` | BODEGA | Compras pendientes con `diasParaVencer` y `vencida`; filtro `soloVencidas=true` |
| GET | `/cuentas-por-pagar/resumen` | BODEGA | Totales pendiente / vencido y saldo por proveedor |
| POST | `/cuentas-por-pagar/:compraId/abonos` | BODEGA | `{ monto, metodo, referencia? }` |

## Nómina

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/nomina/empleados` | RRHH | Filtros: `activo`, `q` |
| POST | `/nomina/empleados` | RRHH | `{ nombres, apellidos, dui, cargo, salarioMensual, fechaIngreso, nit?, numeroIsss?, nup? }` |
| PUT | `/nomina/empleados/:id` | RRHH | Mismo cuerpo |
| PATCH | `/nomina/empleados/:id/estado` | RRHH | `{ activo }` |
| GET | `/nomina/parametros` | RRHH | IVA, ISSS, AFP y techos |
| PUT | `/nomina/parametros/:clave` | ADMIN | `{ valor }` |
| GET | `/nomina/tramos-renta` | RRHH | Tabla de retención quincenal |
| PUT | `/nomina/tramos-renta/:id` | ADMIN | `{ desde, hasta, porcentaje, sobreExceso, cuotaFija }` |
| GET | `/nomina/planillas` | RRHH | Planillas generadas |
| GET | `/nomina/planillas/:id` | RRHH | Planilla con detalle por empleado |
| POST | `/nomina/planillas` | RRHH | `{ anio, mes, quincena: 1 \| 2 }` genera la planilla de empleados activos |
| PUT | `/nomina/planillas/:id/detalles/:detalleId` | RRHH | `{ otrosIngresos, otrosDescuentos }` recalcula (solo en borrador) |
| PATCH | `/nomina/planillas/:id/aprobar` | RRHH | Aprueba (ya no se puede editar) |
| DELETE | `/nomina/planillas/:id` | RRHH | Elimina un borrador |
