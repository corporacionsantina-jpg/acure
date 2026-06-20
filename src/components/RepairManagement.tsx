import React, { useState } from 'react';
import { Search, Plus, Edit2, ClipboardList, PenTool, CheckCircle, Clock, Shield, FileText, AlertTriangle, Printer, Sparkles, X, ChevronRight, MessageSquare } from 'lucide-react';
import { Cliente, Equipo, Reparacion, EstadoReparacion, PrioridadReparacion, RepuestoItem } from '../types';
import InteractiveSignature from './InteractiveSignature';
import SmartDiagnostic from './SmartDiagnostic';

// Dollars sign helper fallback
function DollarSign(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  );
}

interface RepairManagementProps {
  clientes: Cliente[];
  equipos: Equipo[];
  reparaciones: Reparacion[];
  onRefresh: () => void;
  onPrintTicket: (data: { cliente: Cliente; equipo: Equipo; reparacion: Reparacion }) => void;
}

export default function RepairManagement({
  clientes,
  equipos,
  reparaciones,
  onRefresh,
  onPrintTicket
}: RepairManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepair, setSelectedRepair] = useState<Reparacion | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Creation / editing states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New repair form state
  const [newEquipoId, setNewEquipoId] = useState('');
  const [newFalla, setNewFalla] = useState('');
  const [newPrioridad, setNewPrioridad] = useState<PrioridadReparacion>('normal');
  const [newTecnico, setNewTecnico] = useState('');
  const [newDiasGarantia, setNewDiasGarantia] = useState(30);
  const [newCondicionesGarantia, setNewCondicionesGarantia] = useState('Garantía de servicio limitada. No cubre golpes, tensiones eléctricas anormales o humedad.');
  const [newFechaPrometida, setNewFechaPrometida] = useState('');

  // Editing repair progress state
  const [editEstado, setEditEstado] = useState<EstadoReparacion>('pendiente');
  const [editDiagnostico, setEditDiagnostico] = useState('');
  const [editTrabajoRealizado, setEditTrabajoRealizado] = useState('');
  const [editManoObra, setEditManoObra] = useState<number>(0);
  const [editDescuento, setEditDescuento] = useState<number>(0);
  const [editPrioridad, setEditPrioridad] = useState<PrioridadReparacion>('normal');
  const [editTecnico, setEditTecnico] = useState('');
  const [editDiasGarantia, setEditDiasGarantia] = useState<number>(30);
  const [editCondicionesGarantia, setEditCondicionesGarantia] = useState('');
  const [editPresupuestoAceptado, setEditPresupuestoAceptado] = useState(false);
  const [editFirma, setEditFirma] = useState('');
  const [editFechaPrometida, setEditFechaPrometida] = useState('');

  // Spares sub-state
  const [editRepuestos, setEditRepuestos] = useState<RepuestoItem[]>([]);
  const [newSpareNombre, setNewSpareNombre] = useState('');
  const [newSpareCant, setNewSpareCant] = useState(1);
  const [newSpareCosto, setNewSpareCosto] = useState<number>(0);

  // Milestone comment sub-state
  const [newMilestoneComment, setNewMilestoneComment] = useState('');
  const [milestones, setMilestones] = useState<any[]>([]);

  // Open Create Order Modal
  const openCreateOrder = () => {
    setNewEquipoId('');
    setNewFalla('');
    setNewPrioridad('normal');
    setNewTecnico('Erick Silva (Nivel 2)');
    setNewDiasGarantia(30);
    setNewCondicionesGarantia('Garantía de servicio limitada por nuestro laboratorio técnico. Excluye caídas, golpes, tensiones erráticas o contacto directo con agua.');
    setNewFechaPrometida('');
    setModalError(null);
    setShowCreateModal(true);
  };

  // Open Update / Diagnostics Modal
  const openEditOrder = (repair: Reparacion) => {
    setEditEstado(repair.estado);
    setEditDiagnostico(repair.diagnostico_tecnico || '');
    setEditTrabajoRealizado(repair.trabajo_realizado || '');
    setEditManoObra(repair.costo_mano_obra);
    setEditDescuento(repair.descuento);
    setEditPrioridad(repair.prioridad);
    setEditTecnico(repair.tecnico_asignado || '');
    setEditDiasGarantia(repair.dias_garantia);
    setEditCondicionesGarantia(repair.condiciones_garantia || '');
    setEditPresupuestoAceptado(repair.presupuesto_aceptado);
    setEditFirma(repair.firma_cliente || '');
    setEditRepuestos([...repair.repuestos_utilizados]);
    setEditFechaPrometida(repair.fecha_entrega_prometida ? repair.fecha_entrega_prometida.substring(0, 10) : '');
    setModalError(null);
    setShowEditModal(true);
    fetchMilestones(repair.id);
  };

  const fetchMilestones = async (repairId: string) => {
    try {
      const res = await fetch(`/api/reparaciones/${repairId}/historial`);
      const hData = await res.json();
      setMilestones(hData);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  // Add spare item to the local list during edit
  const handleAddSpare = () => {
    if (!newSpareNombre.trim() || newSpareCosto <= 0 || newSpareCant <= 0) return;
    const item: RepuestoItem = {
      nombre: newSpareNombre.trim(),
      cantidad: Number(newSpareCant),
      costo: Number(newSpareCosto)
    };
    setEditRepuestos([...editRepuestos, item]);
    setNewSpareNombre('');
    setNewSpareCant(1);
    setNewSpareCosto(0);
  };

  const handleRemoveSpare = (index: number) => {
    setEditRepuestos(editRepuestos.filter((_, i) => i !== index));
  };

  // Submit Save Create Repair
  const handleCreateRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newEquipoId) {
      setModalError('Debe seleccionar el equipo a reparar.');
      return;
    }
    if (!newFalla.trim()) {
      setModalError('Debe ingresar el detalle de la falla reportada.');
      return;
    }

    const payload = {
      equipo_id: newEquipoId,
      falla_reportada: newFalla.trim(),
      prioridad: newPrioridad,
      tecnico_asignado: newTecnico,
      dias_garantia: newDiasGarantia,
      condiciones_garantia: newCondicionesGarantia,
      fecha_entrega_prometida: newFechaPrometida ? new Date(newFechaPrometida).toISOString() : ''
    };

    try {
      const res = await fetch('/api/reparaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la orden.');

      setShowCreateModal(false);
      onRefresh();
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  // Submit Save Edit Repair updates
  const handleUpdateRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const payload = {
      estado: editEstado,
      diagnostico_tecnico: editDiagnostico,
      trabajo_realizado: editTrabajoRealizado,
      repuestos_utilizados: editRepuestos,
      costo_mano_obra: Number(editManoObra),
      descuento: Number(editDescuento),
      prioridad: editPrioridad,
      tecnico_asignado: editTecnico,
      dias_garantia: Number(editDiasGarantia),
      condiciones_garantia: editCondicionesGarantia,
      presupuesto_aceptado: editPresupuestoAceptado,
      firma_cliente: editFirma,
      fecha_entrega_prometida: editFechaPrometida ? new Date(editFechaPrometida).toISOString() : ''
    };

    try {
      const res = await fetch(`/api/reparaciones/${selectedRepair!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la orden.');

      setShowEditModal(false);
      setSelectedRepair(data);
      onRefresh();
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  // Quick state patch changer
  const handlePatchStatus = async (id: string, status: EstadoReparacion) => {
    try {
      const res = await fetch(`/api/reparaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: status })
      });
      if (res.ok) {
        const updated = await res.json();
        if (selectedRepair?.id === id) setSelectedRepair(updated);
        onRefresh();
      } else {
        alert('Fallo al cambiar estado de forma rápida.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch client and device helper objects
  const getLinkedDetails = (repair: Reparacion) => {
    const eq = equipos.find(e => e.id === repair.equipo_id);
    const cli = eq ? clientes.find(c => c.id === eq.cliente_id) : null;
    return { equipo: eq, cliente: cli };
  };

  // Filter and search repairs
  const filteredRepairs = reparaciones.filter(r => {
    const details = getLinkedDetails(r);
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
      r.numero_orden.toLowerCase().includes(query) ||
      r.falla_reportada.toLowerCase().includes(query) ||
      (details.cliente && details.cliente.nombre_completo.toLowerCase().includes(query)) ||
      (details.equipo && details.equipo.marca.toLowerCase().includes(query)) ||
      (details.equipo && details.equipo.modelo.toLowerCase().includes(query)) ||
      (details.equipo && details.equipo.serial.toLowerCase().includes(query));

    const matchesStatus = filterStatus === 'todos' || r.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats on selected repair details
  const getCostoBreakdown = (r: Reparacion) => {
    const sparesSum = r.repuestos_utilizados.reduce((sum, item) => sum + (item.cantidad * item.costo), 0);
    return {
      sparesSum,
      manoObra: r.costo_mano_obra,
      total: sparesSum + r.costo_mano_obra - r.descuento
    };
  };

  const getStatusBadge = (status: EstadoReparacion) => {
    const labelMap: Record<EstadoReparacion, string> = {
      pendiente: 'Pendiente',
      diagnostico: 'En Diagnóstico',
      reparacion: 'Reparación Activa',
      pruebas: 'En Control de Calidad',
      reparado: 'Reparado (Listo)',
      entregado: 'Entregado (Cerrado)',
      cancelado: 'Cancelado'
    };

    const colorMap: Record<EstadoReparacion, string> = {
      pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
      diagnostico: 'bg-sky-100 text-sky-800 border-sky-200',
      reparacion: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      pruebas: 'bg-purple-100 text-purple-800 border-purple-200',
      reparado: 'bg-teal-100 text-teal-800 border-teal-200',
      entregado: 'bg-emerald-150 text-emerald-800 border-emerald-300',
      cancelado: 'bg-rose-100 text-rose-800 border-rose-200'
    };

    return (
      <span className={`px-2.5 py-1 text-xxs font-extrabold uppercase rounded-full border ${colorMap[status] || 'bg-slate-100'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  const handlePostMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneComment.trim() || !selectedRepair) return;

    try {
      const res = await fetch(`/api/reparaciones/${selectedRepair.id}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comentario: newMilestoneComment.trim(),
          usuario: selectedRepair.tecnico_asignado || 'Técnico Pérez',
          tipo: 'progreso'
        })
      });
      if (res.ok) {
        setNewMilestoneComment('');
        fetchMilestones(selectedRepair.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyAIDiagnosis = (aiData: {
    diagnostico: string;
    repuestos: Array<{ nombre: string; cantidad: number; costo: number }>;
    manoDeObra: number;
    diasGarantia: number;
  }) => {
    setEditDiagnostico(aiData.diagnostico);
    setEditRepuestos([...editRepuestos, ...aiData.repuestos]);
    setEditManoObra(aiData.manoDeObra);
    setEditDiasGarantia(aiData.diasGarantia);
    setEditEstado('diagnostico');
    alert('Diagnóstico sugerido por la IA Gemini importado exitosamente.');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in" id="repair-management-workspace">
      
      {/* Search and repair selection sidebar */}
      <div className="xl:col-span-2 space-y-4">
        
        {/* Filters panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por orden, cliente, serial, falla..."
              id="search-repairs-bar"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5" id="status-filter-buttons-panel">
            {([
              { val: 'todos', lbl: 'Todos' },
              { val: 'pendiente', lbl: 'Pendientes' },
              { val: 'diagnostico', lbl: 'Diagnóstico' },
              { val: 'reparacion', lbl: 'En Reparación' },
              { val: 'pruebas', lbl: 'Calidad' },
              { val: 'reparado', lbl: 'Listos' },
              { val: 'entregado', lbl: 'Entregados' }
            ]).map(st => (
              <button
                key={st.val}
                onClick={() => setFilterStatus(st.val)}
                className={`py-1 px-3 text-xxs font-semibold rounded-lg cursor-pointer border transition-all ${
                  filterStatus === st.val
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-150 hover:bg-slate-50'
                }`}
              >
                {st.lbl}
              </button>
            ))}
          </div>

          <button
            onClick={openCreateOrder}
            id="btn-trigger-create-repair"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Abrir Nueva Órden de Reparación
          </button>
        </div>

        {/* Repair tickets grid */}
        <div className="space-y-3" id="repairs-cards-scroller">
          {filteredRepairs.length === 0 ? (
            <div className="text-center p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              No hay tickets de reparación que coincidan con su filtro.
            </div>
          ) : (
            filteredRepairs.map(repair => {
              const details = getLinkedDetails(repair);
              const costDetails = getCostoBreakdown(repair);
              return (
                <div
                  key={repair.id}
                  onClick={() => {
                    setSelectedRepair(repair);
                    fetchMilestones(repair.id);
                  }}
                  id={`repair-card-${repair.id}`}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedRepair?.id === repair.id
                      ? 'bg-indigo-50/35 border-indigo-250 ring-2 ring-indigo-500/5 shadow-md'
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-extrabold text-slate-800 text-xs">{repair.numero_orden}</span>
                    <div className="flex gap-1 items-center">
                      {repair.prioridad === 'urgente' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                          Urgente
                        </span>
                      )}
                      {getStatusBadge(repair.estado)}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 font-medium mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Cliente:</span>
                      <span className="text-slate-800 font-bold">{details.cliente?.nombre_completo || 'No especificado'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Equipo:</span>
                      <span className="text-slate-800">{details.equipo ? `${details.equipo.marca} ${details.equipo.modelo}` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xxs font-mono text-slate-400">
                    <span>Ingresado: {new Date(repair.fecha_ingreso).toLocaleString().slice(0, 10)}</span>
                    <span className="font-bold text-slate-700">Presupuesto: <span className="font-extrabold text-emerald-600">${costDetails.total.toFixed(2)}</span></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Repair details inspection card */}
      <div className="xl:col-span-2">
        {selectedRepair ? (
          (() => {
            const details = getLinkedDetails(selectedRepair);
            const costDetails = getCostoBreakdown(selectedRepair);
            return (
              <div className="bg-white border border-slate-250 rounded-2xl p-6 space-y-6 shadow-sm" id="repair-inspection-view">
                
                {/* Profile detail hero */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-800 text-sm tracking-tight">{selectedRepair.numero_orden}</h3>
                      <span className="text-slate-350">·</span>
                      <span className="text-xxs font-mono bg-slate-100 text-slate-500 border border-slate-150 px-1.5 py-0.5 rounded font-bold uppercase">
                        {selectedRepair.prioridad}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Garantía estipulada de {selectedRepair.dias_garantia} días hábiles.</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPrintTicket({ cliente: details.cliente!, equipo: details.equipo!, reparacion: selectedRepair })}
                      id="btn-trigger-ticket-print"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-1 border border-slate-200 cursor-pointer text-xxs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Ticket 58mm
                    </button>

                    <button
                      onClick={() => openEditOrder(selectedRepair)}
                      id="btn-edit-active-repair"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xxs font-bold py-1.5 px-3.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Actualizar Ficha
                    </button>
                  </div>
                </div>

                {/* Cliente y equipo vinculados summary widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                    <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-2">Cliente Asignado</span>
                    <div className="font-bold text-slate-800 text-xs">{details.cliente?.nombre_completo}</div>
                    <div className="text-slate-500 mt-1 font-mono text-[11px]">{details.cliente?.cedula || 'N/A'} · {details.cliente?.telefono}</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                    <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-2">Dispositivo Recibido</span>
                    <div className="font-bold text-slate-800 text-xs">{details.equipo?.marca} {details.equipo?.modelo}</div>
                    <div className="text-slate-400 mt-1 font-mono text-[11px]">S/N: {details.equipo?.serial}</div>
                    <div className="text-slate-500 mt-0.5 text-xxs truncate">Condición: {details.equipo?.estado_ingreso.toUpperCase()}</div>
                  </div>
                </div>

                {/* Technical status detail box */}
                <div className="space-y-4">
                  <div>
                    <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-1">Falla Reportada por el Cliente</span>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 italic font-medium leading-relaxed">
                      "{selectedRepair.falla_reportada}"
                    </p>
                  </div>

                  {selectedRepair.diagnostico_tecnico && (
                    <div>
                      <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-1">Informe Técnico y Diagnóstico Oficial</span>
                      <div className="bg-slate-800/10 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                        {selectedRepair.diagnostico_tecnico}
                      </div>
                    </div>
                  )}

                  {selectedRepair.trabajo_realizado && (
                    <div>
                      <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-1">Trabajo de Ingeniería Realizado</span>
                      <p className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100 text-xs text-slate-800">
                        {selectedRepair.trabajo_realizado}
                      </p>
                    </div>
                  )}
                </div>

                {/* Budget accept summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-1">Estatus del Presupuesto</span>
                    <span className={`font-bold transition-transform inline-block ${
                      selectedRepair.presupuesto_aceptado 
                        ? 'text-emerald-700 text-xs font-black' 
                        : 'text-amber-700 font-semibold text-xs'
                    }`}>
                      {selectedRepair.presupuesto_aceptado ? '✓ Presupuesto Totalmente Autorizado' : '✖ Aceptación Pendiente/Rechazada'}
                    </span>
                  </div>

                  {selectedRepair.firma_cliente && (
                    <div className="text-center">
                      <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block mb-1">Digital Firma</span>
                      <img 
                        src={selectedRepair.firma_cliente} 
                        alt="Firma del cliente" 
                        className="h-10 border border-slate-200 bg-white rounded p-1 object-contain inline-block" 
                      />
                    </div>
                  )}
                </div>

                {/* Finance cost ledger table summary */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-150">Cargos Oficiales Orden de Servicio</div>
                  <div className="divide-y divide-slate-100 p-4 space-y-2">
                    
                    <div className="flex justify-between pb-1.5 border-b border-slate-50 text-[11px]">
                      <span className="text-slate-500 font-medium">Mano de Obra (Labor Técnico)</span>
                      <span className="font-mono font-bold text-slate-800">${costDetails.manoObra.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1.5 pb-1.5 border-b border-slate-50 text-[11px]">
                      <span className="text-slate-500 font-medium block">Repuestos y Componentes en Custodia ({selectedRepair.repuestos_utilizados.length})</span>
                      <div className="pl-2 space-y-1">
                        {selectedRepair.repuestos_utilizados.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 font-mono text-[10px]">
                            <span>- {item.nombre} (x{item.cantidad})</span>
                            <span>${(item.cantidad * item.costo).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedRepair.descuento > 0 && (
                      <div className="flex justify-between pb-1.5 border-b border-slate-50 text-[11px] text-slate-500">
                        <span>Margen Descuento Especial</span>
                        <span className="font-mono text-slate-800">-${selectedRepair.descuento.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2.5 font-extrabold text-sm text-slate-900">
                      <span>TOTAL DE REPARACIÓN</span>
                      <span className="font-mono text-emerald-600 font-black">${costDetails.total.toFixed(2)}</span>
                    </div>

                  </div>
                </div>

                {/* Milestones timeline history log */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-slate-400" /> Bitácora Técnica de Sucesos
                  </h4>

                  <div className="relative border-l-2 border-slate-150 pl-4 space-y-4 ml-2" id="milestones-timeline-box">
                    {milestones.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">No se han ingresado progresos aún.</div>
                    ) : (
                      milestones.map(m => (
                        <div key={m.id} className="relative text-xs">
                          {/* Dot */}
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white -left-[21.5px] mt-1"></div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="font-bold text-slate-700 uppercase tracking-wide">{m.tipo} - {m.usuario}</span>
                            <span>{new Date(m.fecha).toLocaleString()}</span>
                          </div>
                          
                          <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">{m.comentario}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment submit post box */}
                  <form onSubmit={handlePostMilestone} className="flex gap-2">
                    <input
                      type="text"
                      value={newMilestoneComment}
                      onChange={(e) => setNewMilestoneComment(e.target.value)}
                      placeholder="Escribir registro de progreso para la bitácora..."
                      id="timeline-comment-input"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-black"
                    />
                    <button
                      type="submit"
                      id="btn-post-milestone"
                      className="bg-slate-950 text-white text-xs font-semibold px-4 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Registrar Hito
                    </button>
                  </form>
                </div>

              </div>
            );
          })()
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-10 text-slate-350 bg-slate-50 border border-dashed border-slate-200 rounded-3xl" id="repair-no-selection">
            <ClipboardList className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-xs font-bold text-slate-400">Ningún Ticket Seleccionado</span>
            <p className="text-[11px] text-slate-350 max-w-[180px] mt-1">Elija un ticket del scroller de la izquierda para desplegar o auditar los estados lógicos.</p>
          </div>
        )}
      </div>

      {/* CREATE REPAIR DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="create-repair-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Abrir Nueva Orden de Trabajo</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRepairSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="text-rose-600 bg-rose-50 text-xs p-3 rounded-lg flex items-start">
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vincular Dispositivo Custodia <span className="text-red-550">*</span></label>
                <select
                  value={newEquipoId}
                  onChange={(e) => setNewEquipoId(e.target.value)}
                  required
                  id="create-repair-device"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black font-semibold"
                >
                  <option value="">-- Seleccionar Equipo --</option>
                  {equipos.map(eq => {
                    const cli = clientes.find(c => c.id === eq.cliente_id);
                    return (
                      <option key={eq.id} value={eq.id}>
                        {eq.marca} {eq.modelo} [{eq.serial}] - {cli?.nombre_completo || 'Cliente Desconocido'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Descripción de la Falla Reportada por el Cliente <span className="text-red-550">*</span></label>
                <textarea
                  rows={2}
                  value={newFalla}
                  onChange={(e) => setNewFalla(e.target.value)}
                  required
                  placeholder="ej. No enciende tras mojarse en piscina, el cargador zumba"
                  id="create-repair-falla"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Prioridad de Reparación</label>
                  <select
                    value={newPrioridad}
                    onChange={(e) => setNewPrioridad(e.target.value as any)}
                    id="create-repair-priority"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
                  >
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Técnico Asignado</label>
                  <input
                    type="text"
                    value={newTecnico}
                    onChange={(e) => setNewTecnico(e.target.value)}
                    placeholder="ej. Erick Silva (Nivel 2)"
                    id="create-repair-tech"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Días de Garantía Ofrecida</label>
                  <input
                    type="number"
                    value={newDiasGarantia}
                    onChange={(e) => setNewDiasGarantia(Number(e.target.value))}
                    min={0}
                    id="create-repair-warranty-days"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fecha Promesa Ofrecida</label>
                  <input
                    type="date"
                    value={newFechaPrometida}
                    onChange={(e) => setNewFechaPrometida(e.target.value)}
                    id="create-repair-promise-date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Condiciones Particulares de la Garantía</label>
                <textarea
                  rows={2}
                  value={newCondicionesGarantia}
                  onChange={(e) => setNewCondicionesGarantia(e.target.value)}
                  id="create-repair-warranty-cond"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
                />
              </div>

              <div className="flex border-t border-slate-100 pt-4 items-center justify-end gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-new-repair"
                  className="px-4 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Iniciar Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT / DIAGNOSTICS DETAILED WORK MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-work-reparation-modal">
          <div className="bg-slate-50 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
            
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Actualizar Avance - {selectedRepair?.numero_orden}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Asentar informes diagnósticos, cargar componentes utilizados e incluir la firma de aprobación.</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto p-6" id="edit-repair-grid-layout">
              
              {/* Left Column Forms: State and Diagnostics */}
              <div className="lg:col-span-7 space-y-5">
                <form id="active-repair-form" onSubmit={handleUpdateRepairSubmit} className="space-y-4">
                  
                  {modalError && (
                    <div className="text-rose-600 bg-rose-50 text-xs p-3 rounded-lg">
                      {modalError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-150">
                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Estatus del Progreso</label>
                      <select
                        value={editEstado}
                        onChange={(e) => setEditEstado(e.target.value as EstadoReparacion)}
                        id="edit-repair-state"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold focus:outline-none"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="diagnostico">En Diagnóstico</option>
                        <option value="reparacion">En Reparación</option>
                        <option value="pruebas">En Control de Calidad</option>
                        <option value="reparado">Reparado (Listo)</option>
                        <option value="entregado">Entregado al Cliente</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Técnico Encargado</label>
                      <input
                        type="text"
                        value={editTecnico}
                        onChange={(e) => setEditTecnico(e.target.value)}
                        placeholder="ej. Daniel Romero"
                        id="edit-repair-tech-name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Informe Diagnóstico Técnico Diagnostical</label>
                    <textarea
                      rows={4}
                      value={editDiagnostico}
                      onChange={(e) => setEditDiagnostico(e.target.value)}
                      placeholder="ej. Se detectó sulfatación y resistencia SMD rota. Se requiere desoxidar..."
                      id="edit-repair-tech-report"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono text-slate-800 leading-relaxed shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Detalle del Trabajo de Ingeniería Realizado</label>
                    <textarea
                      rows={2}
                      value={editTrabajoRealizado}
                      onChange={(e) => setEditTrabajoRealizado(e.target.value)}
                      placeholder="ej. Resoldado de integrado PMIC y cambio de termistor en placa base..."
                      id="edit-repair-work-done"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none font-mono text-slate-800 leading-relaxed shadow-xs"
                    />
                  </div>

                  {/* Financial items: Labor cost and general markdown discounts */}
                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-150">
                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Mano de Obra ($ USD)</label>
                      <input
                        type="number"
                        value={editManoObra}
                        onChange={(e) => setEditManoObra(Number(e.target.value))}
                        min={0}
                        id="edit-repair-mano-obra"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Descuento Ofrecido ($ USD)</label>
                      <input
                        type="number"
                        value={editDescuento}
                        onChange={(e) => setEditDescuento(Number(e.target.value))}
                        min={0}
                        id="edit-repair-discount"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Auth quote accept + signature */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 uppercase block">Autorización de Presupuesto</span>
                        <span className="text-[10px] text-slate-400 block">El cliente acepta la orden de trabajo y los costos finales.</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditPresupuestoAceptado(!editPresupuestoAceptado)}
                        id="btn-toggle-budget-acceptance"
                        className={`text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer transition-all ${
                          editPresupuestoAceptado 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {editPresupuestoAceptado ? '✓ Aprobado por Cliente' : '✖ Pendiente firma'}
                      </button>
                    </div>

                    {editPresupuestoAceptado && (
                      <div className="border-t border-slate-100 pt-3">
                        <InteractiveSignature 
                          onSave={(img64) => setEditFirma(img64)} 
                          initialSignature={editFirma}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-150">
                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Días de Garantía Ofrecidos</label>
                      <input
                        type="number"
                        value={editDiasGarantia}
                        onChange={(e) => setEditDiasGarantia(Number(e.target.value))}
                        min={0}
                        id="edit-repair-warranty-days"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block mb-1">Fecha Promesa</label>
                      <input
                        type="date"
                        value={editFechaPrometida}
                        onChange={(e) => setEditFechaPrometida(e.target.value)}
                        id="edit-repair-promise-field"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-black font-semibold font-mono"
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Right Column: AI tool & Spare parts receipt list */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* AI Assistant Diagnostic widget */}
                {selectedRepair && (
                  (() => {
                    const de = getLinkedDetails(selectedRepair);
                    return (
                      <SmartDiagnostic 
                        initialMarca={de.equipo?.marca}
                        initialModelo={de.equipo?.modelo}
                        initialFalla={selectedRepair.falla_reportada}
                        onApplyDiagnostic={handleApplyAIDiagnosis}
                      />
                    );
                  })()
                )}

                {/* Spares input and list card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Lista de Repuestos de esta Reparación ({editRepuestos.length})</span>
                  
                  {/* Spare adder mini-form */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2.5">
                    <input
                      type="text"
                      value={newSpareNombre}
                      onChange={(e) => setNewSpareNombre(e.target.value)}
                      placeholder="Nombre del componente / repuesto..."
                      id="spare-add-name"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-black"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newSpareCant}
                        onChange={(e) => setNewSpareCant(Number(e.target.value))}
                        placeholder="Cant"
                        min={1}
                        id="spare-add-qty"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-black font-semibold"
                      />
                      <input
                        type="number"
                        value={newSpareCosto}
                        onChange={(e) => setNewSpareCosto(Number(e.target.value))}
                        placeholder="Precio Unitario ($)"
                        min={0}
                        id="spare-add-cost"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-black font-semibold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSpare}
                      id="btn-add-spare-item"
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 rounded-lg text-xxs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Añadir Repuesto a la Ficha
                    </button>
                  </div>

                  {/* List of current spares loaded */}
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                    {editRepuestos.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xxs italic">No se han cargado repuestos.</div>
                    ) : (
                      editRepuestos.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 text-xxs text-slate-700">
                          <div>
                            <span className="font-bold text-slate-800">{item.nombre}</span>
                            <span className="text-slate-400 font-semibold block mt-0.5">Cantidad en orden: {item.cantidad}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-800 font-bold">${(item.cantidad * item.costo).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpare(index)}
                              className="text-slate-350 hover:text-red-500 transition-colors p-1 rounded hover:bg-slate-50 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5 shadow-xs">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-all font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="active-repair-form"
                id="btn-save-edit-repair-record"
                className="px-5 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Confirmar y Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
