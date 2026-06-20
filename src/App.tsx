import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Smartphone, PenTool, ShieldCheck, Search, Database, Printer, Bell, Cloud, HelpCircle, Laptop } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from './types';
import DashboardPanel from './components/DashboardPanel';
import ClientManagement from './components/ClientManagement';
import DeviceManagement from './components/DeviceManagement';
import RepairManagement from './components/RepairManagement';
import WarrantyManagement from './components/WarrantyManagement';
import ClientPortal from './components/ClientPortal';
import TicketPrinter from './components/TicketPrinter';

type TabType = 'dashboard' | 'clientes' | 'dispositivos' | 'reparaciones' | 'garantias' | 'portal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Unified global storage pulled from full-stack taller_db.json
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cross-tab workflows state bridges
  const [bridgeClient, setBridgeClient] = useState<Cliente | null>(null);

  // Esc/Pos Ticket printing popup state
  const [printingTicket, setPrintingTicket] = useState<{
    cliente: Cliente;
    equipo: Equipo;
    reparacion: Reparacion;
  } | null>(null);

  // Synchronize state with backend
  const refreshDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resClients, resDevices, resRepairs] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/equipos'),
        fetch('/api/reparaciones')
      ]);

      if (!resClients.ok || !resDevices.ok || !resRepairs.ok) {
        throw new Error('Fallo crítico al sincronizar con la base de datos del taller.');
      }

      const [cData, dData, rData] = await Promise.all([
        resClients.json(),
        resDevices.json(),
        resRepairs.json()
      ]);

      setClientes(cData);
      setEquipos(dData);
      setReparaciones(rData);
    } catch (err: any) {
      setError(err.message || 'Error desconocido de conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDatabase();
  }, []);

  // Bridge action: Start registration for a specific client
  const handleSelectClientForDeviceBridge = (client: Cliente) => {
    setBridgeClient(client);
    setActiveTab('dispositivos');
  };

  // Bridge action: Device successfully registered, redirect to repair
  const handleDeviceRegisteredBridge = (device: Equipo) => {
    setActiveTab('reparaciones');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col font-sans text-[#141414] border-[12px] border-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0]" id="workshop-app-layout">
      
      {/* Upper Navigation Header Bar */}
      <header className="bg-white border-b-2 border-[#141414] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none border-2 border-[#141414] bg-[#141414] flex items-center justify-center text-[#E4E3E0] font-mono font-black text-xs hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors">
              TP
            </div>
            <div>
              <h1 className="font-mono font-black text-[#141414] text-sm tracking-tight leading-tight flex items-center gap-1.5 uppercase">
                Taller_Pro <span className="bg-[#141414] text-[#E4E3E0] text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs">SISTEMA v1.42</span>
              </h1>
              <p className="text-[10.5px] text-[#141414]/70 font-serif italic leading-none mt-1">Gestión Unificada, Diagnóstico Inteligente y Certificación de Garantías</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#F0EFEC] text-[#141414] font-mono text-[10px] px-2.5 py-1.5 border border-[#141414] uppercase font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
              Servidor Activo (Puerto 3000)
            </div>

            <button
              onClick={refreshDatabase}
              disabled={loading}
              id="btn-refresh-unified-data"
              className="p-2 bg-white hover:bg-[#141414] hover:text-[#E4E3E0] rounded-none text-[#141414] transition-colors border-2 border-[#141414] disabled:opacity-50 cursor-pointer"
              title="Sincronizar base de datos"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H17" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Body Section */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar Panel (Responsive) */}
        <aside className="md:w-64 flex-shrink-0">
          <nav className="bg-[#DEDCD7] border border-[#141414] p-4 rounded-none md:sticky md:top-24 space-y-2" id="sidebar-app-nav">
            
            <div className="text-[10px] font-mono font-bold text-[#141414] opacity-50 uppercase tracking-widest px-3 block mb-2">Módulos Administrativos</div>

            <button
              onClick={() => { setActiveTab('dashboard'); }}
              id="sidebar-nav-dashboard"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'dashboard'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Analítico
            </button>

            <button
              onClick={() => { setActiveTab('clientes'); }}
              id="sidebar-nav-clients"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'clientes'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <Users className="w-4 h-4" /> Control Clientes
            </button>

            <button
              onClick={() => { setActiveTab('dispositivos'); }}
              id="sidebar-nav-devices"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'dispositivos'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Custodia Equipos
            </button>

            <button
              onClick={() => { setActiveTab('reparaciones'); }}
              id="sidebar-nav-repairs"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'reparaciones'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <PenTool className="w-4 h-4" /> Órdenes y Taller
            </button>

            <div className="text-[10px] font-mono font-bold text-[#141414] opacity-50 uppercase tracking-widest px-3 block pt-4 mb-2">Garantías e Historial</div>

            <button
              onClick={() => { setActiveTab('garantias'); }}
              id="sidebar-nav-warranties"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'garantias'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Garantía y Abandonos
            </button>

            <div className="text-[10px] font-mono font-bold text-[#141414] opacity-50 uppercase tracking-widest px-3 block pt-4 mb-2">Portal de Clientes</div>

            <button
              onClick={() => { setActiveTab('portal'); }}
              id="sidebar-nav-client-portal"
              className={`w-full text-left py-2 px-3 rounded-none text-xs font-mono font-bold uppercase transition-all flex items-center gap-3 cursor-pointer border ${
                activeTab === 'portal'
                  ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] font-black'
                  : 'text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] border-transparent'
              }`}
            >
              <Search className="w-4 h-4 text-emerald-600" /> Consultas de Ordenes
            </button>


          </nav>
        </aside>

        {/* Dynamic view content staging site */}
        <main className="flex-1 min-w-0" id="applet-main-staging-canvas">
          
          {error && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-100 text-xs font-bold mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <span className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin inline-block"></span>
              <span>Sincronizando información de base de datos en tiempo real...</span>
            </div>
          )}

          {/* Render Active View Panels */}
          {!loading && (
            <div className="transition-opacity duration-250 opacity-100 h-full">
              {activeTab === 'dashboard' && (
                <DashboardPanel 
                  clientes={clientes} 
                  equipos={equipos} 
                  reparaciones={reparaciones} 
                  onRefresh={refreshDatabase} 
                />
              )}

              {activeTab === 'clientes' && (
                <ClientManagement 
                  clientes={clientes} 
                  equipos={equipos} 
                  reparaciones={reparaciones} 
                  onRefresh={refreshDatabase}
                  onSelectClientForDevice={handleSelectClientForDeviceBridge}
                />
              )}

              {activeTab === 'dispositivos' && (
                <DeviceManagement 
                  clientes={clientes} 
                  equipos={equipos} 
                  onRefresh={refreshDatabase}
                  selectedClientFromParent={bridgeClient}
                  onSelectClientFromParentReset={() => setBridgeClient(null)}
                  onDeviceRegistered={handleDeviceRegisteredBridge}
                />
              )}

              {activeTab === 'reparaciones' && (
                <RepairManagement 
                  clientes={clientes} 
                  equipos={equipos} 
                  reparaciones={reparaciones} 
                  onRefresh={refreshDatabase}
                  onPrintTicket={(data) => setPrintingTicket(data)}
                />
              )}

              {activeTab === 'garantias' && (
                <WarrantyManagement 
                  clientes={clientes} 
                  equipos={equipos} 
                  reparaciones={reparaciones} 
                />
              )}

              {activeTab === 'portal' && (
                <ClientPortal 
                  clientes={clientes} 
                  equipos={equipos} 
                  reparaciones={reparaciones} 
                  onRefresh={refreshDatabase}
                />
              )}
            </div>
          )}

        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10.5px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <span>Sistema Taller de Electrónica &copy; {new Date().getFullYear()} - Todos los derechos reservados.</span>
        </div>
      </footer>

      {/* GLOBAL MODAL POPUP FOR ESC/POS THERMAL TICKET PRINTING */}
      {printingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="printing-ticket-popup-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden my-8 p-6 relative">
            <button
              onClick={() => setPrintingTicket(null)}
              id="btn-close-print-modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <TicketPrinter 
              cliente={printingTicket.cliente}
              equipo={printingTicket.equipo}
              reparacion={printingTicket.reparacion}
              onClose={() => setPrintingTicket(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
