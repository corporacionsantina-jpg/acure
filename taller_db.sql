-- =========================================================================
-- SCRIPT SQL AUTO-GENERADO PARA EL SISTEMA TALLER PRO (SISTEMA v1.42)
-- Generado el: 2026-06-20T19:28:56.858Z
-- Transforma el almacenamiento local taller_db.json a base de datos relacional
-- =========================================================================

BEGIN;

-- 1. ELIMINAR TABLAS EXISTENTES PARA INICIALIZACIÓN LIMPIA (Opcional)
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS historial_reparacion CASCADE;
DROP TABLE IF EXISTS reparaciones CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- 2. CREACIÓN DE TABLAS DE LA BASE DE DATOS

CREATE TABLE clientes (
  id VARCHAR(50) PRIMARY KEY,
  cedula VARCHAR(50),
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(100),
  direccion TEXT,
  fecha_registro VARCHAR(100),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE equipos (
  id VARCHAR(50) PRIMARY KEY,
  cliente_id VARCHAR(50) REFERENCES clientes(id) ON DELETE CASCADE,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  serial VARCHAR(100) UNIQUE NOT NULL,
  tipo_equipo VARCHAR(50),
  color VARCHAR(50),
  accesorios_recibidos TEXT,
  estado_ingreso VARCHAR(50),
  observaciones_ingreso TEXT,
  fecha_ingreso VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE reparaciones (
  id VARCHAR(50) PRIMARY KEY,
  equipo_id VARCHAR(50) REFERENCES equipos(id) ON DELETE CASCADE,
  numero_orden VARCHAR(50) UNIQUE NOT NULL,
  fecha_ingreso VARCHAR(100),
  fecha_entrega_prometida VARCHAR(100),
  fecha_entrega_real VARCHAR(100),
  falla_reportada TEXT NOT NULL,
  diagnostico_tecnico TEXT,
  sintomas TEXT,
  trabajo_realizado TEXT,
  repuestos_utilizados TEXT,
  costo_mano_obra NUMERIC(10,2) DEFAULT 0.00,
  costo_repuestos NUMERIC(10,2) DEFAULT 0.00,
  costo_total NUMERIC(10,2) DEFAULT 0.00,
  descuento NUMERIC(10,2) DEFAULT 0.00,
  monto_final NUMERIC(10,2) DEFAULT 0.00,
  estado VARCHAR(50) DEFAULT 'pendiente',
  prioridad VARCHAR(50) DEFAULT 'normal',
  tecnico_asignado VARCHAR(150),
  dias_garantia INTEGER DEFAULT 30,
  fecha_inicio_garantia VARCHAR(100),
  fecha_fin_garantia VARCHAR(100),
  condiciones_garantia TEXT,
  presupuesto_aceptado BOOLEAN DEFAULT FALSE,
  fecha_aceptacion VARCHAR(100),
  firma_cliente TEXT,
  estado_abandono VARCHAR(50) DEFAULT 'activo',
  fecha_abandono VARCHAR(100),
  observaciones_abandono TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE historial_reparacion (
  id VARCHAR(50) PRIMARY KEY,
  reparacion_id VARCHAR(50) REFERENCES reparaciones(id) ON DELETE CASCADE,
  fecha VARCHAR(100),
  usuario VARCHAR(150),
  tipo VARCHAR(50),
  comentario TEXT
);

CREATE TABLE facturas (
  id VARCHAR(50) PRIMARY KEY,
  reparacion_id VARCHAR(50) REFERENCES reparaciones(id) ON DELETE CASCADE,
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  fecha_emision VARCHAR(100),
  subtotal NUMERIC(10,2) DEFAULT 0.00,
  iva NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) DEFAULT 0.00,
  metodo_pago VARCHAR(50),
  referencia_pago VARCHAR(100),
  estado VARCHAR(50),
  created_at VARCHAR(100)
);

-- 3. INSERCIÓN DE DATOS ACTUALES RECOPILADOS

-- INSERTS: Clientes (3)
INSERT INTO clientes (id, cedula, nombre_completo, telefono, email, direccion, fecha_registro, notas, activo) VALUES (
  'cli-1', 'V-19827364', 'Juan Pérez Delgado', '+58 412-1234567', 'juan.perez@gmail.com', 'Av. Solano Lopez, Edif. Altamira Apt 4B, Caracas', '2026-05-10T10:00:00Z', 'Cliente recurrente. Prefiere contacto por WhatsApp.', TRUE
);
INSERT INTO clientes (id, cedula, nombre_completo, telefono, email, direccion, fecha_registro, notas, activo) VALUES (
  'cli-2', 'V-24883192', 'María Alexandra Delgado', '+58 424-9876543', 'maria.alex@outlook.com', 'Calle Los Mangos, Residencias Girasol Piso 2, Maracay', '2026-06-01T15:30:00Z', 'Exige presupuestos detallados por correo.', TRUE
);
INSERT INTO clientes (id, cedula, nombre_completo, telefono, email, direccion, fecha_registro, notas, activo) VALUES (
  'cli-3', 'V-12055678', 'Carlos Eduardo Espinoza', '+58 416-5558899', 'carlos.espinoza@techcorp.ve', 'Urbanización La Trinidad, Calle 3, Qta El Samán, Caracas', '2026-06-12T11:15:00Z', 'Equipos corporativos de oficina.', TRUE
);

-- INSERTS: Equipos (4)
INSERT INTO equipos (id, cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fecha_ingreso, activo) VALUES (
  'eq-1', 'cli-1', 'Samsung', 'Galaxy S21', 'SN-SAMS21-9875A', 'celular', 'Negro Fantasma', '["Cargador","Funda de silicona"]', 'regular', 'Micro-rayones en cristal trasero, pantalla astillada en esquina inferior derecha. No carga adecuadamente.', '2026-05-10T10:15:00Z', TRUE
);
INSERT INTO equipos (id, cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fecha_ingreso, activo) VALUES (
  'eq-2', 'cli-2', 'Apple', 'MacBook Pro 13" M1', 'C02F8769Q05D', 'laptop', 'Gris Espacial', '["Cargador USB-C 61W","Estuche protector"]', 'bueno', 'Chasis impecable. El teclado no responde en las teclas A, S, D, F. Posible derrame leve de líquido.', '2026-06-01T15:45:00Z', TRUE
);
INSERT INTO equipos (id, cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fecha_ingreso, activo) VALUES (
  'eq-3', 'cli-3', 'Sony', 'PlayStation 5', 'A1230495-PS5', 'consola', 'Blanco/Negro', '["Cable HDMI","Cable de corriente","1 control DualSense"]', 'regular', 'Mucho polvo acumulado en respiraderos. Enciende pero arroja alerta de sobrecalentamiento a los 5 minutos de juego.', '2026-06-12T11:30:00Z', TRUE
);
INSERT INTO equipos (id, cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fecha_ingreso, activo) VALUES (
  'eq-4', 'cli-1', 'Xiaomi', 'Redmi Note 11', 'SN-REDMI-8812739', 'celular', 'Azul Océano', '["Caja original"]', 'malo', 'Pantalla completamente destrozada, no da imagen. El botón de encendido está hundido.', '2026-06-15T09:40:00Z', TRUE
);

-- INSERTS: Reparaciones e Ingeniería (4)
INSERT INTO reparaciones (id, equipo_id, numero_orden, fecha_ingreso, fecha_entrega_prometida, fecha_entrega_real, falla_reportada, diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados, costo_mano_obra, costo_repuestos, costo_total, descuento, monto_final, estado, prioridad, tecnico_asignado, dias_garantia, fecha_inicio_garantia, fecha_fin_garantia, condiciones_garantia, presupuesto_aceptado, fecha_aceptacion, firma_cliente, estado_abandono, fecha_abandono, observaciones_abandono, activo) VALUES (
  'rep-1', 'eq-1', 'REP-2026-0001', '2026-05-10T10:15:00Z', '2026-05-13T17:00:00Z', '2026-05-13T16:30:00Z', 'Pantalla astillada y problemas al cargar.', 'Puerto de carga USB-C obstruido con pelusa. Pantalla LCD astillada pero el digitalizador funciona. Se requiere reemplazo de módulo de pantalla completo y mantenimiento de puerto de pin de carga.', NULL, 'Instalación de repuesto original de pantalla Samsung S21. Limpieza ultrasónica y resoldado térmico del conector de carga.', '[{"nombre":"Pantalla AMOLED Samsung S21","cantidad":1,"costo":110}]', 40, 110, 150, 10, 140, 'entregado', 'normal', 'Erick Silva (Nivel 2)', 30, '2026-05-13T16:30:00Z', '2026-06-12T16:30:00Z', 'Garantía de 30 días limitada a fallas del repuesto de pantalla instalado. No cubre golpes, caídas, flexiones, ni exposición a humedad o agua.', TRUE, '2026-05-11T09:00:00Z', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiPjx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkp1YW4gUC48L3RleHQ+PC9zdmc+', 'activo', NULL, NULL, TRUE
);
INSERT INTO reparaciones (id, equipo_id, numero_orden, fecha_ingreso, fecha_entrega_prometida, fecha_entrega_real, falla_reportada, diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados, costo_mano_obra, costo_repuestos, costo_total, descuento, monto_final, estado, prioridad, tecnico_asignado, dias_garantia, fecha_inicio_garantia, fecha_fin_garantia, condiciones_garantia, presupuesto_aceptado, fecha_aceptacion, firma_cliente, estado_abandono, fecha_abandono, observaciones_abandono, activo) VALUES (
  'rep-2', 'eq-2', 'REP-2026-0002', '2026-06-01T15:45:00Z', '2026-06-05T18:00:00Z', NULL, 'Teclado inoperativo en rango A-S-D-F.', 'Se detectaron rastros de óxido en el flex del teclado y cortocircuito en línea de datos debido a derrame de café. Requiere reemplazo del Topcase completo (Teclado + Batería integrado de fábrica para este modelo).', NULL, '', '[{"nombre":"Keyboard Topcase Apple M1 13\"","cantidad":1,"costo":180}]', 60, 180, 240, 0, 240, 'diagnostico', 'normal', 'Daniel Romero (Master)', 90, NULL, NULL, '3 meses de garantía por desperfectos del teclado integrado. No aplica para daños por corrosión o humedad posterior.', FALSE, NULL, NULL, 'activo', NULL, NULL, TRUE
);
INSERT INTO reparaciones (id, equipo_id, numero_orden, fecha_ingreso, fecha_entrega_prometida, fecha_entrega_real, falla_reportada, diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados, costo_mano_obra, costo_repuestos, costo_total, descuento, monto_final, estado, prioridad, tecnico_asignado, dias_garantia, fecha_inicio_garantia, fecha_fin_garantia, condiciones_garantia, presupuesto_aceptado, fecha_aceptacion, firma_cliente, estado_abandono, fecha_abandono, observaciones_abandono, activo) VALUES (
  'rep-3', 'eq-3', 'REP-2026-0003', '2026-06-12T11:30:00Z', '2026-06-14T12:00:00Z', NULL, 'Se apaga por sobrecalentamiento.', 'Disipador térmico obstruido de polvo compacto. Metal líquido térmico original desplazado, dejando núcleos de la APU expuestos al aire. Se requiere delid del disipador, aplicación de metal líquido nuevo y limpieza integral profunda.', NULL, 'Limpieza con alcohol isopropílico al 99.9%, soplado de turbina de aire, re-aplicación de metal líquido térmico Thermal Grizzly Conductonaut en APU de PS5. Reensamblado completo.', '[{"nombre":"Metal Líquido Thermal Grizzly","cantidad":1,"costo":15}]', 35, 15, 50, 0, 50, 'pruebas', 'urgente', 'Erick Silva (Nivel 2)', 90, NULL, NULL, NULL, TRUE, '2026-06-12T13:40:00Z', NULL, 'activo', NULL, NULL, TRUE
);
INSERT INTO reparaciones (id, equipo_id, numero_orden, fecha_ingreso, fecha_entrega_prometida, fecha_entrega_real, falla_reportada, diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados, costo_mano_obra, costo_repuestos, costo_total, descuento, monto_final, estado, prioridad, tecnico_asignado, dias_garantia, fecha_inicio_garantia, fecha_fin_garantia, condiciones_garantia, presupuesto_aceptado, fecha_aceptacion, firma_cliente, estado_abandono, fecha_abandono, observaciones_abandono, activo) VALUES (
  'rep-4', 'eq-4', 'REP-2026-0004', '2026-04-10T10:00:00Z', NULL, NULL, 'Pantalla partida y botón encendido hundido.', 'Arrollado por vehículo. Daño estructural de la placa lógica principal con múltiples capacitores en corto y pistas rotas. Inviable reparación por presupuesto, excede el precio comercial del equipo.', NULL, '', '[]', 10, 0, 10, 0, 10, 'reparado', 'baja', 'Daniel Romero (Master)', 30, NULL, NULL, NULL, TRUE, '2026-04-11T11:00:00Z', NULL, 'abandonado', '2026-05-11T11:00:00Z', NULL, TRUE
);

-- INSERTS: Eventos Historial (9)
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-1', 'rep-1', '2026-05-10T10:15:00Z', 'Erick Silva (Nivel 2)', 'cambio_estado', 'Equipo ingresado al taller. Registrado con marcas por uso normal y pantalla fisurada.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-2', 'rep-1', '2026-05-11T08:30:00Z', 'Erick Silva (Nivel 2)', 'diagnostico', 'Diagnóstico finalizado. Se determinó cambio de módulo AMOLED. Presupuesto enviado por $140 final.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-3', 'rep-1', '2026-05-11T09:00:00Z', 'Sistema', 'aprobacion', 'Presupuesto aceptado digitalmente por el cliente con firma en portal.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-4', 'rep-1', '2026-05-13T14:00:00Z', 'Erick Silva (Nivel 2)', 'progreso', 'Pieza de repuesto recibida e instalada. Iniciando pruebas de carga rápida, táctil e iluminación.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-5', 'rep-1', '2026-05-13T16:30:00Z', 'Sistema', 'cambio_estado', 'Equipo retirado por el cliente de forma presencial. Garantía de 30 días iniciada.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-6', 'rep-2', '2026-06-01T15:45:00Z', 'Daniel Romero (Master)', 'cambio_estado', 'Equipo ingresado. MacBook Pro 13" con teclas atascadas.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-7', 'rep-2', '2026-06-03T10:00:00Z', 'Daniel Romero (Master)', 'diagnostico', 'Diagnóstico revela café derramado interno. Topcase oxidado. Presupuesto cargado por $240.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-8', 'rep-3', '2026-06-12T11:30:00Z', 'Erick Silva (Nivel 2)', 'cambio_estado', 'PlayStation 5 ingresado en modo urgente por servicio térmico.'
);
INSERT INTO historial_reparacion (id, reparacion_id, fecha, usuario, tipo, comentario) VALUES (
  'his-9', 'rep-3', '2026-06-12T13:40:00Z', 'Erick Silva (Nivel 2)', 'aprobacion', 'Cliente aprueba presupuesto de limpieza profunda y metal líquido inmediato.'
);

-- INSERTS: Facturación Emisiones (1)
INSERT INTO facturas (id, reparacion_id, numero_factura, fecha_emision, subtotal, iva, total, metodo_pago, referencia_pago, estado, created_at) VALUES (
  'fac-1', 'rep-1', 'FAC-2026-0001', '2026-05-13T16:30:00Z', 120.69, 19.31, 140, 'pago_movil', 'PM-9283741', 'pagada', '2026-05-13T16:30:00Z'
);

COMMIT;

-- =========================================================================
-- FIN DEL RESPALDO / SCRIPT SQL COMPATIBLE CON POSTGRESQL / MYSQL / SQLITE
-- =========================================================================
