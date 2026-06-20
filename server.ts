import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase Client if env variables are available
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
let supabase: any = null;

if (isSupabaseEnabled) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase Server] Supabase integration initialized successfully for URL:', supabaseUrl);
  } catch (err) {
    console.error('[Supabase Server] Error initializing Supabase client:', err);
  }
} else {
  console.log('[Supabase Server] Operando en modo local (archivo taller_db.json). Configura SUPABASE_URL y SUPABASE_ANON_KEY en Vercel para conectar con la nube.');
}

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database filepath - dynamically fallback to /tmp if cwd is read-only (like on Vercel)
let DB_PATH = path.join(process.cwd(), 'taller_db.json');
try {
  const testPath = path.join(process.cwd(), '.write-test');
  fs.writeFileSync(testPath, 'test');
  fs.unlinkSync(testPath);
} catch (err) {
  console.warn('[Storage] Working directory is read-only. Falling back to /tmp for local databases.');
  DB_PATH = path.join('/tmp', 'taller_db.json');
}

// Initialize Gemini Client safely (Lazy loading pattern)
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log('Gemini API client initialized successfully.');
    } else {
      console.warn('GEMINI_API_KEY is not configured or uses default placeholder. AI features will fallback to rule-based simulations.');
    }
  }
  return aiClient;
}

// Global DB Structure
interface TallerDatabase {
  clientes: any[];
  equipos: any[];
  reparaciones: any[];
  historial_reparacion: any[];
  facturas: any[];
}

// Initialize and Seed Database if empty
function getInitialDefaultDb(): TallerDatabase {
  return {
    clientes: [
      {
        id: 'cli-1',
        cedula: 'V-19827364',
        nombre_completo: 'Juan Pérez Delgado',
        telefono: '+58 412-1234567',
        email: 'juan.perez@gmail.com',
        direccion: 'Av. Solano Lopez, Edif. Altamira Apt 4B, Caracas',
        fecha_registro: '2026-05-10T10:00:00Z',
        notas: 'Cliente recurrente. Prefiere contacto por WhatsApp.',
        activo: true
      },
      {
        id: 'cli-2',
        cedula: 'V-24883192',
        nombre_completo: 'María Alexandra Delgado',
        telefono: '+58 424-9876543',
        email: 'maria.alex@outlook.com',
        direccion: 'Calle Los Mangos, Residencias Girasol Piso 2, Maracay',
        fecha_registro: '2026-06-01T15:30:00Z',
        notas: 'Exige presupuestos detallados por correo.',
        activo: true
      },
      {
        id: 'cli-3',
        cedula: 'V-12055678',
        nombre_completo: 'Carlos Eduardo Espinoza',
        telefono: '+58 416-5558899',
        email: 'carlos.espinoza@techcorp.ve',
        direccion: 'Urbanización La Trinidad, Calle 3, Qta El Samán, Caracas',
        fecha_registro: '2026-06-12T11:15:00Z',
        notas: 'Equipos corporativos de oficina.',
        activo: true
      }
    ],
    equipos: [
      {
        id: 'eq-1',
        cliente_id: 'cli-1',
        marca: 'Samsung',
        modelo: 'Galaxy S21',
        serial: 'SN-SAMS21-9875A',
        tipo_equipo: 'celular',
        color: 'Negro Fantasma',
        accesorios_recibidos: ['Cargador', 'Funda de silicona'],
        estado_ingreso: 'regular',
        observaciones_ingreso: 'Micro-rayones en cristal trasero, pantalla astillada en esquina inferior derecha. No carga adecuadamente.',
        fotos_ingreso: [],
        fecha_ingreso: '2026-05-10T10:15:00Z',
        activo: true
      },
      {
        id: 'eq-2',
        cliente_id: 'cli-2',
        marca: 'Apple',
        modelo: 'MacBook Pro 13" M1',
        serial: 'C02F8769Q05D',
        tipo_equipo: 'laptop',
        color: 'Gris Espacial',
        accesorios_recibidos: ['Cargador USB-C 61W', 'Estuche protector'],
        estado_ingreso: 'bueno',
        observaciones_ingreso: 'Chasis impecable. El teclado no responde en las teclas A, S, D, F. Posible derrame leve de líquido.',
        fotos_ingreso: [],
        fecha_ingreso: '2026-06-01T15:45:00Z',
        activo: true
      },
      {
        id: 'eq-3',
        cliente_id: 'cli-3',
        marca: 'Sony',
        modelo: 'PlayStation 5',
        serial: 'A1230495-PS5',
        tipo_equipo: 'consola',
        color: 'Blanco/Negro',
        accesorios_recibidos: ['Cable HDMI', 'Cable de corriente', '1 control DualSense'],
        estado_ingreso: 'regular',
        observaciones_ingreso: 'Mucho polvo acumulado en respiraderos. Enciende pero arroja alerta de sobrecalentamiento a los 5 minutos de juego.',
        fotos_ingreso: [],
        fecha_ingreso: '2026-06-12T11:30:00Z',
        activo: true
      },
      {
        id: 'eq-4',
        cliente_id: 'cli-1',
        marca: 'Xiaomi',
        modelo: 'Redmi Note 11',
        serial: 'SN-REDMI-8812739',
        tipo_equipo: 'celular',
        color: 'Azul Océano',
        accesorios_recibidos: ['Caja original'],
        estado_ingreso: 'malo',
        observaciones_ingreso: 'Pantalla completamente destrozada, no da imagen. El botón de encendido está hundido.',
        fotos_ingreso: [],
        fecha_ingreso: '2026-06-15T09:40:00Z',
        activo: true
      }
    ],
    reparaciones: [
      {
        id: 'rep-1',
        equipo_id: 'eq-1',
        numero_orden: 'REP-2026-0001',
        fecha_ingreso: '2026-05-10T10:15:00Z',
        fecha_entrega_prometida: '2026-05-13T17:00:00Z',
        fecha_entrega_real: '2026-05-13T16:30:00Z',
        falla_reportada: 'Pantalla astillada y problemas al cargar.',
        diagnostico_tecnico: 'Puerto de carga USB-C obstruido con pelusa. Pantalla LCD astillada pero el digitalizador funciona. Se requiere reemplazo de módulo de pantalla completo y mantenimiento de puerto de pin de carga.',
        trabajo_realizado: 'Instalación de repuesto original de pantalla Samsung S21. Limpieza ultrasónica y resoldado térmico del conector de carga.',
        repuestos_utilizados: [
          { nombre: 'Pantalla AMOLED Samsung S21', cantidad: 1, costo: 110.00 }
        ],
        costo_mano_obra: 40.00,
        costo_repuestos: 110.00,
        costo_total: 150.00,
        descuento: 10.00,
        monto_final: 140.00,
        estado: 'entregado',
        prioridad: 'normal',
        tecnico_asignado: 'Erick Silva (Nivel 2)',
        dias_garantia: 30,
        fecha_inicio_garantia: '2026-05-13T16:30:00Z',
        fecha_fin_garantia: '2026-06-12T16:30:00Z',
        condiciones_garantia: 'Garantía de 30 días limitada a fallas del repuesto de pantalla instalado. No cubre golpes, caídas, flexiones, ni exposición a humedad o agua.',
        presupuesto_aceptado: true,
        fecha_aceptacion: '2026-05-11T09:00:00Z',
        firma_cliente: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iNDAiPjx0ZXh0IHg9IjEwIiB5PSIyNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkp1YW4gUC48L3RleHQ+PC9zdmc+',
        estado_abandono: 'activo',
        activo: true
      },
      {
        id: 'rep-2',
        equipo_id: 'eq-2',
        numero_orden: 'REP-2026-0002',
        fecha_ingreso: '2026-06-01T15:45:00Z',
        fecha_entrega_prometida: '2026-06-05T18:00:00Z',
        falla_reportada: 'Teclado inoperativo en rango A-S-D-F.',
        diagnostico_tecnico: 'Se detectaron rastros de óxido en el flex del teclado y cortocircuito en línea de datos debido a derrame de café. Requiere reemplazo del Topcase completo (Teclado + Batería integrado de fábrica para este modelo).',
        trabajo_realizado: '',
        repuestos_utilizados: [
          { nombre: 'Keyboard Topcase Apple M1 13"', cantidad: 1, costo: 180.00 }
        ],
        costo_mano_obra: 60.00,
        costo_repuestos: 180.00,
        costo_total: 240.00,
        descuento: 0,
        monto_final: 240.00,
        estado: 'diagnostico',
        prioridad: 'normal',
        tecnico_asignado: 'Daniel Romero (Master)',
        dias_garantia: 90,
        condiciones_garantia: '3 meses de garantía por desperfectos del teclado integrado. No aplica para daños por corrosión o humedad posterior.',
        presupuesto_aceptado: false,
        estado_abandono: 'activo',
        activo: true
      },
      {
        id: 'rep-3',
        equipo_id: 'eq-3',
        numero_orden: 'REP-2026-0003',
        fecha_ingreso: '2026-06-12T11:30:00Z',
        fecha_entrega_prometida: '2026-06-14T12:00:00Z',
        falla_reportada: 'Se apaga por sobrecalentamiento.',
        diagnostico_tecnico: 'Disipador térmico obstruido de polvo compacto. Metal líquido térmico original desplazado, dejando núcleos de la APU expuestos al aire. Se requiere delid del disipador, aplicación de metal líquido nuevo y limpieza integral profunda.',
        trabajo_realizado: 'Limpieza con alcohol isopropílico al 99.9%, soplado de turbina de aire, re-aplicación de metal líquido térmico Thermal Grizzly Conductonaut en APU de PS5. Reensamblado completo.',
        repuestos_utilizados: [
          { nombre: 'Metal Líquido Thermal Grizzly', cantidad: 1, costo: 15.00 }
        ],
        costo_mano_obra: 35.00,
        costo_repuestos: 15.00,
        costo_total: 50.00,
        descuento: 0,
        monto_final: 50.00,
        estado: 'pruebas',
        prioridad: 'urgente',
        tecnico_asignado: 'Erick Silva (Nivel 2)',
        dias_garantia: 90,
        presupuesto_aceptado: true,
        fecha_aceptacion: '2026-06-12T13:40:00Z',
        estado_abandono: 'activo',
        activo: true
      },
      {
        id: 'rep-4',
        equipo_id: 'eq-4',
        numero_orden: 'REP-2026-0004',
        fecha_ingreso: '2026-04-10T10:00:00Z',
        falla_reportada: 'Pantalla partida y botón encendido hundido.',
        diagnostico_tecnico: 'Arrollado por vehículo. Daño estructural de la placa lógica principal con múltiples capacitores en corto y pistas rotas. Inviable reparación por presupuesto, excede el precio comercial del equipo.',
        trabajo_realizado: '',
        repuestos_utilizados: [],
        costo_mano_obra: 10.00,
        costo_repuestos: 0,
        costo_total: 10.00,
        descuento: 0,
        monto_final: 10.00,
        estado: 'reparado',
        prioridad: 'baja',
        tecnico_asignado: 'Daniel Romero (Master)',
        dias_garantia: 30,
        presupuesto_aceptado: true,
        fecha_aceptacion: '2026-04-11T11:00:00Z',
        fecha_abandono: '2026-05-11T11:00:00Z',
        estado_abandono: 'abandonado',
        activo: true
      }
    ],
    historial_reparacion: [
      {
        id: 'his-1',
        reparacion_id: 'rep-1',
        fecha: '2026-05-10T10:15:00Z',
        usuario: 'Erick Silva (Nivel 2)',
        tipo: 'cambio_estado',
        comentario: 'Equipo ingresado al taller. Registrado con marcas por uso normal y pantalla fisurada.'
      },
      {
        id: 'his-2',
        reparacion_id: 'rep-1',
        fecha: '2026-05-11T08:30:00Z',
        usuario: 'Erick Silva (Nivel 2)',
        tipo: 'diagnostico',
        comentario: 'Diagnóstico finalizado. Se determinó cambio de módulo AMOLED. Presupuesto enviado por $140 final.'
      },
      {
        id: 'his-3',
        reparacion_id: 'rep-1',
        fecha: '2026-05-11T09:00:00Z',
        usuario: 'Sistema',
        tipo: 'aprobacion',
        comentario: 'Presupuesto aceptado digitalmente por el cliente con firma en portal.'
      },
      {
        id: 'his-4',
        reparacion_id: 'rep-1',
        fecha: '2026-05-13T14:00:00Z',
        usuario: 'Erick Silva (Nivel 2)',
        tipo: 'progreso',
        comentario: 'Pieza de repuesto recibida e instalada. Iniciando pruebas de carga rápida, táctil e iluminación.'
      },
      {
        id: 'his-5',
        reparacion_id: 'rep-1',
        fecha: '2026-05-13T16:30:00Z',
        usuario: 'Sistema',
        tipo: 'cambio_estado',
        comentario: 'Equipo retirado por el cliente de forma presencial. Garantía de 30 días iniciada.'
      },
      {
        id: 'his-6',
        reparacion_id: 'rep-2',
        fecha: '2026-06-01T15:45:00Z',
        usuario: 'Daniel Romero (Master)',
        tipo: 'cambio_estado',
        comentario: 'Equipo ingresado. MacBook Pro 13" con teclas atascadas.'
      },
      {
        id: 'his-7',
        reparacion_id: 'rep-2',
        fecha: '2026-06-03T10:00:00Z',
        usuario: 'Daniel Romero (Master)',
        tipo: 'diagnostico',
        comentario: 'Diagnóstico revela café derramado interno. Topcase oxidado. Presupuesto cargado por $240.'
      },
      {
        id: 'his-8',
        reparacion_id: 'rep-3',
        fecha: '2026-06-12T11:30:00Z',
        usuario: 'Erick Silva (Nivel 2)',
        tipo: 'cambio_estado',
        comentario: 'PlayStation 5 ingresado en modo urgente por servicio térmico.'
      },
      {
        id: 'his-9',
        reparacion_id: 'rep-3',
        fecha: '2026-06-12T13:40:00Z',
        usuario: 'Erick Silva (Nivel 2)',
        tipo: 'aprobacion',
        comentario: 'Cliente aprueba presupuesto de limpieza profunda y metal líquido inmediato.'
      }
    ],
    facturas: [
      {
        id: 'fac-1',
        reparacion_id: 'rep-1',
        numero_factura: 'FAC-2026-0001',
        fecha_emision: '2026-05-13T16:30:00Z',
        subtotal: 120.69,
        iva: 19.31,
        total: 140.00,
        metodo_pago: 'pago_movil',
        referencia_pago: 'PM-9283741',
        estado: 'pagada',
        created_at: '2026-05-13T16:30:00Z'
      }
    ]
  };
}

// Initialize and Seed Database if empty
async function loadDatabase(): Promise<TallerDatabase> {
  if (isSupabaseEnabled && supabase) {
    try {
      const [clientesRes, equiposRes, reparacionesRes, historialRes, facturasRes] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('equipos').select('*'),
        supabase.from('reparaciones').select('*'),
        supabase.from('historial_reparacion').select('*'),
        supabase.from('facturas').select('*')
      ]);

      if (clientesRes.error) console.error('[Supabase Load] Error client fetch:', clientesRes.error);
      if (equiposRes.error) console.error('[Supabase Load] Error equipment fetch:', equiposRes.error);
      if (reparacionesRes.error) console.error('[Supabase Load] Error repairs fetch:', reparacionesRes.error);
      if (historialRes.error) console.error('[Supabase Load] Error history fetch:', historialRes.error);
      if (facturasRes.error) console.error('[Supabase Load] Error invoices fetch:', facturasRes.error);

      const db: TallerDatabase = {
        clientes: (clientesRes.data || []).map((c: any) => ({
          ...c,
          activo: c.activo === null || c.activo === undefined ? true : !!c.activo
        })),
        equipos: (equiposRes.data || []).map((e: any) => {
          let accesorios = e.accesorios_recibidos || [];
          if (typeof accesorios === 'string') {
            try {
              accesorios = JSON.parse(accesorios);
            } catch {
              accesorios = [accesorios];
            }
          }
          return {
            ...e,
            accesorios_recibidos: accesorios,
            fotos_ingreso: e.fotos_ingreso || [],
            activo: e.activo === null || e.activo === undefined ? true : !!e.activo
          };
        }),
        reparaciones: (reparacionesRes.data || []).map((r: any) => {
          let repuestos = r.repuestos_utilizados || [];
          if (typeof repuestos === 'string') {
            try {
              repuestos = JSON.parse(repuestos);
            } catch {
              repuestos = [];
            }
          }
          return {
            ...r,
            repuestos_utilizados: repuestos,
            costo_mano_obra: Number(r.costo_mano_obra || 0),
            costo_repuestos: Number(r.costo_repuestos || 0),
            costo_total: Number(r.costo_total || 0),
            descuento: Number(r.descuento || 0),
            monto_final: Number(r.monto_final || 0),
            dias_garantia: r.dias_garantia !== null && r.dias_garantia !== undefined ? Number(r.dias_garantia) : 30,
            presupuesto_aceptado: !!r.presupuesto_aceptado,
            activo: r.activo === null || r.activo === undefined ? true : !!r.activo
          };
        }),
        historial_reparacion: (historialRes.data || []).map((h: any) => ({
          ...h,
          fotos: h.fotos || [],
          metadata: h.metadata || {}
        })),
        facturas: (facturasRes.data || []).map((f: any) => ({
          ...f,
          subtotal: Number(f.subtotal || 0),
          iva: Number(f.iva || 0),
          total: Number(f.total || 0)
        }))
      };

      // Seed if empty and connected successfully
      if (db.clientes.length === 0 && db.equipos.length === 0) {
        console.log('[Supabase Load] Database is empty, seeding initial structure...');
        const initialDb = getInitialDefaultDb();
        await saveDatabase(initialDb);
        return initialDb;
      }

      return db;
    } catch (err) {
      console.error('[Supabase Load] Exception, falling back to local storage:', err);
    }
  }

  // Backup fallback local JSON file
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = getInitialDefaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const rawData = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('[Local Config] Recreating corrupted DB file:', err);
    const initialDb = getInitialDefaultDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
}

// Helper to write changes to DB file
async function saveDatabase(db: TallerDatabase): Promise<void> {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Local Save] Error saving local fallback JSON:', err);
  }

  if (isSupabaseEnabled && supabase) {
    try {
      console.log('[Supabase Save] Syncing changes to cloud PostgreSQL tables...');

      const cleanedClientes = db.clientes.map(c => ({
        id: c.id,
        cedula: c.cedula || '',
        nombre_completo: c.nombre_completo,
        telefono: c.telefono || '',
        email: c.email || '',
        direccion: c.direccion || '',
        fecha_registro: c.fecha_registro,
        notas: c.notes || c.notas || '',
        activo: c.activo === undefined ? true : !!c.activo
      }));

      const cleanedEquipos = db.equipos.map(e => ({
        id: e.id,
        cliente_id: e.cliente_id,
        marca: e.marca,
        modelo: e.modelo,
        serial: e.serial,
        tipo_equipo: e.tipo_equipo || 'otro',
        color: e.color || '',
        accesorios_recibidos: typeof e.accesorios_recibidos === 'object' ? JSON.stringify(e.accesorios_recibidos) : (e.accesorios_recibidos || '[]'),
        estado_ingreso: e.estado_ingreso || 'regular',
        observaciones_ingreso: e.observaciones_ingreso || '',
        fecha_ingreso: e.fecha_ingreso,
        activo: e.activo === undefined ? true : !!e.activo
      }));

      const cleanedReparaciones = db.reparaciones.map(r => ({
        id: r.id,
        equipo_id: r.equipo_id,
        numero_orden: r.numero_orden,
        fecha_ingreso: r.fecha_ingreso,
        fecha_entrega_prometida: r.fecha_entrega_prometida || '',
        fecha_entrega_real: r.fecha_entrega_real || '',
        falla_reportada: r.falla_reportada,
        diagnostico_tecnico: r.diagnostico_tecnico || '',
        sintomas: r.sintomas || '',
        trabajo_realizado: r.trabajo_realizado || '',
        repuestos_utilizados: typeof r.repuestos_utilizados === 'object' ? JSON.stringify(r.repuestos_utilizados) : (r.repuestos_utilizados || '[]'),
        costo_mano_obra: Number(r.costo_mano_obra || 0),
        costo_repuestos: Number(r.costo_repuestos || 0),
        costo_total: Number(r.costo_total || 0),
        descuento: Number(r.descuento || 0),
        monto_final: Number(r.monto_final || 0),
        estado: r.estado || 'pendiente',
        prioridad: r.prioridad || 'normal',
        tecnico_asignado: r.tecnico_asignado || '',
        dias_garantia: r.dias_garantia !== undefined ? Number(r.dias_garantia) : 30,
        fecha_inicio_garantia: r.fecha_inicio_garantia || '',
        fecha_fin_garantia: r.fecha_fin_garantia || '',
        condiciones_garantia: r.condiciones_garantia || '',
        presupuesto_aceptado: !!r.presupuesto_aceptado,
        fecha_aceptacion: r.fecha_aceptacion || '',
        firma_cliente: r.firma_cliente || '',
        estado_abandono: r.estado_abandono || 'activo',
        fecha_abandono: r.fecha_abandono || '',
        observaciones_abandono: r.observaciones_abandono || '',
        activo: r.activo === undefined ? true : !!r.activo
      }));

      const cleanedHistorial = db.historial_reparacion.map(h => ({
        id: h.id,
        reparacion_id: h.reparacion_id,
        fecha: h.fecha,
        usuario: h.usuario || 'Sistema',
        tipo: h.tipo || 'progreso',
        comentario: h.comentario || ''
      }));

      const cleanedFacturas = db.facturas.map(f => ({
        id: f.id,
        reparacion_id: f.reparacion_id,
        numero_factura: f.numero_factura,
        fecha_emision: f.fecha_emision,
        subtotal: Number(f.subtotal || 0),
        iva: Number(f.iva || 0),
        total: Number(f.total || 0),
        metodo_pago: f.metodo_pago || 'efectivo',
        referencia_pago: f.referencia_pago || '',
        estado: f.estado || 'pagada',
        created_at: f.created_at || ''
      }));

      // Fire parallel upserts
      const upsertPromises = [];
      if (cleanedClientes.length > 0) upsertPromises.push(supabase.from('clientes').upsert(cleanedClientes));
      if (cleanedEquipos.length > 0) upsertPromises.push(supabase.from('equipos').upsert(cleanedEquipos));
      if (cleanedReparaciones.length > 0) upsertPromises.push(supabase.from('reparaciones').upsert(cleanedReparaciones));
      if (cleanedHistorial.length > 0) upsertPromises.push(supabase.from('historial_reparacion').upsert(cleanedHistorial));
      if (cleanedFacturas.length > 0) upsertPromises.push(supabase.from('facturas').upsert(cleanedFacturas));

      const responses = await Promise.all(upsertPromises);
      for (const res of responses) {
        if (res.error) {
          console.error('[Supabase Save] Part of synchronization failed:', res.error);
        }
      }
      console.log('[Supabase Save] Synchronization complete.');
    } catch (err) {
      console.error('[Supabase Save] Exception saving to Supabase:', err);
    }
  }
}

// Mount DB routes
// GET ALL DATA
app.get('/api/backup/data', async (req, res) => {
  const db = await loadDatabase();
  res.json(db);
});

// CLIENTES CRUD
app.get('/api/clientes', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.clientes.filter(c => c.activo));
});

app.post('/api/clientes', async (req, res) => {
  const db = await loadDatabase();
  const { nombre_completo, cedula, telefono, email, direccion, notas } = req.body;
  
  if (!nombre_completo) {
    return res.status(400).json({ error: 'El nombre completo es requerido' });
  }

  // Check unique cedula if specified
  if (cedula) {
    const exists = db.clientes.find(c => c.cedula?.toLowerCase() === cedula.toLowerCase() && c.activo);
    if (exists) {
      return res.status(400).json({ error: 'Un cliente con esta cédula ya existe' });
    }
  }

  const nuevoCliente = {
    id: `cli-${Date.now()}`,
    cedula: cedula || '',
    nombre_completo,
    telefono: telefono || '',
    email: email || '',
    direccion: direccion || '',
    fecha_registro: new Date().toISOString(),
    notas: notas || '',
    activo: true
  };

  db.clientes.push(nuevoCliente);
  await saveDatabase(db);
  res.status(201).json(nuevoCliente);
});

app.put('/api/clientes/:id', async (req, res) => {
  const db = await loadDatabase();
  const index = db.clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const { nombre_completo, cedula, telefono, email, direccion, notas, activo } = req.body;
  db.clientes[index] = {
    ...db.clientes[index],
    nombre_completo: nombre_completo !== undefined ? nombre_completo : db.clientes[index].nombre_completo,
    cedula: cedula !== undefined ? cedula : db.clientes[index].cedula,
    telefono: telefono !== undefined ? telefono : db.clientes[index].telefono,
    email: email !== undefined ? email : db.clientes[index].email,
    direccion: direccion !== undefined ? direccion : db.clientes[index].direccion,
    notas: notas !== undefined ? notas : db.clientes[index].notas,
    activo: activo !== undefined ? activo : db.clientes[index].activo,
    ultima_visita: new Date().toISOString()
  };

  await saveDatabase(db);
  res.json(db.clientes[index]);
});

app.delete('/api/clientes/:id', async (req, res) => {
  const db = await loadDatabase();
  const index = db.clientes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  db.clientes[index].activo = false;
  await saveDatabase(db);
  res.json({ message: 'Cliente eliminado correctamente (Soft-delete)' });
});

// EQUIPOS CRUD
app.get('/api/equipos', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.equipos.filter(e => e.activo));
});

app.post('/api/equipos', async (req, res) => {
  const db = await loadDatabase();
  const { cliente_id, marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fotos_ingreso } = req.body;

  if (!cliente_id || !marca || !modelo || !serial) {
    return res.status(400).json({ error: 'cliente_id, marca, modelo y serial son obligatorios' });
  }

  const originalSerialExists = db.equipos.find(e => e.serial.toLowerCase() === serial.toLowerCase() && e.activo);
  if (originalSerialExists) {
    return res.status(400).json({ error: 'Un equipo con este serial ya se encuentra registrado' });
  }

  const nuevoEquipo = {
    id: `eq-${Date.now()}`,
    cliente_id,
    marca,
    modelo,
    serial,
    tipo_equipo: tipo_equipo || 'otro',
    color: color || '',
    accesorios_recibidos: accesorios_recibidos || [],
    estado_ingreso: estado_ingreso || 'regular',
    observaciones_ingreso: observaciones_ingreso || '',
    fotos_ingreso: fotos_ingreso || [],
    fecha_ingreso: new Date().toISOString(),
    activo: true
  };

  db.equipos.push(nuevoEquipo);
  await saveDatabase(db);
  res.status(201).json(nuevoEquipo);
});

app.put('/api/equipos/:id', async (req, res) => {
  const db = await loadDatabase();
  const index = db.equipos.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  const { marca, modelo, serial, tipo_equipo, color, accesorios_recibidos, estado_ingreso, observaciones_ingreso, fotos_ingreso, activo } = req.body;
  db.equipos[index] = {
    ...db.equipos[index],
    marca: marca !== undefined ? marca : db.equipos[index].marca,
    modelo: modelo !== undefined ? modelo : db.equipos[index].modelo,
    serial: serial !== undefined ? serial : db.equipos[index].serial,
    tipo_equipo: tipo_equipo !== undefined ? tipo_equipo : db.equipos[index].tipo_equipo,
    color: color !== undefined ? color : db.equipos[index].color,
    accesorios_recibidos: accesorios_recibidos !== undefined ? accesorios_recibidos : db.equipos[index].accesorios_recibidos,
    estado_ingreso: estado_ingreso !== undefined ? estado_ingreso : db.equipos[index].estado_ingreso,
    observaciones_ingreso: observaciones_ingreso !== undefined ? observaciones_ingreso : db.equipos[index].observaciones_ingreso,
    fotos_ingreso: fotos_ingreso !== undefined ? fotos_ingreso : db.equipos[index].fotos_ingreso,
    activo: activo !== undefined ? activo : db.equipos[index].activo
  };

  await saveDatabase(db);
  res.json(db.equipos[index]);
});

// REPARACIONES CRUD
app.get('/api/reparaciones', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.reparaciones.filter(r => r.activo));
});

// Create Repair Order (REP-YYYY-XXXX)
app.post('/api/reparaciones', async (req, res) => {
  const db = await loadDatabase();
  const { equipo_id, falla_reportada, prioridad, tecnico_asignado, dias_garantia, condiciones_garantia } = req.body;

  if (!equipo_id || !falla_reportada) {
    return res.status(400).json({ error: 'equipo_id y falla_reportada son requeridos' });
  }

  // Auto generate numero_orden Format: REP-YYYY-XXXX
  const yearNum = new Date().getFullYear();
  const sameYearRepairs = db.reparaciones.filter(r => r.numero_orden.startsWith(`REP-${yearNum}`));
  const nextNum = sameYearRepairs.length + 1;
  const formattedNum = String(nextNum).padStart(4, '0');
  const numero_orden = `REP-${yearNum}-${formattedNum}`;

  const nuevaReparacion = {
    id: `rep-${Date.now()}`,
    equipo_id,
    numero_orden,
    fecha_ingreso: new Date().toISOString(),
    fecha_entrega_prometida: req.body.fecha_entrega_prometida || '',
    falla_reportada,
    diagnostico_tecnico: '',
    sintomas: req.body.sintomas || '',
    trabajo_realizado: '',
    repuestos_utilizados: [],
    costo_mano_obra: 0,
    costo_repuestos: 0,
    costo_total: 0,
    descuento: 0,
    monto_final: 0,
    estado: 'pendiente',
    prioridad: prioridad || 'normal',
    tecnico_asignado: tecnico_asignado || '',
    dias_garantia: dias_garantia !== undefined ? Number(dias_garantia) : 30,
    condiciones_garantia: condiciones_garantia || 'Garantía estándar. No cubre golpes, humedad o mal uso.',
    presupuesto_aceptado: false,
    estado_abandono: 'activo',
    activo: true
  };

  db.reparaciones.push(nuevaReparacion);

  // Add initial history entry
  const nuevoHistorial = {
    id: `his-${Date.now()}`,
    reparacion_id: nuevaReparacion.id,
    fecha: new Date().toISOString(),
    usuario: tecnico_asignado || 'Sistema',
    tipo: 'cambio_estado',
    comentario: `Orden registrada como '${nuevaReparacion.estado}'. Se reporta: "${falla_reportada}"`
  };
  db.historial_reparacion.push(nuevoHistorial);

  await saveDatabase(db);
  res.status(201).json(nuevaReparacion);
});

// Update repair progress details (costs, technician updates, spares etc.)
app.put('/api/reparaciones/:id', async (req, res) => {
  const db = await loadDatabase();
  const index = db.reparaciones.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Orden de reparación no encontrada' });
  }

  const prevDoc = db.reparaciones[index];
  const {
    diagnostico_tecnico, sintomas, trabajo_realizado, repuestos_utilizados,
    costo_mano_obra, descuento, estado, prioridad, tecnico_asignado, dias_garantia,
    condiciones_garantia, presupuesto_aceptado, firma_cliente, fecha_entrega_prometida,
    estado_abandono, observaciones_abandono
  } = req.body;

  // Track the fields changing to create a history event if state/signature changed
  const historyEvents: any[] = [];
  const now = new Date().toISOString();

  let repuestosList = repuestos_utilizados || prevDoc.repuestos_utilizados;
  let calculatedRepuestosCost = repuestosList.reduce((acc: number, item: any) => acc + (Number(item.cantidad) * Number(item.costo)), 0);
  let resolvedManoObra = costo_mano_obra !== undefined ? Number(costo_mano_obra) : prevDoc.costo_mano_obra;
  let subtotal = resolvedManoObra + calculatedRepuestosCost;
  let resolvedDescuento = descuento !== undefined ? Number(descuento) : prevDoc.descuento;
  let finalTotal = Math.max(0, subtotal - resolvedDescuento);

  // Checks for specific state changes
  if (estado && estado !== prevDoc.estado) {
    historyEvents.push({
      id: `his-${Date.now()}-1`,
      reparacion_id: prevDoc.id,
      fecha: now,
      usuario: tecnico_asignado || prevDoc.tecnico_asignado || 'Técnico asignado',
      tipo: 'cambio_estado',
      comentario: `Estado actualizado de '${prevDoc.estado}' a '${estado}'.`
    });
  }

  if (presupuesto_aceptado !== undefined && presupuesto_aceptado !== prevDoc.presupuesto_aceptado) {
    historyEvents.push({
      id: `his-${Date.now()}-2`,
      reparacion_id: prevDoc.id,
      fecha: now,
      usuario: 'Portal del Cliente',
      tipo: 'aprobacion',
      comentario: presupuesto_aceptado 
        ? `Presupuesto aprobado por el cliente por un monto final de $${finalTotal.toFixed(2)}.` 
        : `Presupuesto rechazado/revocado por el cliente.`
    });
  }

  // If status is changed to delivered, set fecha_entrega_real, start warranties
  let resolvedFechaEntregaReal = prevDoc.fecha_entrega_real;
  let resolvedFechaInicioGarantia = prevDoc.fecha_inicio_garantia;
  let resolvedFechaFinGarantia = prevDoc.fecha_fin_garantia;

  if (estado === 'entregado' && prevDoc.estado !== 'entregado') {
    resolvedFechaEntregaReal = now;
    resolvedFechaInicioGarantia = now;
    const resolvedDays = dias_garantia !== undefined ? Number(dias_garantia) : prevDoc.dias_garantia;
    const finDate = new Date();
    finDate.setDate(finDate.getDate() + resolvedDays);
    resolvedFechaFinGarantia = finDate.toISOString();

    // Auto-create standard Invoice (Factura)
    const existingFactura = db.facturas.find(f => f.reparacion_id === prevDoc.id);
    if (!existingFactura) {
      const yearStr = new Date().getFullYear();
      const facNum = `FAC-${yearStr}-${String(db.facturas.length + 1).padStart(4, '0')}`;
      const sTotal = finalTotal / 1.16; // Assumes 16% standard IVA included
      const ivaVal = finalTotal - sTotal;
      db.facturas.push({
        id: `fac-${Date.now()}`,
        reparacion_id: prevDoc.id,
        numero_factura: facNum,
        fecha_emision: now,
        subtotal: Number(sTotal.toFixed(2)),
        iva: Number(ivaVal.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        metodo_pago: 'efectivo',
        estado: 'pagada',
        created_at: now
      });
    }
  }

  // Manage abandonment transitions
  let resolvedFechaAbandono = prevDoc.fecha_abandono;
  if (estado_abandono === 'abandonado' && prevDoc.estado_abandono !== 'abandonado') {
    resolvedFechaAbandono = now;
  }

  db.reparaciones[index] = {
    ...prevDoc,
    diagnostico_tecnico: diagnostico_tecnico !== undefined ? diagnostico_tecnico : prevDoc.diagnostico_tecnico,
    sintomas: sintomas !== undefined ? sintomas : prevDoc.sintomas,
    trabajo_realizado: trabajo_realizado !== undefined ? trabajo_realizado : prevDoc.trabajo_realizado,
    repuestos_utilizados: repuestosList,
    costo_mano_obra: resolvedManoObra,
    costo_repuestos: calculatedRepuestosCost,
    costo_total: subtotal,
    descuento: resolvedDescuento,
    monto_final: finalTotal,
    estado: estado !== undefined ? estado : prevDoc.estado,
    prioridad: prioridad !== undefined ? prioridad : prevDoc.prioridad,
    tecnico_asignado: tecnico_asignado !== undefined ? tecnico_asignado : prevDoc.tecnico_asignado,
    dias_garantia: dias_garantia !== undefined ? Number(dias_garantia) : prevDoc.dias_garantia,
    conditions_garantia: condiciones_garantia !== undefined ? condiciones_garantia : prevDoc.condiciones_garantia,
    condiciones_garantia: condiciones_garantia !== undefined ? condiciones_garantia : prevDoc.condiciones_garantia,
    presupuesto_aceptado: presupuesto_aceptado !== undefined ? !!presupuesto_aceptado : prevDoc.presupuesto_aceptado,
    fecha_aceptacion: presupuesto_aceptado && !prevDoc.presupuesto_aceptado ? now : prevDoc.fecha_aceptacion,
    firma_cliente: firma_cliente !== undefined ? firma_cliente : prevDoc.firma_cliente,
    
    // Delivery Dates
    fecha_entrega_prometida: fecha_entrega_prometida !== undefined ? fecha_entrega_prometida : prevDoc.fecha_entrega_prometida,
    fecha_entrega_real: resolvedFechaEntregaReal,
    fecha_inicio_garantia: resolvedFechaInicioGarantia,
    fecha_fin_garantia: resolvedFechaFinGarantia,

    // Abandonment Policy fields
    estado_abandono: estado_abandono !== undefined ? estado_abandono : prevDoc.estado_abandono,
    fecha_abandono: resolvedFechaAbandono,
    observaciones_abandono: observaciones_abandono !== undefined ? observaciones_abandono : prevDoc.observaciones_abandono
  };

  // Push accumulated history events
  if (historyEvents.length > 0) {
    db.historial_reparacion.push(...historyEvents);
  }

  await saveDatabase(db);
  res.json(db.reparaciones[index]);
});

// HISTORIAL ENDPOINTS
app.get('/api/reparaciones/:id/historial', async (req, res) => {
  const db = await loadDatabase();
  const hist = db.historial_reparacion.filter(h => h.reparacion_id === req.params.id);
  res.json(hist.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
});

app.post('/api/reparaciones/:id/historial', async (req, res) => {
  const db = await loadDatabase();
  const { usuario, tipo, comentario, fotos, metadata } = req.body;

  if (!comentario) {
    return res.status(400).json({ error: 'El comentario es requerido para registrar el hito.' });
  }

  const nuevoHito = {
    id: `his-${Date.now()}`,
    reparacion_id: req.params.id,
    fecha: new Date().toISOString(),
    usuario: usuario || 'Técnico asignado',
    tipo: tipo || 'progreso',
    comentario: comentario,
    fotos: fotos || [],
    metadata: metadata || {}
  };

  db.historial_reparacion.push(nuevoHito);
  await saveDatabase(db);
  res.json(nuevoHito);
});

// BILLING & INVOICES
app.get('/api/facturas', async (req, res) => {
  const db = await loadDatabase();
  res.json(db.facturas);
});

// SERVICE: GOOGLE DRIVE SIMULATOR
app.get('/api/drive/folders', (req, res) => {
  res.json({
    root: 'TALLER_ELECTRONICA_ID_9921',
    folders: [
      { name: 'CLIENTES', subfolders: ['Documentos', 'Firmas', 'Identificaciones'] },
      { name: 'REPARACIONES', subfolders: ['Fotos_Ingreso', 'Fotos_Progreso', 'Fotos_Finales', 'Documentos_Tecnicos', 'Videos'] },
      { name: 'EQUIPOS', subfolders: ['Manuales', 'Diagramas', 'Firmware', 'Drivers'] },
      { name: 'FACTURACION', subfolders: ['Facturas_Emitidas', 'Facturas_Pagadas', 'Comprobantes_Pago'] },
      { name: 'GARANTIAS', subfolders: ['Certificados', 'Seguimiento', 'Reclamaciones'] },
      { name: 'BACKUPS', subfolders: ['Base_Datos', 'Fotos', 'Documentos'] }
    ]
  });
});

app.post('/api/drive/backup', async (req, res) => {
  const db = await loadDatabase();
  const backupFolderId = 'DRIVE-BACKUP-FOLDER-' + new Date().toISOString().slice(0, 10);
  const replicaPath = path.join(path.dirname(DB_PATH), `backup_db_${Date.now()}.json`);
  
  // Replicate db on workspace as simulated sync
  fs.writeFileSync(replicaPath, JSON.stringify(db, null, 2));

  res.json({
    success: true,
    message: 'Respaldo completo sincronizado exitosamente con Google Drive.',
    backup_folder_id: backupFolderId,
    timestamp: new Date().toISOString(),
    file_uploaded: 'taller_db_backup.json',
    file_size_bytes: fs.statSync(DB_PATH).size,
    drive_location: '/TALLER_ELECTRONICA/BACKUPS/Base_Datos/'
  });
});

// SERVICE: GEMINI INTELLIGENT AI DIAGNOSIS
app.post('/api/gemini/diagnose', async (req, res) => {
  const { marca, modelo, falla, sintomas } = req.body;

  if (!marca || !modelo || !falla) {
    return res.status(400).json({ error: 'La marca, modelo y falla del equipo son requeridos.' });
  }

  const prompt = `Analiza técnicamente la siguiente falla reportada para el equipo de electrónica de consumo:
- Marca: ${marca}
- Modelo: ${modelo}
- Falla reportada: ${falla}
- Síntomas específicos: ${sintomas || 'No especificados'}

Proporciona un diagnóstico técnico preliminar profesional orientado a un servicio técnico de reparación de hardware.
Debes devolver la respuesta estrictamente estructurada en formato JSON válido con los siguientes campos especificados en español:
1. "causas_posibles": un arreglo de strings (mínimo 3) que expliquen claramente los desperfectos de hardware más probables a nivel de componentes o líneas de energía.
2. "repuestos_recomendados": un arreglo de objetos, cada uno con "nombre" (ej. "Módulo de pantalla original", "Puerto pin de carga USB-C", "Termistor de placa") y "costo_estimado" (número en dólares americanos, ej: 45.00).
3. "tiempo_reparacion_minutos": entero que represente el tiempo estándar estimado para desensamblado, soldadura/reemplazo y pruebas (ej: 60).
4. "procedimiento_reparacion": un arreglo de strings detallando la secuencia de pasos lógicos que debe seguir el técnico para solucionar el problema con seguridad.
5. "riesgos_o_notas": un arreglo de strings con advertencias de manipulación para evitar dañar pantallas, desgastar metal líquido o quemar placas durante la soldadura.
6. "tasa_exito_porcentaje": entero de 0 a 100 indicando la probabilidad de que la reparación sea exitosa si se hace de forma experta.
7. "dificultad": una sola palabra de nivel de dificultad: "Fácil", "Mediana" o "Difícil".`;

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant, realistic Rule-Based Fallback if Gemini Key is not set or valid
    console.log('Using local diagnostics engine fallback...');
    const matchType = (falla + ' ' + (sintomas || '')).toLowerCase();
    
    let causes = [
      'Daño físico en el puerto de conexión debido a esfuerzo mecánico o suciedad compactada.',
      'Degradación electrolítica en las celdas químicas de la batería o fatiga del elastómero.',
      'Condensador de desacople de alimentación principal en cortocircuito.'
    ];
    let spares = [{ nombre: 'Pin de carga universal', costo_estimado: 12.00 }, { nombre: 'Batería de reemplazo ion-litio', costo_estimado: 25.00 }];
    let time = 90;
    let proc = [
      'Desconectar la batería inmediatamente para cortar la tensión en la placa lógica.',
      'Realizar inspección bajo microscopio óptico buscando corrosión orgánica o resoldados fríos.',
      'Inyectar voltaje seguro en el nodo primario limitando corriente para comprobar cortos con cámara térmica.',
      'Reemplazar componente defectuoso mediante estación de soldadura de aire caliente controlada.'
    ];
    let notes = ['Pinchamiento de pantalla flex. Extremar cuidado al despegar cristal frontal.', 'Aislar componentes aledaños sensibles al calor usando cinta de poliimida de alto rendimiento.'];
    let rate = 85;
    let diff = 'Mediana';

    if (matchType.includes('mojad') || matchType.includes('agua') || matchType.includes('líquido')) {
      causes = [
        'Corrosión galvánica activa en líneas de alta tensión (VBUS / Retroiluminación de pantalla).',
        'Cortocircuito general bajo circuitos integrados BGA (Audio, PMIC de carga) por acumulación salina.',
        'Sulfatación de puertos conectores FPC de flex'
      ];
      spares = [
        { nombre: 'Limpiador desoxidante ultrasónico químico', costo_estimado: 8.00 },
        { nombre: 'Flex conector FPC repuesto', costo_estimado: 15.00 }
      ];
      time = 120;
      proc = [
        'Desensamblar totalmente la placa base retirando blindajes térmicos.',
        'Bañar la placa en tina ultrasónica con alcohol isopropílico de alta pureza por 15 minutos.',
        'Secar meticulosamente en horno de calor suave a 50°C.',
        'Verificar cortocircuitos bajo microscopio de luz polarizada antes de reincorporar batería.'
      ];
      notes = ['No intentar encender bajo ningún concepto hasta lograr desoxidación profunda.', 'La corrosión puede seguir activa si quedan sedimentos debajo de los encapsulados BGA.'];
      rate = 55;
      diff = 'Difícil';
    } else if (matchType.includes('apaga') || matchType.includes('calien') || matchType.includes('refriger')) {
      causes = [
        'Pasta o metal térmico reseco que impide el correcto intercambio refrigerativo.',
        'Obstrucción densa de pelusas en la tobera de ventilación del extractor.',
        'Fallo del sensor de temperatura analógico en placa lógica.'
      ];
      spares = [
        { nombre: 'Metal Líquido o pasta térmica de alto rendimiento', costo_estimado: 15.00 },
        { nombre: 'Turbina de micro-ventilador repuesto', costo_estimado: 30.00 }
      ];
      time = 60;
      proc = [
        'Limpieza física profunda de paletas de ventilación y filtros.',
        'Retiro de residuos de pasta térmica previa petrificada con solvente técnico.',
        'Aplicación fina y uniforme del nuevo compuesto de transferencia.',
        'Prueba de rendimiento bajo estrés térmico por 30 minutos monitorizando temperaturas de sensores.'
      ];
      notes = ['El metal líquido conduce electricidad. Un desborde puede destruir irreparablemente la placa.', 'Verificar que la velocidad de rotación de la turbina varíe de forma proporcional a la carga térmica.'];
      rate = 95;
      diff = 'Fácil';
    }

    return res.json({
      causas_posibles: causes,
      repuestos_recomendaos: spares, // compatible key mapping
      repuestos_recomendados: spares,
      tiempo_reparacion_minutos: time,
      procedimiento_reparacion: proc,
      riesgos_o_notas: notes,
      tasa_exito_porcentaje: rate,
      dificultad: diff,
      is_simulated: true
    });
  }

  // Real Gemini Call with structured output schema instruction
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            causas_posibles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Explicación clara de hardware probable como causa por componente'
            },
            repuestos_recomendados: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nombre: { type: Type.STRING },
                  costo_estimado: { type: Type.NUMBER }
                },
                required: ['nombre', 'costo_estimado']
              }
            },
            tiempo_reparacion_minutos: {
              type: Type.INTEGER,
              description: 'Tiempo estándar del trabajo en minutos'
            },
            procedimiento_reparacion: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Pasos ordenados recomendados'
            },
            riesgos_o_notas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tasa_exito_porcentaje: {
              type: Type.INTEGER
            },
            dificultad: {
              type: Type.STRING,
              description: 'Fácil, Mediana, Difícil'
            }
          },
          required: [
            'causas_posibles', 'repuestos_recomendados', 
            'tiempo_reparacion_minutos', 'procedimiento_reparacion', 
            'riesgos_o_notas', 'tasa_exito_porcentaje', 'dificultad'
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini call failed or JSON parsing error:', error);
    res.status(500).json({ 
      error: 'Error al contactar con la inteligencia artificial de Gemini. Intente de nuevo.',
      message: error.message 
    });
  }
});

// Helper year function
function year(): number {
  return new Date().getFullYear();
}

startServer();

async function startServer() {
  // Vite integration middleware or production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend compiled bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Taller Electrónica backend] Backend running on port ${PORT}`);
    // Pre-create/load DB on startup
    loadDatabase()
      .then(() => console.log('[Taller Electrónica backend] Database loaded/verified on startup.'))
      .catch((err) => console.error('[Taller Electrónica backend] Database load error on startup:', err));
  });
}
