-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'CAJERO', 'BODEGA', 'RRHH');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('ELABORADO', 'REVENTA');

-- CreateEnum
CREATE TYPE "TipoArticulo" AS ENUM ('MATERIA_PRIMA', 'REVENTA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('FACTURA', 'CCF');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('MESA', 'LLEVAR', 'DOMICILIO');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'BITCOIN');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "CondicionCompra" AS ENUM ('CONTADO', 'CREDITO');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA');

-- CreateEnum
CREATE TYPE "EstadoPlanilla" AS ENUM ('BORRADOR', 'APROBADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoProducto" NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "articuloId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articulos_inventario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoArticulo" NOT NULL,
    "unidad" TEXT NOT NULL,
    "stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articulos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas_detalle" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "recetas_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" SERIAL NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "stockAnterior" DECIMAL(12,3) NOT NULL,
    "stockNuevo" DECIMAL(12,3) NOT NULL,
    "referencia" TEXT,
    "ventaId" INTEGER,
    "compraId" INTEGER,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correlativos" (
    "id" SERIAL NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "serie" TEXT NOT NULL,
    "actual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "correlativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipoServicio" "TipoServicio" NOT NULL,
    "mesa" TEXT,
    "clienteNombre" TEXT,
    "clienteNit" TEXT,
    "clienteNrc" TEXT,
    "clienteGiro" TEXT,
    "clienteDireccion" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'PAGADA',
    "motivoAnulacion" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "turnoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_detalle" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ventas_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "referencia" TEXT,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_caja" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ABIERTO',
    "fondoInicial" DECIMAL(10,2) NOT NULL,
    "abiertoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" TIMESTAMP(3),
    "esperadoEfectivo" DECIMAL(10,2),
    "esperadoTarjeta" DECIMAL(10,2),
    "esperadoBitcoin" DECIMAL(10,2),
    "contadoEfectivo" DECIMAL(10,2),
    "contadoTarjeta" DECIMAL(10,2),
    "contadoBitcoin" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "observaciones" TEXT,

    CONSTRAINT "turnos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "nrc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "diasCredito" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "proveedorId" INTEGER NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "fechaEmision" DATE NOT NULL,
    "fechaVencimiento" DATE,
    "condicion" "CondicionCompra" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoCompra" NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras_detalle" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "articuloId" INTEGER NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "costoUnitario" DECIMAL(12,4) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "compras_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos_compra" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "usuarioId" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dui" TEXT NOT NULL,
    "nit" TEXT,
    "numeroIsss" TEXT,
    "nup" TEXT,
    "cargo" TEXT NOT NULL,
    "salarioMensual" DECIMAL(10,2) NOT NULL,
    "fechaIngreso" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planillas" (
    "id" SERIAL NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "quincena" INTEGER NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "estado" "EstadoPlanilla" NOT NULL DEFAULT 'BORRADOR',
    "totalDevengado" DECIMAL(12,2) NOT NULL,
    "totalIsss" DECIMAL(12,2) NOT NULL,
    "totalAfp" DECIMAL(12,2) NOT NULL,
    "totalRenta" DECIMAL(12,2) NOT NULL,
    "totalLiquido" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobadaEn" TIMESTAMP(3),

    CONSTRAINT "planillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planillas_detalle" (
    "id" SERIAL NOT NULL,
    "planillaId" INTEGER NOT NULL,
    "empleadoId" INTEGER NOT NULL,
    "salarioQuincenal" DECIMAL(10,2) NOT NULL,
    "otrosIngresos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "devengado" DECIMAL(10,2) NOT NULL,
    "isss" DECIMAL(10,2) NOT NULL,
    "afp" DECIMAL(10,2) NOT NULL,
    "renta" DECIMAL(10,2) NOT NULL,
    "otrosDescuentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDescuentos" DECIMAL(10,2) NOT NULL,
    "liquido" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "planillas_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_ley" (
    "clave" TEXT NOT NULL,
    "valor" DECIMAL(12,4) NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "parametros_ley_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "tramos_renta" (
    "id" SERIAL NOT NULL,
    "periodicidad" TEXT NOT NULL DEFAULT 'QUINCENAL',
    "tramo" INTEGER NOT NULL,
    "desde" DECIMAL(12,2) NOT NULL,
    "hasta" DECIMAL(12,2),
    "porcentaje" DECIMAL(5,4) NOT NULL,
    "sobreExceso" DECIMAL(12,2) NOT NULL,
    "cuotaFija" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "tramos_renta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_nombre_key" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "articulos_inventario_nombre_key" ON "articulos_inventario"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "recetas_detalle_productoId_articuloId_key" ON "recetas_detalle"("productoId", "articuloId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_articuloId_createdAt_idx" ON "movimientos_inventario"("articuloId", "createdAt");

-- CreateIndex
CREATE INDEX "movimientos_inventario_ventaId_idx" ON "movimientos_inventario"("ventaId");

-- CreateIndex
CREATE UNIQUE INDEX "correlativos_tipoDocumento_serie_key" ON "correlativos"("tipoDocumento", "serie");

-- CreateIndex
CREATE INDEX "ventas_createdAt_idx" ON "ventas"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_tipoDocumento_serie_numero_key" ON "ventas"("tipoDocumento", "serie", "numero");

-- CreateIndex
CREATE INDEX "turnos_caja_usuarioId_estado_idx" ON "turnos_caja"("usuarioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nit_key" ON "proveedores"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "compras_proveedorId_tipoDocumento_numeroDocumento_key" ON "compras"("proveedorId", "tipoDocumento", "numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_dui_key" ON "empleados"("dui");

-- CreateIndex
CREATE UNIQUE INDEX "planillas_anio_mes_quincena_key" ON "planillas"("anio", "mes", "quincena");

-- CreateIndex
CREATE UNIQUE INDEX "planillas_detalle_planillaId_empleadoId_key" ON "planillas_detalle"("planillaId", "empleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "tramos_renta_periodicidad_tramo_key" ON "tramos_renta"("periodicidad", "tramo");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_detalle" ADD CONSTRAINT "recetas_detalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas_detalle" ADD CONSTRAINT "recetas_detalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_detalle" ADD CONSTRAINT "ventas_detalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_detalle" ADD CONSTRAINT "ventas_detalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_detalle" ADD CONSTRAINT "compras_detalle_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras_detalle" ADD CONSTRAINT "compras_detalle_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "articulos_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_compra" ADD CONSTRAINT "abonos_compra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos_compra" ADD CONSTRAINT "abonos_compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planillas_detalle" ADD CONSTRAINT "planillas_detalle_planillaId_fkey" FOREIGN KEY ("planillaId") REFERENCES "planillas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planillas_detalle" ADD CONSTRAINT "planillas_detalle_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
