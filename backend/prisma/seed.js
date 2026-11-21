import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Credenciales de demostración solo para desarrollo local. Cámbielas en cualquier otro entorno.
const PASSWORD_DEMO = 'CoffeeClick2026!';

const usuarios = [
  { nombre: 'Administrador', email: 'admin@coffeeclick.sv', rol: 'ADMIN' },
  { nombre: 'Cajero Demo', email: 'cajero@coffeeclick.sv', rol: 'CAJERO' },
  { nombre: 'Bodega Demo', email: 'bodega@coffeeclick.sv', rol: 'BODEGA' },
  { nombre: 'RR. HH. Demo', email: 'rrhh@coffeeclick.sv', rol: 'RRHH' },
];

const parametros = [
  { clave: 'IVA', valor: 0.13, descripcion: 'Impuesto al Valor Agregado (IVA)' },
  { clave: 'ISSS_EMPLEADO', valor: 0.03, descripcion: 'Cotización ISSS laboral' },
  { clave: 'ISSS_TECHO_MENSUAL', valor: 1000, descripcion: 'Salario máximo cotizable al ISSS (mensual)' },
  { clave: 'AFP_EMPLEADO', valor: 0.0725, descripcion: 'Cotización AFP laboral' },
  { clave: 'AFP_TECHO_MENSUAL', valor: 7045.06, descripcion: 'Ingreso base de cotización máximo AFP (mensual) - verificar valor vigente' },
];

// Tabla de retención de Renta quincenal (Ministerio de Hacienda). Verificar contra la tabla vigente.
const tramosQuincenales = [
  { tramo: 1, desde: 0.01, hasta: 236.0, porcentaje: 0, sobreExceso: 0, cuotaFija: 0 },
  { tramo: 2, desde: 236.01, hasta: 447.62, porcentaje: 0.1, sobreExceso: 236.0, cuotaFija: 8.83 },
  { tramo: 3, desde: 447.63, hasta: 1019.05, porcentaje: 0.2, sobreExceso: 447.62, cuotaFija: 30.0 },
  { tramo: 4, desde: 1019.06, hasta: null, porcentaje: 0.3, sobreExceso: 1019.05, cuotaFija: 144.28 },
];

// ─────────────── Inventario de una cafetería salvadoreña clásica ───────────────

const articulos = [
  // Materia prima de barra
  { nombre: 'Café molido de altura', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 25, stockMinimo: 6, costoUnitario: 5.5 },
  { nombre: 'Leche entera', tipo: 'MATERIA_PRIMA', unidad: 'litro', stock: 40, stockMinimo: 10, costoUnitario: 1.1 },
  { nombre: 'Azúcar', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 40, stockMinimo: 10, costoUnitario: 0.6 },
  { nombre: 'Canela en raja', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 3, stockMinimo: 1, costoUnitario: 6.0 },
  { nombre: 'Chocolate de tablilla', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 8, stockMinimo: 2, costoUnitario: 4.5 },
  { nombre: 'Semilla de morro para horchata', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 12, stockMinimo: 3, costoUnitario: 2.8 },
  { nombre: 'Hielo', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 60, stockMinimo: 20, costoUnitario: 0.1 },
  { nombre: 'Naranja', tipo: 'MATERIA_PRIMA', unidad: 'unidad', stock: 80, stockMinimo: 30, costoUnitario: 0.12 },
  { nombre: 'Fruta picada para ensalada', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 10, stockMinimo: 4, costoUnitario: 1.2 },
  // Materia prima de cocina
  { nombre: 'Huevos', tipo: 'MATERIA_PRIMA', unidad: 'unidad', stock: 90, stockMinimo: 30, costoUnitario: 0.18 },
  { nombre: 'Frijoles fritos', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 15, stockMinimo: 5, costoUnitario: 1.1 },
  { nombre: 'Plátano maduro', tipo: 'MATERIA_PRIMA', unidad: 'unidad', stock: 4, stockMinimo: 12, costoUnitario: 0.25 },
  { nombre: 'Queso duro blandito', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 6, stockMinimo: 2, costoUnitario: 3.5 },
  { nombre: 'Crema salvadoreña', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 8, stockMinimo: 3, costoUnitario: 2.75 },
  { nombre: 'Tortillas', tipo: 'MATERIA_PRIMA', unidad: 'unidad', stock: 100, stockMinimo: 40, costoUnitario: 0.06 },
  { nombre: 'Pan francés', tipo: 'MATERIA_PRIMA', unidad: 'unidad', stock: 40, stockMinimo: 20, costoUnitario: 0.15 },
  { nombre: 'Pollo deshebrado en salsa', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 10, stockMinimo: 4, costoUnitario: 3.2 },
  { nombre: 'Lechuga, tomate y pepino', tipo: 'MATERIA_PRIMA', unidad: 'lb', stock: 5, stockMinimo: 2, costoUnitario: 1.0 },
  // Pan dulce de panadería (reventa)
  { nombre: 'Quesadilla salvadoreña (porción)', tipo: 'REVENTA', unidad: 'porción', stock: 20, stockMinimo: 8, costoUnitario: 0.65 },
  { nombre: 'Semita de piña (porción)', tipo: 'REVENTA', unidad: 'porción', stock: 15, stockMinimo: 6, costoUnitario: 0.5 },
  { nombre: 'Salpores de arroz (bolsita)', tipo: 'REVENTA', unidad: 'bolsita', stock: 12, stockMinimo: 6, costoUnitario: 0.35 },
  { nombre: 'Marquesote (porción)', tipo: 'REVENTA', unidad: 'porción', stock: 4, stockMinimo: 6, costoUnitario: 0.45 },
  { nombre: 'Empanada de leche', tipo: 'REVENTA', unidad: 'unidad', stock: 18, stockMinimo: 8, costoUnitario: 0.5 },
  { nombre: 'Torta de yema (porción)', tipo: 'REVENTA', unidad: 'porción', stock: 10, stockMinimo: 5, costoUnitario: 0.55 },
  // Bebidas embotelladas (reventa)
  { nombre: 'Agua embotellada 600 ml', tipo: 'REVENTA', unidad: 'unidad', stock: 48, stockMinimo: 24, costoUnitario: 0.3 },
  { nombre: 'Kolashanpan 355 ml', tipo: 'REVENTA', unidad: 'unidad', stock: 10, stockMinimo: 24, costoUnitario: 0.5 },
];

// ─────────────── Menú ───────────────

const productos = [
  // Cafés y chocolate
  { nombre: 'Café de palo (colado)', categoria: 'Cafés y chocolate', precio: 1.0, descripcion: 'Café colado en bolsa de tela, como en casa de la abuela', receta: [['Café molido de altura', 0.035], ['Azúcar', 0.03], ['Canela en raja', 0.003]] },
  { nombre: 'Espresso', categoria: 'Cafés y chocolate', precio: 1.25, receta: [['Café molido de altura', 0.03]] },
  { nombre: 'Café americano', categoria: 'Cafés y chocolate', precio: 1.25, receta: [['Café molido de altura', 0.03], ['Azúcar', 0.02]] },
  { nombre: 'Café con leche', categoria: 'Cafés y chocolate', precio: 1.5, receta: [['Café molido de altura', 0.03], ['Leche entera', 0.2], ['Azúcar', 0.02]] },
  { nombre: 'Capuchino', categoria: 'Cafés y chocolate', precio: 2.25, receta: [['Café molido de altura', 0.04], ['Leche entera', 0.25], ['Canela en raja', 0.002]] },
  { nombre: 'Latte', categoria: 'Cafés y chocolate', precio: 2.5, receta: [['Café molido de altura', 0.04], ['Leche entera', 0.3]] },
  { nombre: 'Chocolate caliente', categoria: 'Cafés y chocolate', precio: 1.75, descripcion: 'Chocolate de tablilla batido con leche y canela', receta: [['Chocolate de tablilla', 0.06], ['Leche entera', 0.25], ['Canela en raja', 0.002]] },
  // Bebidas frías
  { nombre: 'Frappé de café', categoria: 'Bebidas frías', precio: 3.25, receta: [['Café molido de altura', 0.04], ['Leche entera', 0.25], ['Hielo', 0.6], ['Azúcar', 0.05]] },
  { nombre: 'Horchata de morro', categoria: 'Bebidas frías', precio: 1.5, receta: [['Semilla de morro para horchata', 0.08], ['Azúcar', 0.05], ['Hielo', 0.3]] },
  { nombre: 'Fresco de ensalada', categoria: 'Bebidas frías', precio: 1.75, receta: [['Fruta picada para ensalada', 0.25], ['Azúcar', 0.04], ['Hielo', 0.3]] },
  { nombre: 'Jugo de naranja natural', categoria: 'Bebidas frías', precio: 2.0, receta: [['Naranja', 4]] },
  // Desayunos y antojos
  { nombre: 'Desayuno típico', categoria: 'Desayunos', precio: 4.5, descripcion: 'Huevos al gusto, frijoles, plátano frito, queso, crema y tortillas', receta: [['Huevos', 2], ['Frijoles fritos', 0.15], ['Plátano maduro', 1], ['Queso duro blandito', 0.08], ['Crema salvadoreña', 0.06], ['Tortillas', 3]] },
  { nombre: 'Pan con pollo', categoria: 'Desayunos', precio: 3.5, descripcion: 'Pan francés con pollo en salsa y verduras', receta: [['Pan francés', 1], ['Pollo deshebrado en salsa', 0.2], ['Lechuga, tomate y pepino', 0.05]] },
  { nombre: 'Pan francés con frijoles y crema', categoria: 'Desayunos', precio: 1.5, receta: [['Pan francés', 1], ['Frijoles fritos', 0.08], ['Crema salvadoreña', 0.04]] },
  { nombre: 'Plátanos fritos con crema y frijoles', categoria: 'Desayunos', precio: 2.75, receta: [['Plátano maduro', 1], ['Crema salvadoreña', 0.05], ['Frijoles fritos', 0.08]] },
  // Pan dulce (reventa)
  { nombre: 'Quesadilla salvadoreña', categoria: 'Pan dulce', precio: 1.25, reventa: 'Quesadilla salvadoreña (porción)' },
  { nombre: 'Semita de piña', categoria: 'Pan dulce', precio: 1.0, reventa: 'Semita de piña (porción)' },
  { nombre: 'Salpores de arroz', categoria: 'Pan dulce', precio: 0.75, reventa: 'Salpores de arroz (bolsita)' },
  { nombre: 'Marquesote', categoria: 'Pan dulce', precio: 0.9, reventa: 'Marquesote (porción)' },
  { nombre: 'Empanada de leche', categoria: 'Pan dulce', precio: 1.0, reventa: 'Empanada de leche' },
  { nombre: 'Torta de yema', categoria: 'Pan dulce', precio: 1.1, reventa: 'Torta de yema (porción)' },
  // Embotellados (reventa)
  { nombre: 'Agua embotellada', categoria: 'Embotellados', precio: 0.75, reventa: 'Agua embotellada 600 ml' },
  { nombre: 'Kolashanpan', categoria: 'Embotellados', precio: 1.25, reventa: 'Kolashanpan 355 ml' },
];

const proveedores = [
  { nombre: 'Tostaduría Cumbres de Apaneca, S.A. de C.V.', nit: '0614-150390-101-2', nrc: '12345-6', telefono: '2222-1111', diasCredito: 30 },
  { nombre: 'Lácteos La Campiña', nit: '0614-020285-102-3', nrc: '23456-7', telefono: '2233-4455', diasCredito: 15 },
  { nombre: 'Panadería La Espiga Dorada', nit: '0614-111188-104-5', nrc: '45678-9', telefono: '2260-7788', diasCredito: 8 },
  { nombre: 'Distribuidora de Bebidas Cuscatlán', nit: '0614-010180-103-4', nrc: '34567-8', telefono: '2299-0000', diasCredito: 8 },
];

const empleados = [
  { nombres: 'María José', apellidos: 'Hernández López', dui: '01234567-8', cargo: 'Barista', salarioMensual: 450, fechaIngreso: '2024-02-01' },
  { nombres: 'Carlos Ernesto', apellidos: 'Martínez Ramos', dui: '02345678-9', cargo: 'Cajero', salarioMensual: 420, fechaIngreso: '2024-05-15' },
  { nombres: 'Ana Gabriela', apellidos: 'Flores Portillo', dui: '03456789-0', cargo: 'Mesera', salarioMensual: 365, fechaIngreso: '2025-01-10' },
  { nombres: 'José Roberto', apellidos: 'Castillo Mejía', dui: '04567890-1', cargo: 'Administrador', salarioMensual: 1200, fechaIngreso: '2023-08-01' },
  { nombres: 'Claudia Beatriz', apellidos: 'Rivas Guzmán', dui: '05678901-2', cargo: 'Gerente general', salarioMensual: 2600, fechaIngreso: '2023-03-01' },
];

async function main() {
  const hash = await bcrypt.hash(PASSWORD_DEMO, 10);
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: {}, create: { ...u, password: hash } });
  }

  for (const p of parametros) {
    await prisma.parametroLey.upsert({ where: { clave: p.clave }, update: {}, create: p });
  }
  for (const t of tramosQuincenales) {
    await prisma.tramoRenta.upsert({
      where: { periodicidad_tramo: { periodicidad: 'QUINCENAL', tramo: t.tramo } },
      update: {},
      create: { ...t, periodicidad: 'QUINCENAL' },
    });
  }
  for (const tipoDocumento of ['FACTURA', 'CCF']) {
    await prisma.correlativo.upsert({
      where: { tipoDocumento_serie: { tipoDocumento, serie: 'A' } },
      update: {},
      create: { tipoDocumento, serie: 'A', actual: 0 },
    });
  }

  // El catálogo de demostración solo se crea si la base está vacía.
  if ((await prisma.producto.count()) === 0) {
    const admin = await prisma.usuario.findUnique({ where: { email: usuarios[0].email } });

    const articulosPorNombre = new Map();
    for (const { stock, ...datos } of articulos) {
      const articulo = await prisma.articuloInventario.create({ data: { ...datos, stock } });
      await prisma.movimientoInventario.create({
        data: {
          articuloId: articulo.id,
          tipo: 'ENTRADA',
          cantidad: stock,
          stockAnterior: 0,
          stockNuevo: stock,
          referencia: 'Stock inicial',
          usuarioId: admin.id,
        },
      });
      articulosPorNombre.set(articulo.nombre, articulo.id);
    }

    const categorias = [...new Set(productos.map((p) => p.categoria))];
    const categoriaPorNombre = new Map();
    for (const nombre of categorias) {
      const categoria = await prisma.categoria.create({ data: { nombre } });
      categoriaPorNombre.set(nombre, categoria.id);
    }

    for (const p of productos) {
      await prisma.producto.create({
        data: {
          nombre: p.nombre,
          descripcion: p.descripcion ?? null,
          precio: p.precio,
          tipo: p.reventa ? 'REVENTA' : 'ELABORADO',
          categoriaId: categoriaPorNombre.get(p.categoria),
          articuloId: p.reventa ? articulosPorNombre.get(p.reventa) : null,
          receta: {
            create: (p.receta ?? []).map(([articulo, cantidad]) => ({
              articuloId: articulosPorNombre.get(articulo),
              cantidad,
            })),
          },
        },
      });
    }

    await prisma.proveedor.createMany({ data: proveedores });
    await prisma.empleado.createMany({
      data: empleados.map((e) => ({ ...e, fechaIngreso: new Date(e.fechaIngreso) })),
    });
  }

  console.log('Datos iniciales de Coffee Click cargados.');
  console.log(`Usuarios de demostración: ${usuarios.map((u) => u.email).join(', ')}`);
  console.log('La contraseña de demostración está en backend/prisma/seed.js (PASSWORD_DEMO).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
