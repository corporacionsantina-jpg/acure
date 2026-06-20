import fs from 'fs';
import path from 'path';

const DB_PATH = './taller_db.json';
const OUTPUT_PATH = './taller_db.sql';

// Check if db exists
if (!fs.existsSync(DB_PATH)) {
  console.error(`Error: No se encontró el archivo de base de datos JSON en ${DB_PATH}. Por favor inicia el servidor primero.`);
  process.exit(1);
}

try {
  const rawData = fs.readFileSync(DB_PATH, 'utf-8');
  const db = JSON.parse(rawData);

  let sqlContent = `-- =========================================================================\n`;
  sqlContent += `-- SCRIPT SQL AUTO-GENERADO PARA EL SISTEMA TALLER PRO (SISTEMA v1.42)\n`;
  sqlContent += `-- Generado el: ${new Date().toISOString()}\n`;
  sqlContent += `-- Transforma el almacenamiento local taller_db.json a base de datos relacional\n`;
  sqlContent += `-- =========================================================================\n\n`;

  sqlContent += `BEGIN;\n\n`;

  // Drop tables if exist
  sqlContent += `-- 1. ELIMINAR TABLAS EXISTENTES PARA INICIALIZACIÓN LIMPIA (Opcional)\n`;
  sqlContent += `DROP TABLE IF EXISTS facturas CASCADE;\n`;
  sqlContent += `DROP TABLE IF EXISTS historial_reparacion CASCADE;\n`;
  sqlContent += `DROP TABLE IF EXISTS reparaciones CASCADE;\n`;
  sqlContent += `DROP TABLE IF EXISTS equipos CASCADE;\n`;
  sqlContent += `DROP TABLE IF EXISTS clientes CASCADE;\n`;
  sqlContent += `\n`;

  // Create tables
  sqlContent += `-- 2. CREACIÓN DE TABLAS DE LA BASE DE DATOS\n\n`;

  // Clientes
  sqlContent += `CREATE TABLE clientes (\n`;
  sqlContent += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sqlContent += `  cedula VARCHAR(50),\n`;
  sqlContent += `  nombre_completo VARCHAR(255) NOT NULL,\n`;
  sqlContent += `  telefono VARCHAR(50),\n`;
  sqlContent += `  email VARCHAR(100),\n`;
  sqlContent += `  direccion TEXT,\n`;
  sqlContent += `  fecha_registro VARCHAR(100),\n`;
  sqlContent += `  notas TEXT,\n`;
  sqlContent += `  activo BOOLEAN DEFAULT TRUE\n`;
  sqlContent += `);\n\n`;

  // Equipos
  sqlContent += `CREATE TABLE equipos (\n`;
  sqlContent += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sqlContent += `  cliente_id VARCHAR(50) REFERENCES clientes(id) ON DELETE CASCADE,\n`;
  sqlContent += `  marca VARCHAR(100) NOT NULL,\n`;
  sqlContent += `  modelo VARCHAR(100) NOT NULL,\n`;
  sqlContent += `  serial VARCHAR(100) UNIQUE NOT NULL,\n`;
  sqlContent += `  tipo_equipo VARCHAR(50),\n`;
  sqlContent += `  color VARCHAR(50),\n`;
  sqlContent += `  accesorios_recibidos TEXT,\n`;
  sqlContent += `  estado_ingreso VARCHAR(50),\n`;
  sqlContent += `  observaciones_ingreso TEXT,\n`;
  sqlContent += `  fecha_ingreso VARCHAR(100),\n`;
  sqlContent += `  activo BOOLEAN DEFAULT TRUE\n`;
  sqlContent += `);\n\n`;

  // Reparaciones
  sqlContent += `CREATE TABLE reparaciones (\n`;
  sqlContent += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sqlContent += `  equipo_id VARCHAR(50) REFERENCES equipos(id) ON DELETE CASCADE,\n`;
  sqlContent += `  numero_orden VARCHAR(50) UNIQUE NOT NULL,\n`;
  sqlContent += `  fecha_ingreso VARCHAR(100),\n`;
  sqlContent += `  fecha_entrega_prometida VARCHAR(100),\n`;
  sqlContent += `  fecha_entrega_real VARCHAR(100),\n`;
  sqlContent += `  falla_reportada TEXT NOT NULL,\n`;
  sqlContent += `  diagnostico_tecnico TEXT,\n`;
  sqlContent += `  sintomas TEXT,\n`;
  sqlContent += `  trabajo_realizado TEXT,\n`;
  sqlContent += `  repuestos_utilizados TEXT,\n`;
  sqlContent += `  costo_mano_obra NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  costo_repuestos NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  costo_total NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  descuento NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  monto_final NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  estado VARCHAR(50) DEFAULT 'pendiente',\n`;
  sqlContent += `  prioridad VARCHAR(50) DEFAULT 'normal',\n`;
  sqlContent += `  tecnico_asignado VARCHAR(150),\n`;
  sqlContent += `  dias_garantia INTEGER DEFAULT 30,\n`;
  sqlContent += `  fecha_inicio_garantia VARCHAR(100),\n`;
  sqlContent += `  fecha_fin_garantia VARCHAR(100),\n`;
  sqlContent += `  condiciones_garantia TEXT,\n`;
  sqlContent += `  presupuesto_aceptado BOOLEAN DEFAULT FALSE,\n`;
  sqlContent += `  fecha_aceptacion VARCHAR(100),\n`;
  sqlContent += `  firma_cliente TEXT,\n`;
  sqlContent += `  estado_abandono VARCHAR(50) DEFAULT 'activo',\n`;
  sqlContent += `  fecha_abandono VARCHAR(100),\n`;
  sqlContent += `  observaciones_abandono TEXT,\n`;
  sqlContent += `  activo BOOLEAN DEFAULT TRUE\n`;
  sqlContent += `);\n\n`;

  // Historial Reparacion
  sqlContent += `CREATE TABLE historial_reparacion (\n`;
  sqlContent += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sqlContent += `  reparacion_id VARCHAR(50) REFERENCES reparaciones(id) ON DELETE CASCADE,\n`;
  sqlContent += `  fecha VARCHAR(100),\n`;
  sqlContent += `  usuario VARCHAR(150),\n`;
  sqlContent += `  tipo VARCHAR(50),\n`;
  sqlContent += `  comentario TEXT\n`;
  sqlContent += `);\n\n`;

  // Facturas
  sqlContent += `CREATE TABLE facturas (\n`;
  sqlContent += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sqlContent += `  reparacion_id VARCHAR(50) REFERENCES reparaciones(id) ON DELETE CASCADE,\n`;
  sqlContent += `  numero_factura VARCHAR(50) UNIQUE NOT NULL,\n`;
  sqlContent += `  fecha_emision VARCHAR(100),\n`;
  sqlContent += `  subtotal NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  iva NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  total NUMERIC(10,2) DEFAULT 0.00,\n`;
  sqlContent += `  metodo_pago VARCHAR(50),\n`;
  sqlContent += `  referencia_pago VARCHAR(100),\n`;
  sqlContent += `  estado VARCHAR(50),\n`;
  sqlContent += `  created_at VARCHAR(100)\n`;
  sqlContent += `);\n\n`;

  const escapeSql = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'boolean') return str ? 'TRUE' : 'FALSE';
    if (typeof str === 'number') return str;
    if (typeof str === 'object') {
      return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
    }
    return `'${String(str).replace(/'/g, "''")}'`;
  };

  sqlContent += `-- 3. INSERCIÓN DE DATOS ACTUALES RECOPILADOS\n\n`;

  // Clientes
  if (db.clientes && db.clientes.length > 0) {
    sqlContent += `-- INSERTS: Clientes (${db.clientes.length})\n`;
    db.clientes.forEach(c => {
      sqlContent += `INSERT INTO clientes (id, cedula, nombre_completo, telefono, email, direccion, fecha_registro, notas, activo) VALUES (\n`;
      sqlContent += `  ${escapeSql(c.id)}, ${escapeSql(c.cedula)}, ${escapeSql(c.nombre_completo)}, ${escapeSql(c.telefono)}, ${escapeSql(c.email)}, ${escapeSql(c.direccion)}, ${escapeSql(c.fecha_registro)}, ${escapeSql(c.notes || c.notas)}, ${escapeSql(c.activo)}\n`;
      sqlContent += `);\n`;
    });
    sqlContent += `\n`;
  }

  // Equipos
  if (db.equipos && db.equipos.length > 0) {
    sqlContent += `-- INSERTS: Equipos (${db.equipos.length})\n`;
    db.equipos.forEach(e => {
      sqlContent += `INSERT INTO equipos (id, cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fecha_ingreso, activo) VALUES (\n`;
      sqlContent += `  ${escapeSql(e.id)}, ${escapeSql(e.cliente_id)}, ${escapeSql(e.marca)}, ${escapeSql(e.modelo)}, ${escapeSql(e.serial)}, ${escapeSql(e.tipo_equipo)}, ${escapeSql(e.color)}, ${escapeSql(e.accesorios_recibidos)}, ${escapeSql(e.estado_ingreso)}, ${escapeSql(e.observaciones_ingreso)}, ${escapeSql(e.fecha_ingreso)}, ${escapeSql(e.activo)}\n`;
      sqlContent += `);\n`;
    });
    sqlContent += `\n`;
  }

  // Reparaciones
  if (db.reparaciones && db.reparaciones.length > 0) {
    sqlContent += `-- INSERTS: Reparaciones e Ingeniería (${db.reparaciones.length})\n`;
    db.reparaciones.forEach(r => {
      sqlContent += `INSERT INTO reparaciones (id, equipo_id, numero_orden, fecha_ingreso, fecha_entrega_prometida, fecha_entrega_real, falla_reportada, diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados, costo_mano_obra, costo_repuestos, costo_total, descuento, monto_final, estado, prioridad, tecnico_asignado, dias_garantia, fecha_inicio_garantia, fecha_fin_garantia, condiciones_garantia, presupuesto_aceptado, fecha_aceptacion, firma_cliente, estado_abandono, fecha_abandono, observaciones_abandono, activo) VALUES (\n`;
      sqlContent += `  ${escapeSql(r.id)}, ${escapeSql(r.equipo_id)}, ${escapeSql(r.numero_orden)}, ${escapeSql(r.fecha_ingreso)}, ${escapeSql(r.fecha_entrega_prometida)}, ${escapeSql(r.fecha_entrega_real)}, ${escapeSql(r.falla_reportada)}, ${escapeSql(r.diagnostico_tecnico)}, ${escapeSql(r.sintomas)}, ${escapeSql(r.trabajo_realizado)}, ${escapeSql(r.repuestos_utilizados)}, ${escapeSql(r.costo_mano_obra)}, ${escapeSql(r.costo_repuestos)}, ${escapeSql(r.costo_total)}, ${escapeSql(r.descuento)}, ${escapeSql(r.monto_final)}, ${escapeSql(r.estado)}, ${escapeSql(r.prioridad)}, ${escapeSql(r.tecnico_asignado)}, ${escapeSql(r.dias_garantia)}, ${escapeSql(r.fecha_inicio_garantia)}, ${escapeSql(r.fecha_fin_garantia)}, ${escapeSql(r.condiciones_garantia)}, ${escapeSql(r.presupuesto_aceptado)}, ${escapeSql(r.fecha_aceptacion)}, ${escapeSql(r.firma_cliente)}, ${escapeSql(r.estado_abandono)}, ${escapeSql(r.fecha_abandono)}, ${escapeSql(r.observaciones_abandono)}, ${escapeSql(r.activo)}\n`;
      sqlContent += `);\n`;
    });
    sqlContent += `\n`;
  }

  // Historial Reparacion
  if (db.historial_reparacion && db.historial_reparacion.length > 0) {
    sqlContent += `-- INSERTS: Eventos Historial (${db.historial_reparacion.length})\n`;
    db.historial_reparacion.forEach(h => {
      sqlContent += `INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (\n`;
      sqlContent += `  ${escapeSql(h.id)}, ${escapeSql(h.reparacion_id)}, ${escapeSql(h.fecha)}, ${escapeSql(h.usuario)}, ${escapeSql(h.tipo)}, ${escapeSql(h.comentario)}\n`;
      sqlContent += `);\n`;
    });
    sqlContent += `\n`;
  }

  // Facturas
  if (db.facturas && db.facturas.length > 0) {
    sqlContent += `-- INSERTS: Facturación Emisiones (${db.facturas.length})\n`;
    db.facturas.forEach(f => {
      sqlContent += `INSERT INTO facturas (id, reparacion_id, numero_factura, fecha_emision, subtotal, iva, total, metodo_pago, referencia_pago, estado, created_at) VALUES (\n`;
      sqlContent += `  ${escapeSql(f.id)}, ${escapeSql(f.reparacion_id)}, ${escapeSql(f.numero_factura)}, ${escapeSql(f.fecha_emision)}, ${escapeSql(f.subtotal)}, ${escapeSql(f.iva)}, ${escapeSql(f.total)}, ${escapeSql(f.metodo_pago)}, ${escapeSql(f.referencia_pago)}, ${escapeSql(f.estado)}, ${escapeSql(f.created_at)}\n`;
      sqlContent += `);\n`;
    });
    sqlContent += `\n`;
  }

  sqlContent += `COMMIT;\n\n`;
  sqlContent += `-- =========================================================================\n`;
  sqlContent += `-- FIN DEL RESPALDO / SCRIPT SQL COMPATIBLE CON POSTGRESQL / MYSQL / SQLITE\n`;
  sqlContent += `-- =========================================================================\n`;

  fs.writeFileSync(OUTPUT_PATH, sqlContent, 'utf-8');
  console.log(`¡Éxito! Script SQL generado de forma segura en: ${OUTPUT_PATH} (${fs.statSync(OUTPUT_PATH).size} Bytes)`);
} catch (err) {
  console.error("Hubo un error al correr el transformador de DB a SQL:", err);
  process.exit(1);
}
