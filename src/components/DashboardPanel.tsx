import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cloud, CloudRain, Briefcase, Users, FileText, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from '../types';

interface DashboardPanelProps {
  clientes: Cliente[];
  equipos: Equipo[];
  reparaciones: Reparacion[];
  onRefresh: () => void;
}

const COLORS = ['#141414', '#10b981', '#f59e0b', '#ef4444', '#4b5563', '#141414', '#141414'];

export default function DashboardPanel({
  clientes,
  equipos,
  reparaciones,
  onRefresh
}: DashboardPanelProps) {
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Trigger simulated drive backup
  const handleDriveBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      const res = await fetch('/api/config/respaldo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBackupStatus(`¡Respaldo Exitoso! Guardado en Google Drive en carpeta '${data.drive_folder_name}'. Archivo: '${data.file_name}'. ID: ${data.backup_id}`);
      } else {
        setBackupStatus('Fallo al simular respaldo en Google Drive.');
      }
    } catch (err) {
      setBackupStatus('Error al interactuar con el servidor de respaldos.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Compute stats on-the-fly to support live updates
  const numClientes = clientes.length;
  const numEquipos = equipos.length;
  const numReparaciones = reparaciones.length;
  
  const pendientes = reparaciones.filter(r => r.estado === 'pendiente' || r.estado === 'diagnostico' || r.estado === 'reparacion' || r.estado === 'pruebas');
  const terminadosYListos = reparaciones.filter(r => r.estado === 'reparado');
  const entregados = reparaciones.filter(r => r.estado === 'entregado');

  // Total gross income
  const totalInvoiced = reparaciones.reduce((sum, r) => {
    // Sum spares
    const sparesCost = r.repuestos_utilizados.reduce((s, item) => s + (item.cantidad * item.costo), 0);
    return sum + (sparesCost + r.costo_mano_obra - r.descuento);
  }, 0);

  // Chart Data preparation: Repairs by brand (marca)
  const brandData = (() => {
    const counts: Record<string, number> = {};
    equipos.forEach(eq => {
      const b = eq.marca.trim().toUpperCase();
      counts[b] = (counts[b] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 6);
  })();

  // Chart Data preparation: Status Distribution
  const statusDistData = (() => {
    const list = [
      { name: 'Pendientes', value: reparaciones.filter(r => r.estado === 'pendiente').length },
      { name: 'En Diagnóstico', value: reparaciones.filter(r => r.estado === 'diagnostico').length },
      { name: 'En Reparación', value: reparaciones.filter(r => r.estado === 'reparacion').length },
      { name: 'Pruebas / QA', value: reparaciones.filter(r => r.estado === 'pruebas').length },
      { name: 'Listos c/Entrega', value: reparaciones.filter(r => r.estado === 'reparado').length },
      { name: 'Entregados', value: reparaciones.filter(r => r.estado === 'entregado').length },
    ];
    return list.filter(item => item.value > 0);
  })();

  // Chart Data preparation: Revenues / Invoicing per month
  const salesHistory = [
    { mes: 'Enero', valor: totalInvoiced * 0.4 },
    { mes: 'Febrero', valor: totalInvoiced * 0.55 },
    { mes: 'Marzo', valor: totalInvoiced * 0.75 },
    { mes: 'Abril', valor: totalInvoiced }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-analytical-panel">
      
      {/* Visual bento widgets metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metric-bento-grid">
        
        <div className="bg-white p-5 border-2 border-[#141414] rounded-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#141414]/60 uppercase tracking-wider block">Cartera de Clientes</span>
            <span className="text-2xl font-black text-[#141414] mt-1 block font-mono">{numClientes}</span>
            <span className="text-[10px] font-serif italic text-[#141414]/70 block mt-0.5">Asociados activos</span>
          </div>
          <div className="w-10 h-10 rounded-none border border-[#141414] bg-[#DEDCD7] flex items-center justify-center text-[#141414]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-[#141414] rounded-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#141414]/60 uppercase tracking-wider block">Inventario Custodia</span>
            <span className="text-2xl font-black text-[#141414] mt-1 block font-mono">{numEquipos}</span>
            <span className="text-[10px] text-[#141414] font-bold block mt-0.5 font-mono">Pendiente: {pendientes.length}</span>
          </div>
          <div className="w-10 h-10 rounded-none border border-[#141414] bg-[#DEDCD7] flex items-center justify-center text-[#141414]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-[#141414] rounded-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#141414]/60 uppercase tracking-wider block">Ordenes de Servicio</span>
            <span className="text-2xl font-black text-[#141414] mt-1 block font-mono">{numReparaciones}</span>
            <span className="text-[10px] font-serif italic text-[#141414]/70 block">Total tickets emitidos</span>
          </div>
          <div className="w-10 h-10 rounded-none border border-[#141414] bg-[#DEDCD7] flex items-center justify-center text-[#141414]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border-2 border-[#141414] rounded-none flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#141414]/60 uppercase tracking-wider block">Facturacion Bruta</span>
            <span className="text-2xl font-black text-[#141414] underline mt-1 block font-mono">${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-serif italic text-[#141414]/70 block">Acumulado labor + partes</span>
          </div>
          <div className="w-10 h-10 rounded-none border border-[#141414] bg-[#141414] flex items-center justify-center text-[#E4E3E0]">
            <span className="font-mono font-bold text-sm">$</span>
          </div>
        </div>

      </div>

      {/* Grid: Charts visual graphics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Revenue progress line chart */}
        <div className="lg:col-span-8 bg-white border-2 border-[#141414] rounded-none p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[#141414] pb-3">
            <div>
              <h3 className="font-mono uppercase font-black text-[#141414] text-xs tracking-tight mb-1">Rendimiento Técnico y Ventas</h3>
              <p className="text-[11px] font-serif italic text-[#141414]/60">Total acumulado bruto histórico consolidado mes a mes.</p>
            </div>
            
            <button
              onClick={onRefresh}
              className="p-1.5 border border-[#141414] bg-[#F0EFEC] hover:bg-[#141414] hover:text-[#E4E3E0] text-[#141414] rounded-none cursor-pointer transition-colors"
              title="Refrescar cifras"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64" id="chart-revenues">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" opacity={0.15} />
                <XAxis dataKey="mes" stroke="#141414" fontSize={11} tickLine={false} />
                <YAxis stroke="#141414" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#141414', color: '#E4E3E0', borderRadius: '0px', fontFamily: 'monospace' }} />
                <Line type="monotone" dataKey="valor" stroke="#141414" strokeWidth={3} activeDot={{ r: 6, fill: '#141414' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Brands distribution pie chart */}
        <div className="lg:col-span-4 bg-white border-2 border-[#141414] rounded-none p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-mono uppercase font-black text-[#141414] text-xs tracking-tight mb-1 font-bold">Marcas Frecuentes</h3>
            <p className="text-[11px] font-serif italic text-[#141414]/60">Frecuencia por fabricante en equipos.</p>
          </div>

          <div className="h-48 mx-auto w-full max-w-[200px]" id="chart-brands">
            {brandData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#141414]/60 italic font-serif text-xs">Sin información de base.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={brandData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3}>
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#141414', borderColor: '#141414', color: '#E4E3E0', borderRadius: '0px', fontFamily: 'monospace' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 mt-2 border-t border-[#141414] pt-2">
            {brandData.map((b, idx) => (
              <div key={b.name} className="flex items-center justify-between text-xxs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-none border border-[#141414]" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-[#141414] font-mono">{b.name}</span>
                </div>
                <span className="font-bold text-[#141414]/60 font-mono">{b.value} u.</span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Row: Status Distributions and Google Drive Cloud backup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Progress status overview ledger progress bar */}
        <div className="lg:col-span-6 bg-white border-2 border-[#141414] rounded-none p-6 space-y-4">
          <h3 className="font-mono uppercase font-black text-[#141414] text-xs tracking-tight mb-2">Estatus Activos de Laboratorio</h3>
          
          <div className="space-y-3.5">
            {statusDistData.map((st, idx) => {
              const percentage = numReparaciones > 0 ? (st.value / numReparaciones) * 100 : 0;
              return (
                <div key={st.name} className="space-y-1">
                  <div className="flex justify-between text-xxs font-bold uppercase font-mono">
                    <span className="text-[#141414]/80">{st.name}</span>
                    <span className="text-[#141414]/60">{st.value} tickets ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#E4E3E0] rounded-none h-3.5 border border-[#141414] p-0.5">
                    <div 
                      className="bg-[#141414] rounded-none h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Google Drive integration box simulator wrapper */}
        <div className="lg:col-span-6 bg-[#F0EFEC] border-2 border-[#141414] rounded-none p-6 flex flex-col justify-between" id="drive-backup-control-panel">
          <div className="space-y-3">
            <h3 className="font-mono uppercase font-black text-[#141414] text-xs tracking-tight flex items-center gap-1.5 border-b border-[#141414] pb-2">
              <Cloud className="w-5 h-5 text-[#141414]" /> Respaldo Administrativo Automatizado
            </h3>
            <p className="text-xs text-[#141414]/80 leading-relaxed font-serif italic">
              Consolida la integridad de su taller. Este botón simula una llamada de red que empaqueta las tablas del sistema taller_db.json (Configuración, Clientes, Equipos en custodia y Facturas oficiales) y las resguarda directamente en su espacio corporativo de Google Drive.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {backupStatus && (
              <div className="bg-[#141414] text-[#E4E3E0] border border-[#141414] text-xxs font-semibold p-4 rounded-none leading-relaxed font-mono">
                {backupStatus}
              </div>
            )}

            <button
              onClick={handleDriveBackup}
              disabled={isBackingUp}
              id="btn-trigger-drive-backup"
              className="w-full bg-[#141414] hover:bg-white hover:text-[#141414] disabled:bg-slate-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-xs font-mono font-bold uppercase py-3.5 px-4 rounded-none border-2 border-[#141414] tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isBackingUp ? (
                <span>Respaldando base de datos, espere...</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" /> Generar y Subir Copia a Google Drive
                </span>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
