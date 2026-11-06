# Orígenes SV — ERP y POS para Restaurante

Sistema web ERP + Punto de Venta para **Restaurante Orígenes SV** (Caso de negocio 1).
Proyecto de la asignatura Programación Web — 2026.

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite, React Router, Tailwind CSS, Axios |
| Backend | Node.js 20 LTS + Express (API REST sobre HTTP) |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma |
| Control de versiones | Git + GitHub (8 integrantes) |

---

## Índice

1. [Módulos del sistema](#1-módulos-del-sistema)
2. [Arquitectura de carpetas](#2-arquitectura-de-carpetas)
3. [Requisitos previos (Windows 10)](#3-requisitos-previos-windows-10)
4. [Instalación y ejecución local](#4-instalación-y-ejecución-local)
5. [Variables de entorno](#5-variables-de-entorno)
6. [Scripts disponibles](#6-scripts-disponibles)
7. [Convenciones técnicas y buenas prácticas](#7-convenciones-técnicas-y-buenas-prácticas)
8. [Flujo de trabajo colaborativo en GitHub](#8-flujo-de-trabajo-colaborativo-en-github)
9. [Roles del equipo](#9-roles-del-equipo)
10. [Documentación externa y defensa](#10-documentación-externa-y-defensa)
11. [Bibliografía y declaración de uso de IA](#11-bibliografía-y-declaración-de-uso-de-ia)
12. [Solución de problemas comunes](#12-solución-de-problemas-comunes)

---

## 1. Módulos del sistema

### 1.1 Ventas (POS)
- Interfaz táctil de toma de pedidos por mesa, para llevar o a domicilio.
- Emisión de **Factura de Consumidor Final** (precio con IVA incluido) y **Comprobante de Crédito Fiscal (CCF)** (IVA desglosado).
- **IVA 13 %** calculado en el backend; el frontend solo lo muestra.
- **Correlativos** independientes por tipo de documento y serie, generados dentro de una transacción de base de datos para impedir números duplicados entre cajas concurrentes.
- Al cerrar una venta se dispara el descuento de inventario (ver 1.2).

### 1.2 Inventario
- **Productos elaborados**: cada producto tiene una receta (lista de materias primas y cantidades). Al procesar la venta se descuenta la materia prima según la receta × cantidad vendida.
- **Artículos de reventa** (bebidas embotelladas, snacks): descuento directo 1 a 1.
- **Alertas de stock mínimo** configurables por artículo, visibles en el dashboard.
- Kardex de movimientos (entradas, salidas, ajustes, mermas).

### 1.3 Compras y Cuentas por Pagar
- Registro de proveedores y de sus facturas/CCF de compra (IVA crédito fiscal).
- La compra incrementa el inventario de materia prima o reventa.
- Control de **cuentas por pagar**: saldo, vencimiento, abonos y estado.

### 1.4 Caja
- Apertura y cierre de turno con fondo inicial.
- Registro de cobros por método: **efectivo, tarjeta y Bitcoin / Chivo Wallet**.
- **Cuadre de caja**: comparación del monto esperado por el sistema contra el contado, con reporte de diferencias.

### 1.5 Nómina
- Planillas **quincenales**.
- Deducciones de ley de El Salvador (porcentajes y topes parametrizados en base de datos, no quemados en el código):
  - **ISSS** laboral: 3 % (aplicando el techo de cotización vigente).
  - **AFP** laboral: 7.25 %.
  - **Impuesto sobre la Renta**: retención según la tabla quincenal vigente del Ministerio de Hacienda, calculada sobre el salario menos ISSS y AFP.
- Generación de boleta de pago por empleado y reporte consolidado de planilla.

### 1.6 Transversales
- Autenticación con JWT y control de acceso por rol (Administrador, Cajero, Mesero, Cocina, Bodega, RR. HH.).
- Dashboard con indicadores de ventas, stock bajo y cuentas por pagar vencidas.

> Fuera de alcance: facturación electrónica (DTE) ante el Ministerio de Hacienda e integración real con la API de Chivo Wallet; el pago con Bitcoin se registra como método de pago con su referencia de transacción.

---

## 2. Arquitectura de carpetas

Monorepo con *npm workspaces*: un solo `git clone` y un solo `npm install`.

```text
origenes-sv-erp/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    # Lint + build en cada Pull Request
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── CODEOWNERS                    # Revisores obligatorios por carpeta/módulo
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma             # Modelos de datos
│   │   ├── migrations/               # Historial de migraciones (versionado)
│   │   └── seed.js                   # Datos iniciales: roles, usuario admin, tablas de Renta/ISSS/AFP
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                # Lectura y validación de variables de entorno
│   │   │   └── prisma.js             # Instancia única de PrismaClient
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── notFound.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   └── auth.validator.js
│   │   │   ├── usuarios/
│   │   │   ├── ventas/
│   │   │   │   ├── ventas.routes.js
│   │   │   │   ├── ventas.controller.js
│   │   │   │   ├── ventas.service.js
│   │   │   │   ├── ventas.validator.js
│   │   │   │   └── correlativo.service.js
│   │   │   ├── productos/
│   │   │   ├── inventario/
│   │   │   │   ├── inventario.routes.js
│   │   │   │   ├── inventario.controller.js
│   │   │   │   ├── inventario.service.js
│   │   │   │   ├── receta.service.js
│   │   │   │   └── inventario.validator.js
│   │   │   ├── compras/
│   │   │   ├── proveedores/
│   │   │   ├── cuentas-por-pagar/
│   │   │   ├── caja/
│   │   │   └── nomina/
│   │   │       ├── nomina.routes.js
│   │   │       ├── nomina.controller.js
│   │   │       ├── nomina.service.js
│   │   │       ├── deducciones.service.js
│   │   │       └── nomina.validator.js
│   │   ├── utils/
│   │   │   ├── AppError.js           # Error de dominio con código HTTP
│   │   │   ├── asyncHandler.js       # Envoltura try/catch para controladores async
│   │   │   ├── money.js              # Redondeo monetario a 2 decimales
│   │   │   └── constants.js          # IVA, tipos de documento, métodos de pago
│   │   ├── routes/
│   │   │   └── index.js              # Monta /api/v1/<modulo>
│   │   ├── app.js                    # Configuración de Express
│   │   └── server.js                 # Arranque del servidor HTTP
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── nodemon.json
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosClient.js        # Base URL, token e interceptores de error
│   │   │   ├── auth.api.js
│   │   │   ├── ventas.api.js
│   │   │   ├── inventario.api.js
│   │   │   ├── compras.api.js
│   │   │   ├── caja.api.js
│   │   │   └── nomina.api.js
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Input, Modal, Table, Badge, Spinner
│   │   │   └── common/               # Navbar, Sidebar, ProtectedRoute, StockAlert
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useFetch.js           # useState + useEffect para peticiones
│   │   │   └── useCart.js            # Estado del pedido en el POS
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── ventas/               # POS, historial, detalle de documento
│   │   │   ├── inventario/           # Materia prima, recetas, reventa, kardex
│   │   │   ├── compras/              # Proveedores, facturas, cuentas por pagar
│   │   │   ├── caja/                 # Apertura, cobros, cierre y cuadre
│   │   │   ├── nomina/               # Empleados, planillas, boletas
│   │   │   └── NotFound.jsx
│   │   ├── routes/
│   │   │   └── AppRouter.jsx         # React Router con rutas protegidas por rol
│   │   ├── utils/
│   │   │   ├── formatters.js         # Moneda USD, fechas
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                 # Directivas de Tailwind
│   ├── .env.example
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── investigacion/                # Documento de investigación (IEEE)
│   ├── seguimiento/                  # Flujo de seguimiento de trabajo (.xlsx)
│   ├── manual-usuario/
│   ├── documentacion-tecnica/        # Diagrama ER, endpoints, arquitectura
│   └── defensa/                      # Presentación y guion
│
├── .vscode/
│   └── extensions.json               # Extensiones recomendadas para el equipo
├── .editorconfig
├── .gitattributes                    # Normaliza fin de línea (LF) entre Windows y otros SO
├── .gitignore
├── .nvmrc                            # 20
├── .prettierignore
├── .prettierrc
├── package.json                      # Workspaces y scripts raíz
└── README.md
```

**Patrón del backend por módulo:** `routes` (endpoints y verbos HTTP) → `validator` (forma del request) → `controller` (lee `req`, responde `res`) → `service` (lógica de negocio, Prisma, transacciones). Los controladores no acceden a Prisma directamente.

**Convención REST:** `GET /api/v1/ventas`, `GET /api/v1/ventas/:id`, `POST /api/v1/ventas`, `PUT|PATCH /api/v1/ventas/:id`, `DELETE /api/v1/ventas/:id`. Respuestas en JSON con códigos HTTP correctos (200, 201, 400, 401, 403, 404, 409, 500).

---

## 3. Requisitos previos (Windows 10)

| Herramienta | Versión | Descarga |
|-------------|---------|----------|
| Git for Windows | 2.40+ | https://git-scm.com/download/win |
| Node.js LTS (incluye npm) | 20.x | https://nodejs.org |
| PostgreSQL (incluye pgAdmin y `psql`) | 16.x | https://www.postgresql.org/download/windows/ |
| Visual Studio Code (recomendado) | Última | https://code.visualstudio.com |

Extensiones recomendadas de VS Code: ESLint, Prettier, Prisma, Tailwind CSS IntelliSense.

Verificar en **PowerShell**:

```powershell
git --version
node -v
npm -v
psql --version
```

Si `psql` no se reconoce, agregar `C:\Program Files\PostgreSQL\16\bin` a la variable de entorno `Path` del sistema y abrir una nueva ventana de PowerShell.

Si PowerShell bloquea `npm` o `npx` con un error de *execution policy*, ejecutar una vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 4. Instalación y ejecución local

Todos los comandos se ejecutan en **PowerShell**.

### 4.1 Clonar el repositorio

```powershell
git clone https://github.com/<organizacion>/origenes-sv-erp.git
cd origenes-sv-erp
```

### 4.2 Instalar dependencias (frontend y backend)

```powershell
npm install
```

### 4.3 Crear la base de datos

Usar la contraseña del usuario `postgres` definida al instalar PostgreSQL:

```powershell
psql -U postgres -c "CREATE DATABASE origenes_sv;"
```

(Alternativa: pgAdmin → *Databases* → *Create* → *Database* → `origenes_sv`.)

### 4.4 Configurar variables de entorno

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Editar `backend\.env` y colocar la contraseña real de PostgreSQL en `DATABASE_URL`.

### 4.5 Ejecutar migraciones y datos semilla

```powershell
npm run db:migrate
npm run db:seed
```

### 4.6 Levantar el proyecto

```powershell
npm run dev
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Health check | http://localhost:3000/api/v1/health |

Las credenciales del usuario administrador inicial se definen en `backend\prisma\seed.js` y deben cambiarse tras el primer inicio de sesión.

---

## 5. Variables de entorno

`backend/.env.example`

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:TU_CONTRASENA@localhost:5432/origenes_sv?schema=public"
JWT_SECRET=cambiar_por_cadena_larga_y_aleatoria
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

`frontend/.env.example`

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Los archivos `.env` **nunca** se suben al repositorio (incluidos en `.gitignore`).

---

## 6. Scripts disponibles

Ejecutar desde la raíz:

| Comando | Acción |
|---------|--------|
| `npm run dev` | Levanta backend y frontend simultáneamente |
| `npm run dev:backend` | Solo API (nodemon) |
| `npm run dev:frontend` | Solo frontend (Vite) |
| `npm run build` | Build de producción del frontend |
| `npm run lint` | ESLint en ambos workspaces |
| `npm run format` | Prettier en todo el proyecto |
| `npm run test` | Pruebas del backend |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `prisma db seed` |
| `npm run db:studio` | Abre Prisma Studio para inspeccionar datos |
| `npm run db:reset` | Borra y recrea la base local (solo desarrollo) |

---

## 7. Convenciones técnicas y buenas prácticas

### 7.1 Manejo de datos con arreglos e iteradores
- Cálculo de totales de pedido, IVA y planillas con `map`, `filter`, `reduce`, `find`, `some` y `every`.
- Descuento de recetas: se recorren los ingredientes de cada producto vendido y se agregan las cantidades por materia prima antes de actualizar el inventario.
- Prohibido mutar el estado de React directamente; se crean nuevos arreglos con spread o `map`.

### 7.2 Promesas y asincronismo
- Toda comunicación Frontend ↔ API usa `async/await` sobre Axios.
- Peticiones independientes en paralelo con `Promise.all` (por ejemplo, la carga inicial del dashboard).
- Operaciones que afectan varias tablas (venta + correlativo + inventario + caja) se ejecutan en `prisma.$transaction` para garantizar atomicidad.

### 7.3 Manejo de errores con try/catch
- **Backend:** los servicios lanzan `AppError` con código HTTP; `asyncHandler` captura los errores de cada controlador y los envía a `errorHandler.middleware.js`, que responde con un formato uniforme:
  ```json
  { "success": false, "message": "Stock insuficiente de: Masa de maíz", "code": 409 }
  ```
- **Frontend:** cada llamada a la API se envuelve en `try/catch/finally` para controlar los estados `loading`, `error` y `data`, y mostrar mensajes claros al usuario.

### 7.4 Reglas de negocio críticas
- Montos con `Decimal` en Prisma; nunca `Float` para dinero.
- Porcentajes (IVA, ISSS, AFP), topes y tablas de Renta en tablas de configuración, editables sin modificar código.
- Los correlativos de documentos no se reutilizan; una anulación conserva su número con estado `ANULADO`.

### 7.5 Estilo de código
- ESLint + Prettier obligatorios; el CI rechaza PR con errores de lint.
- Archivos de componentes en `PascalCase.jsx`; hooks como `useNombre.js`; backend en `nombre.capa.js`.
- Nombres de dominio en español (`venta`, `receta`, `planilla`); palabras clave técnicas en inglés.

---

## 8. Flujo de trabajo colaborativo en GitHub

### 8.1 Ramas

| Rama | Propósito |
|------|-----------|
| `main` | Versión estable entregable. Protegida, solo recibe merges desde `develop`. |
| `develop` | Integración del equipo. Protegida, requiere PR. |
| `feature/<modulo>-<descripcion>` | Nueva funcionalidad, p. ej. `feature/ventas-correlativos` |
| `fix/<modulo>-<descripcion>` | Corrección de errores |
| `docs/<descripcion>` | Documentación |

### 8.2 Ciclo de trabajo

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/inventario-alertas-stock
# ... cambios ...
git add .
git commit -m "feat(inventario): alerta de stock mínimo en dashboard"
git push -u origin feature/inventario-alertas-stock
```

Después, abrir un **Pull Request hacia `develop`** en GitHub.

### 8.3 Reglas
- Commits con **Conventional Commits**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, con el módulo como alcance.
- Cada PR requiere **al menos 1 aprobación** (definida en `CODEOWNERS`) y el CI en verde.
- Cada PR enlaza su issue (`Closes #<número>`) y se gestiona en **GitHub Projects** (tablero Kanban: *Backlog → En progreso → En revisión → Hecho*).
- Las migraciones de Prisma solo las crea el responsable de base de datos o se revisan con él, para evitar conflictos en `schema.prisma`.
- Nadie hace `push` directo a `main` ni a `develop`.

---

## 9. Roles del equipo

| # | Rol | Responsabilidades | Integrante |
|---|-----|-------------------|------------|
| 1 | **Tech Lead / Arquitecto** | Arquitectura, revisión final de PR, protección de ramas, CI, integración frontend-backend | _Nombre_ |
| 2 | **Líder Backend** | Estructura Express, autenticación, middlewares, módulo de **Ventas** y correlativos | _Nombre_ |
| 3 | **Desarrollador Backend** | Módulos de **Inventario**, recetas, **Compras** y cuentas por pagar | _Nombre_ |
| 4 | **Desarrollador Backend** | Módulos de **Caja** y **Nómina** (ISSS, AFP, Renta) | _Nombre_ |
| 5 | **Administrador de Base de Datos** | Modelo ER, `schema.prisma`, migraciones, seed, integridad de datos | _Nombre_ |
| 6 | **Líder Frontend / UI-UX** | Sistema de diseño con Tailwind, layouts, enrutador, interfaz del **POS** | _Nombre_ |
| 7 | **Desarrollador Frontend** | Pantallas de Inventario, Compras, Caja, Nómina y Dashboard | _Nombre_ |
| 8 | **QA y Documentación / Scrum Master** | Pruebas, seguimiento en Excel, manual de usuario, documentación técnica, investigación IEEE | _Nombre_ |

Todos los integrantes deben poder explicar técnicamente cualquier parte del código durante la defensa.

---

## 10. Documentación externa y defensa

La **defensa presencial inicia el 18 de noviembre de 2026**. Antes de esa fecha deben estar completos y ubicados en `docs/`:

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Investigación (formato **IEEE**) | `docs/investigacion/` | Marco teórico de las tecnologías, normativa fiscal y laboral de El Salvador aplicada, referencias en formato IEEE |
| Flujo de seguimiento de trabajo (**Excel**) | `docs/seguimiento/` | Tareas, responsable, fecha de inicio y fin, estado, enlace al PR o issue |
| **Manual de usuario** | `docs/manual-usuario/` | Guía por rol con capturas: POS, inventario, compras, caja y nómina |
| **Documentación técnica** | `docs/documentacion-tecnica/` | Diagrama de arquitectura, diagrama ER, catálogo de endpoints REST, reglas de negocio, guía de despliegue |
| Material de defensa | `docs/defensa/` | Presentación y guion de demostración |

---

## 11. Bibliografía y declaración de uso de IA

### 11.1 Referencias (formato IEEE)

[1] Meta Open Source, "React Documentation," 2026. [Online]. Available: https://react.dev

[2] Vite Team, "Vite Guide," 2026. [Online]. Available: https://vite.dev/guide/

[3] Remix Software, "React Router Documentation," 2026. [Online]. Available: https://reactrouter.com

[4] Tailwind Labs, "Tailwind CSS Documentation," 2026. [Online]. Available: https://tailwindcss.com/docs

[5] OpenJS Foundation, "Express — Node.js web application framework," 2026. [Online]. Available: https://expressjs.com

[6] OpenJS Foundation, "Node.js Documentation," 2026. [Online]. Available: https://nodejs.org/docs

[7] The PostgreSQL Global Development Group, "PostgreSQL 16 Documentation," 2026. [Online]. Available: https://www.postgresql.org/docs/16/

[8] Prisma Data, Inc., "Prisma ORM Documentation," 2026. [Online]. Available: https://www.prisma.io/docs

[9] Asamblea Legislativa de El Salvador, "Ley de Impuesto a la Transferencia de Bienes Muebles y a la Prestación de Servicios," San Salvador, El Salvador.

[10] Asamblea Legislativa de El Salvador, "Ley de Impuesto sobre la Renta," San Salvador, El Salvador.

[11] Asamblea Legislativa de El Salvador, "Ley del Seguro Social," San Salvador, El Salvador.

[12] Asamblea Legislativa de El Salvador, "Ley Integral del Sistema de Pensiones," San Salvador, El Salvador.

[13] Ministerio de Hacienda de El Salvador, "Tablas de retención del Impuesto sobre la Renta," 2026. [Online]. Available: https://www.mh.gob.sv

### 11.2 Declaración de uso de herramientas de Inteligencia Artificial

El equipo declara el uso de las siguientes herramientas de IA. Todo contenido asistido por IA fue revisado, comprendido y adaptado por los integrantes, quienes pueden explicarlo y defenderlo técnicamente. El uso de IA sin comprensión técnica anula la evaluación por plagio.

| Herramienta | Proveedor | Uso | Archivos / secciones | Integrante responsable |
|-------------|-----------|-----|----------------------|------------------------|
| Claude (Claude Code) | Anthropic | Propuesta de arquitectura de carpetas y redacción inicial de este README | `README.md`, estructura del repositorio | _Nombre_ |
| _Herramienta_ | _Proveedor_ | _Descripción del uso_ | _Ruta del archivo_ | _Nombre_ |

Cada nuevo uso de IA en el código debe registrarse en esta tabla dentro del mismo Pull Request que introduce el cambio.

---

## 12. Solución de problemas comunes

| Problema | Solución |
|----------|----------|
| `psql` no se reconoce como comando | Agregar `C:\Program Files\PostgreSQL\16\bin` al `Path` y reabrir PowerShell |
| Error de *execution policy* al usar `npm`/`npx` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `P1001: Can't reach database server` | Verificar que el servicio `postgresql-x64-16` esté iniciado (`services.msc`) y que `DATABASE_URL` sea correcta |
| `password authentication failed` | Revisar la contraseña de `postgres` en `backend\.env` |
| Puerto 3000 o 5173 ocupado | `netstat -ano \| findstr :3000` y finalizar el proceso, o cambiar `PORT` en `.env` |
| Errores CORS en el navegador | `CORS_ORIGIN` del backend debe coincidir con la URL del frontend |
| Archivos modificados sin cambios reales (fin de línea) | `.gitattributes` normaliza a LF; ejecutar `git config --global core.autocrlf input` |
| Cambios en `schema.prisma` no reflejados | `npm run db:migrate` y reiniciar `npm run dev` |
