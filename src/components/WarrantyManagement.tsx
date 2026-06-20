import { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, Award, FileText, Printer, CheckCircle, HelpCircle } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from '../types';

interface WarrantyManagementProps {
  clientes: Cliente[];
  equipos: Equipo[];
  reparaciones: Reparacion[];
}

export default function WarrantyManagement({ clientes, equipos, reparaciones }: WarrantyManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'vivas' | 'vencidas' | 'abandono'>('todos');

  // Fetch client & equipment helpers identical to RepairManagement
  const getLinkedDetails = (repair: Reparacion) => {
    const eq = equipos.find(e => e.id === repair.equipo_id);
    const cli = eq ? clientes.find(c => c.id === eq.cliente_id) : null;
    return { equipo: eq, cliente: cli };
  };

  // Filter repair orders that qualify under warranty tracking OR are at risk of abandonment
  const activeWarranties = reparaciones.map(repair => {
    const details = getLinkedDetails(repair);
    
    // Check if warranty is active based on fecha_fin_garantia
    const now = new Date();
    let isWarrantyActive = false;
    let daysRemaining = 0;
    
    if (repair.estado === 'entregado' && repair.fecha_fin_garantia) {
      const expirationDate = new Date(repair.fecha_fin_garantia);
      isWarrantyActive = expirationDate.getTime() > now.getTime();
      daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Check if equipment has been abandoned (30 days in ready/reparado state without retrieved, or specifically market in a scrap timeline)
    let isAbandoned = repair.estado_abandono === 'abandonado' || repair.estado_abandono === 'chatarra';
    let daysSinceReady = 0;
    
    if (repair.estado === 'reparado' && repair.fecha_ingreso) {
      // If ready for more than 30 days and not delivered
      const readyDate = new Date(repair.fecha_ingreso); // Assumes approximate or uses mock date
      const diffDays = Math.ceil((now.getTime() - readyDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        isAbandoned = true;
        daysSinceReady = diffDays;
      }
    }

    return {
      repair,
      cliente: details.cliente,
      equipo: details.equipo,
      isWarrantyActive,
      daysRemaining,
      isAbandoned,
      daysSinceReady
    };
  }).filter(item => {
    // Search query matches
    const nameMatch = item.cliente?.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const orderMatch = item.repair.numero_orden.toLowerCase().includes(searchQuery.toLowerCase());
    const serialMatch = item.equipo?.serial.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const modelMatch = item.equipo?.modelo.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    const queryMatches = nameMatch || orderMatch || serialMatch || modelMatch;

    if (!queryMatches) return false;

    if (filterType === 'vivas') return item.isWarrantyActive;
    if (filterType === 'vencidas') return item.repair.estado === 'entregado' && !item.isWarrantyActive;
    if (filterType === 'abandono') return item.isAbandoned;

    return true; // "todos" returns any
  });

  const handlePrintCertificate = (item: any) => {
    const certWindow = window.open('', '_blank', 'width=800,height=600');
    if (!certWindow) {
      alert('Habilite ventanas emergentes para imprimir certificados de garantía.');
      return;
    }

    const start = item.repair.fecha_inicio_garantia ? new Date(item.repair.fecha_inicio_garantia).toLocaleDateString() : 'N/A';
    const end = item.repair.fecha_fin_garantia ? new Date(item.repair.fecha_fin_garantia).toLocaleDateString() : 'N/A';
    const clientSignature = item.repair.firma_cliente || 'Sin Firma';

    certWindow.document.write(`
      <html>
        <head>
          <title>Certificado de Garantía - ${item.repair.numero_orden}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .canvas-cert { border: 4px double #1e3a8a; padding: 40px; border-radius: 12px; }
            .heading { text-align: center; color: #1e3a8a; margin-bottom: 30px; }
            .title { font-size: 26px; font-weight: bold; letter-spacing: 1px; uppercase; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
            .grid-data { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin: 30px 0; font-size: 13px; }
            .data-block { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-weight: bold; color: #475569; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 14px; font-weight: 500; color: #1e293b; }
            .policies { font-size: 11px; text-align: justify; margin: 30px 0; background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; color: #b45309; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; }
            .signature-line { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 8px; }
            .signature-img { height: 45px; object-contain: contain; margin-bottom: 2px; }
            @media print {
              body { padding: 10px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="canvas-cert">
            <div class="heading">
              <span class="title">CERTIFICADO DE GARANTÍA TÉCNICA</span>
              <div class="subtitle">Orden de Trabajo Registrada: ${item.repair.numero_orden}</div>
            </div>

            <div class="grid-data">
              <div class="data-block">
                <div class="label">Propietario / Cliente</div>
                <div class="value">${item.cliente?.nombre_completo}</div>
                <div class="value" style="font-size: 12px; color: #64748b;">Cédula: ${item.cliente?.cedula || 'N/A'}</div>
              </div>

              <div class="data-block">
                <div class="label">Dispositivo Electrónico</div>
                <div class="value">${item.equipo?.marca} ${item.equipo?.modelo}</div>
                <div class="value" style="font-size: 11px; font-family: monospace; color: #64748b;">Serial: ${item.equipo?.serial}</div>
              </div>

              <div class="data-block">
                <div class="label">Trabajo e Ingeniería Efectuados</div>
                <div class="value" style="font-size: 12px;">${item.repair.trabajo_realizado || 'Mantenimiento preventivo general y chequeo de bus secundario de tensión.'}</div>
              </div>

              <div class="data-block">
                <div class="label">Vigencia Cobertura de Garantía</div>
                <div class="value">Plazo: ${item.repair.dias_garantia} días continuos</div>
                <div class="value" style="font-size: 12px; color: #16a34a; font-weight: bold;">Desde: ${start} hasta: ${end}</div>
              </div>
            </div>

            <div class="policies">
              <strong>TÉRMINOS Y EXCLUSIONES DEL CONTRATO:</strong>
              <p style="margin: 6px 0 0 0; line-height: 1.4;">
                1. Esta garantía técnica es única y exclusiva por el trabajo o refacción explícitamente detallados en este certificado.<br/>
                2. La garantía quedará inmediatamente ANULADA si el equipo es manipulado, destapado o intervenido por personal de terceros, si presenta sellos de seguridad vulnerados, golpes físicos evidentes, rastros orgánicos o químicos de humedad/líquidos, o fallas secundarias por sobretensiones de la red eléctrica general.<br/>
                3. Es requisito obligatorio presentar este certificado impreso o digital para canalizar reclamos.
              </p>
            </div>

            <div class="signatures">
              <div class="signature-line">
                <div style="height: 45px; display: flex; align-items: center; justify-content: center; font-style: italic; color: #94a3b8; font-size: 10px;">SELLO CENTRAL DE LABORATORIOS</div>
                Responsable del Taller
              </div>
              <div class="signature-line">
                <div style="height: 45px; display: flex; align-items: center; justify-content: center;">
                  ${clientSignature.startsWith('data:') 
                    ? `<img class="signature-img" src="${clientSignature}" />` 
                    : `<span style="font-size: 10px; color: #64748b; font-style: italic; font-family: sans-serif;">Aceptación con Firma Digital</span>`
                  }
                </div>
                Aceptación del Cliente
              </div>
            </div>

          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    certWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="warranty-management-ledger">
      
      {/* Header bar statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="warranty-stats-row">
        
        <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Garantías Activas</span>
            <span className="text-md font-extrabold text-slate-850">
              {reparaciones.filter(r => r.estado === 'entregado' && new Date(r.fecha_fin_garantia || '').getTime() > Date.now()).length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Garantías Caducadas</span>
            <span className="text-md font-extrabold text-slate-850">
              {reparaciones.filter(r => r.estado === 'entregado' && new Date(r.fecha_fin_garantia || '').getTime() <= Date.now()).length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
          </div>
          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Bajo Riesgo Abandono</span>
            <span className="text-md font-extrabold text-rose-600">
              {reparaciones.filter(r => r.estado === 'reparado' && Math.ceil((Date.now() - new Date(r.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)) > 30).length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider block">Total Entregados</span>
            <span className="text-md font-extrabold text-slate-850">
              {reparaciones.filter(r => r.estado === 'entregado').length}
            </span>
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        
        {/* Searches and filters strip bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-slate-100 pb-5">
          
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por orden, cliente, modelo, serial..."
              id="search-warranty-ledger"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-1.5" id="warranty-ledger-filter-strip">
            {([
              { val: 'todos', lbl: 'Todo Historial' },
              { val: 'vivas', lbl: 'Garantía Vigente' },
              { val: 'vencidas', lbl: 'Garantía Expirada' },
              { val: 'abandono', lbl: 'Alertas Abandono' }
            ] as const).map(f => (
              <button
                key={f.val}
                onClick={() => setFilterType(f.val)}
                className={`py-1.5 px-3 text-xxs font-bold rounded-lg cursor-pointer transition-all border ${
                  filterType === f.val 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ledger registry representation table */}
        <div className="overflow-x-auto" id="warranty-table-scroller">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-150">
            <thead className="bg-slate-50 font-bold uppercase text-slate-440 text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nº Orden</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Plazo de Garantía</th>
                <th className="px-4 py-3">Condición Legal</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {activeWarranties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 italic">No hay registros bajo este filtro.</td>
                </tr>
              ) : (
                activeWarranties.map(item => (
                  <tr key={item.repair.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-slate-900">{item.repair.numero_orden}</td>
                    <td className="px-4 py-3.5">{item.cliente?.nombre_completo || 'N/A'}</td>
                    <td className="px-4 py-3.5 shrink-0 max-w-[150px] truncate">
                      {item.equipo?.marca} {item.equipo?.modelo}
                      <span className="text-[10px] text-slate-400 block font-mono">S/N: {item.equipo?.serial}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize">{item.repair.estado}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {item.repair.estado === 'entregado' ? (
                        <div>
                          <span>{item.repair.dias_garantia} días</span>
                          <span className={`text-[10px] font-bold block ${item.isWarrantyActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {item.isWarrantyActive ? `✓ Vigente (Faltan ${item.daysRemaining} d)` : '✖ Certificado Caducado'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal text-xxs">Activa al entregar</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.isAbandoned ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          Abandono (Plazo de 30d Vencido)
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[10px] font-bold">✓ Custodia Segura</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {item.repair.estado === 'entregado' ? (
                        <button
                          onClick={() => handlePrintCertificate(item)}
                          id={`btn-print-cert-${item.repair.id}`}
                          className="bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-xxs font-extrabold rounded-lg flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF Garantía
                        </button>
                      ) : item.isAbandoned ? (
                        <span className="text-red-650 text-xxs font-bold italic block">Disponer Desguace</span>
                      ) : (
                        <span className="text-slate-400 italic text-xxs">Listo al entregar</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
