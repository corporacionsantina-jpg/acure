export interface Cliente {
  id: string;
  cedula: string;
  nombre_completo: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_registro: string;
  ultima_visita?: string;
  notas?: string;
  activo: boolean;
}

export type TipoEquipo = 'celular' | 'tablet' | 'laptop' | 'tv' | 'consola' | 'otro';

export interface Equipo {
  id: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  serial: string;
  tipo_equipo: TipoEquipo;
  color?: string;
  accesorios_recibidos: string[]; // checklist, e.g., ['cargador', 'cable', 'funda', 'caja']
  estado_ingreso: 'nuevo' | 'bueno' | 'regular' | 'malo';
  observaciones_ingreso: string;
  fotos_ingreso: string[]; // Base64 or local server static URLs
  fecha_ingreso: string;
  activo: boolean;
}

export type EstadoReparacion = 'pendiente' | 'diagnostico' | 'reparacion' | 'pruebas' | 'reparado' | 'entregado' | 'cancelado';
export type PrioridadReparacion = 'baja' | 'normal' | 'urgente';
export type EstadoAbandono = 'activo' | 'abandonado' | 'chatarra';

export interface RepuestoItem {
  nombre: string;
  cantidad: number;
  costo: number; // cost to customer
}

export interface Reparacion {
  id: string;
  equipo_id: string;
  numero_orden: string; // Format: REP-YYYY-XXXX
  fecha_ingreso: string;
  fecha_entrega_prometida?: string;
  fecha_entrega_real?: string;
  
  // Diagnóstico y falla
  falla_reportada: string;
  diagnostico_tecnico?: string;
  sintomas?: string;
  
  // Trabajo y Costos
  trabajo_realizado?: string;
  repuestos_utilizados: RepuestoItem[];
  costo_mano_obra: number;
  costo_repuestos: number;
  costo_total: number;
  descuento: number;
  monto_final: number;
  
  // Estados y personal
  estado: EstadoReparacion;
  prioridad: PrioridadReparacion;
  tecnico_asignado?: string;
  
  // Garantía
  dias_garantia: number; // e.g., 30, 90, 365
  fecha_inicio_garantia?: string;
  fecha_fin_garantia?: string;
  condiciones_garantia?: string;
  
  // Aprobación de presupuesto
  presupuesto_aceptado: boolean;
  fecha_aceptacion?: string;
  firma_cliente?: string; // DataURL de la firma
  
  // Abandono (Políticas de 30 días)
  fecha_abandono?: string;
  estado_abandono: EstadoAbandono;
  observaciones_abandono?: string;
  
  activo: boolean;
}

export interface HistorialReparacion {
  id: string;
  reparacion_id: string;
  fecha: string;
  usuario: string; // e.g., 'Técnico Pérez', 'Sistema'
  tipo: 'diagnostico' | 'progreso' | 'nota' | 'foto' | 'cambio_estado' | 'aprobacion';
  comentario: string;
  fotos?: string[];
  metadata?: Record<string, any>;
}

export interface Factura {
  id: string;
  reparacion_id: string;
  numero_factura: string;
  fecha_emision: string;
  subtotal: number;
  iva: number;
  total: number;
  metodo_pago: 'efectivo' | 'transferencia' | 'pago_movil' | 'punto' | 'otro';
  referencia_pago?: string;
  estado: 'emitida' | 'pagada' | 'anulada';
  created_at: string;
}

export interface Statistics {
  totalReparaciones: number;
  reparacionesPorEstado: Record<EstadoReparacion, number>;
  ingresosMensuales: Array<{ mes: string; ingresos: number }>;
  sistemasFrecuentes: Array<{ marcaModelo: string; count: number }>;
  tiempoPromedioReparacion: number; // en horas o días
  garantiasPorVencer: number; // activas con menos de 7 días
  equiposAbandonados: number; // estado_abandono = abandonado / chatarra
}
