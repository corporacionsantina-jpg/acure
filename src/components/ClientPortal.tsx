import React, { useState } from 'react';
import { Search, MapPin, Phone, Mail, FileText, CheckCircle, Clock, Sparkles, Shield, ChevronRight, Layout } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from '../types';
import InteractiveSignature from './InteractiveSignature';

interface ClientPortalProps {
  clientes: Cliente[];
  equipos: Equipo[];
  reparaciones: Reparacion[];
  onRefresh: () => void;
}

export default function ClientPortal({ clientes, equipos, reparaciones, onRefresh }: ClientPortalProps) {
  const [orderQuery, setOrderQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<Reparacion | null>(null);
  const [linkedClient, setLinkedClient] = useState<Cliente | null>(null);
  const [linkedDevice, setLinkedDevice] = useState<Equipo | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Budget acceptance local state
  const [acceptingBudget, setAcceptingBudget] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [budgetSuccess, setBudgetSuccess] = useState(false);

  const handleSearchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setActiveOrder(null);
    setLinkedClient(null);
    setLinkedDevice(null);
    setTimeline([]);
    setBudgetSuccess(false);

    if (!orderQuery.trim()) {
      setErrorMsg('Por favor ingrese un número de orden válido.');
      return;
    }

    const order = reparaciones.find(
      r => r.numero_orden.toLowerCase().trim() === orderQuery.toLowerCase().trim() && r.activo
    );

    if (!order) {
      setErrorMsg('No se encontró ninguna órden de servicio activa con ese número de órden. Verifique su ticket.');
      return;
    }

    const eq = equipos.find(e => e.id === order.equipo_id);
    const cli = eq ? clientes.find(c => c.id === eq.cliente_id) : null;

    setActiveOrder(order);
    setLinkedDevice(eq || null);
    setLinkedClient(cli || null);
    setAcceptingBudget(order.presupuesto_aceptado);
    setSignatureData(order.firma_cliente || '');

    // Fetch timeline
    try {
      const res = await fetch(`/api/reparaciones/${order.id}/historial`);
      if (res.ok) {
        const hist = await res.json();
        setTimeline(hist);
      }
    } catch (err) {
      console.error('TIMELINE_FETCH_ERR:', err);
    }
  };

  const handleAcceptBudgetSubmit = async () => {
    if (!activeOrder) return;

    try {
      const res = await fetch(`/api/reparaciones/${activeOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presupuesto_aceptado: true,
          firma_cliente: signatureData,
          estado: 'diagnostico' // Move past pending onto active diagnostics upon client authorization
        })
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'No se pudo registrar la firma.');

      // Automatically post approval marker milestone
      await fetch(`/api/reparaciones/${activeOrder.id}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: 'Portal del Cliente (Web)',
          tipo: 'aprobacion',
          comentario: `Presupuesto aprobado digitalmente por el propietario por un monto final de $${activeOrder.monto_final.toFixed(2)}.`
        })
      });

      setActiveOrder(updated);
      setBudgetSuccess(true);
      onRefresh();
      // Rekindle search
      handleSearchOrder();
    } catch (err: any) {
      alert(err.message || 'Error en los servidores de firma digital.');
    }
  };

  const getStepActiveIndex = (estado: string) => {
    const list = ['pendiente', 'diagnostico', 'reparacion', 'pruebas', 'reparado', 'entregado'];
    return list.indexOf(estado);
  };

  const currentStepIndex = activeOrder ? getStepActiveIndex(activeOrder.estado) : -1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="client-portal-wrapper">
      
      {/* Banner / Title */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden" id="portal-hero">
        <div className="absolute right-[-40px] bottom-[-40px] opacity-10 blur-xl w-60 h-60 rounded-full bg-indigo-500"></div>
        
        <div className="max-w-xl space-y-3">
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-400/20">
            Módulo de Auto-Consulta de Clientes
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white leading-tight">Consulta de Ordenes y Aprobación de Presupuestos</h2>
          <p className="text-xs text-slate-400">Consulte el estado actual de su equipo, el informe de diagnóstico de nuestro laboratorio, revise evidencias fotográficas y firme digitalmente la autorización de su reparación en segundos.</p>
        </div>

        {/* Query bar inputs */}
        <form onSubmit={handleSearchOrder} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="text"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            placeholder="Ingrese Número de Orden (ej. REP-2026-0001)..."
            id="query-portal-order"
            className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            id="btn-portal-query"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Buscar Orden
          </button>
        </form>

        {errorMsg && (
          <div className="text-rose-400 text-xs mt-3 font-semibold">
            ✖ {errorMsg}
          </div>
        )}
      </div>

      {activeOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="portal-results-container">
          
          {/* Timeline and specifications progress */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Multi-step progress visual blocks */}
            <div className="bg-white p-6 border border-slate-200 rounded-2xl" id="progress-meter-block">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest mb-6">Estado de la Reparación</h3>
              
              <div className="grid grid-cols-6 gap-2 text-center text-slate-400 font-semibold relative">
                
                {([
                  { key: 'pendiente', lbl: 'Recibido' },
                  { key: 'diagnostico', lbl: 'Diagnóstico' },
                  { key: 'reparacion', lbl: 'Reparación' },
                  { key: 'pruebas', lbl: 'Pruebas' },
                  { key: 'reparado', lbl: 'Reparado' },
                  { key: 'entregado', lbl: 'Retirado' }
                ]).map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' :
                        isActive ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                        'bg-slate-50 border-slate-200'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`text-[9px] mt-2 font-medium tracking-tight ${isActive ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                        {step.lbl}
                      </span>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Technical analysis details */}
            <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Informe Técnico del Laboratorio</h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Falla que usted reportó:</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-slate-700 font-medium mt-1">"{activeOrder.falla_reportada}"</p>
                </div>

                {activeOrder.diagnostico_tecnico ? (
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase block">Diagnóstico del Ingeniero Técnico:</span>
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-line text-slate-800 mt-1">
                      {activeOrder.diagnostico_tecnico}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-indigo-50/20 text-indigo-700 border border-indigo-100 text-xs">
                    Estamos diagnosticando su equipo con minuciosidad. Tan pronto redactemos la ficha técnica de hardware se reflejará en este portal.
                  </div>
                )}
              </div>
            </div>

            {/* Public user-facing chronological journal progress */}
            <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Evolución de Eventos en Taller</h3>
              
              <div className="relative border-l-2 border-slate-150 pl-4 space-y-4 ml-1">
                {timeline.map(t => (
                  <div key={t.id} className="relative text-xs">
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white -left-[21.5px] mt-0.5"></div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-semibold">
                      <span>{t.tipo.toUpperCase()} · {t.usuario}</span>
                      <span>{new Date(t.fecha).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">{t.comentario}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Totals details, quote approvals and interactive signatures */}
          <div className="space-y-6">
            
            {/* Device specs block */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl text-xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Su Dispositivo</span>
              <div>
                <span className="font-bold text-slate-800 text-xs block">{linkedDevice?.marca} {linkedDevice?.modelo}</span>
                <span className="text-slate-400 font-mono text-xxs block mt-0.5">S/N: {linkedDevice?.serial}</span>
              </div>
              <div className="flex justify-between items-center text-xxs pt-2 border-t border-slate-50 text-slate-500">
                <span>Tipo: {linkedDevice?.tipo_equipo.toUpperCase()}</span>
                <span>Ingreso: {linkedDevice ? new Date(linkedDevice.fecha_ingreso).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            {/* Itemized invoice calculator block */}
            <div className="bg-white p-5 border border-slate-200 rounded-2xl text-xs space-y-4 shadow-sm" id="client-invoice-totals">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Costos Estimados en Orden</span>
              
              <div className="space-y-2 border-b border-slate-100 pb-3" id="spares-breakdown">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Mano de Obra Autorizada:</span>
                  <span className="font-mono font-bold">${activeOrder.costo_mano_obra.toFixed(2)}</span>
                </div>
                {activeOrder.repuestos_utilizados.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xxs text-slate-600 font-mono">
                    <span>- {item.nombre} (x{item.cantidad}):</span>
                    <span>${(item.cantidad * item.costo).toFixed(2)}</span>
                  </div>
                ))}
                {activeOrder.descuento > 0 && (
                  <div className="flex justify-between text-xxs text-slate-500">
                    <span>Descuento Especial:</span>
                    <span>-${activeOrder.descuento.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-800 text-xxs uppercase">Importe Total Neto:</span>
                <span className="text-emerald-700 font-mono font-extrabold text-sm">${activeOrder.monto_final.toFixed(2)}</span>
              </div>
            </div>

            {/* Quote budget authorization pad block */}
            <div className="bg-white p-5 border border-slate-250 rounded-2xl space-y-4 shadow-md" id="client-authorization-control">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest">Aprobación de Presupuesto</h3>
              
              {activeOrder.presupuesto_aceptado ? (
                <div className="bg-emerald-50 text-emerald-800 border-emerald-100 rounded-xl p-4 text-xs font-bold space-y-2 text-center border">
                  <span>✓ Su presupuesto ya ha sido ACEPTADO y firmado digitalmente.</span>
                  {activeOrder.firma_cliente && (
                    <img 
                      src={activeOrder.firma_cliente} 
                      alt="Su firma digital" 
                      className="h-12 bg-white rounded p-1 mx-auto block object-contain border border-emerald-250 mt-1" 
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    Al firmar este recuadro, usted autoriza formalmente a nuestro laboratorio a solicitar los repuestos, destapar e intervenir su placa principal con micro-soldaduras, bajo los costos expresados arriba.
                  </div>

                  <InteractiveSignature 
                    onSave={(base64) => setSignatureData(base64)} 
                    initialSignature={signatureData}
                  />

                  <button
                    type="button"
                    disabled={!signatureData}
                    onClick={handleAcceptBudgetSubmit}
                    id="btn-confirm-accept-budget"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Confirmar Autorización de Presupuesto
                  </button>

                  <div className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors border border-amber-500/10 rounded-xl p-3 text-[10px] leading-relaxed text-amber-700 flex items-start gap-1">
                    <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span><strong className="font-extrabold uppercase text-[9px] block mb-0.5">Políticas de Abandono (30 dias)</strong> El equipo deviene propiedad administrativa tras treinta (30) días de estar reparado si el cliente no lo retira del inventario físico.</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
