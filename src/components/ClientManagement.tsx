import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, MapPin, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from '../types';

interface ClientManagementProps {
  clientes: Cliente[];
  equipos: Equipo[];
  reparaciones: Reparacion[];
  onRefresh: () => void;
  onSelectClientForDevice?: (client: Cliente) => void;
}

export default function ClientManagement({
  clientes,
  equipos,
  reparaciones,
  onRefresh,
  onSelectClientForDevice
}: ClientManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  
  // Modals / Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  // Handle open creation modal
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setNombreCompleto('');
    setCedula('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setNotas('');
    setFormError(null);
    setShowFormModal(true);
  };

  // Handle open edit modal
  const openEditModal = (client: Cliente, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting client background trigger
    setIsEditing(true);
    setEditingId(client.id);
    setNombreCompleto(client.nombre_completo);
    setCedula(client.cedula);
    setTelefono(client.telefono);
    setEmail(client.email);
    setDireccion(client.direccion);
    setNotas(client.notas || '');
    setFormError(null);
    setShowFormModal(true);
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombreCompleto.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    const payload = {
      nombre_completo: nombreCompleto,
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      notas: notas.trim()
    };

    try {
      const url = isEditing ? `/api/clientes/${editingId}` : '/api/clientes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al guardar el cliente.');
      }

      setShowFormModal(false);
      onRefresh();
      
      // If editing currently selected client, update locally
      if (isEditing && selectedClient?.id === editingId) {
        setSelectedClient({ ...selectedClient, ...payload });
      }
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Soft delete client
  const handleDeleteClient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Está seguro de que desea eliminar este cliente? Se mantendrá el registro histórico pero no se listará como activo.')) {
      return;
    }

    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedClient?.id === id) {
          setSelectedClient(null);
        }
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo eliminar el cliente.');
      }
    } catch (err) {
      alert('Error al intentar realizar soft-delete.');
    }
  };

  // Filter clients based on query
  const filteredClientes = clientes.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.nombre_completo.toLowerCase().includes(query) ||
      (c.cedula && c.cedula.toLowerCase().includes(query)) ||
      (c.telefono && c.telefono.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  // Fetch specific devices and repairs of currently selected client
  const clientDevices = selectedClient 
    ? equipos.filter(e => e.cliente_id === selectedClient.id)
    : [];

  const getDeviceRepairStatus = (deviceId: string) => {
    const deviceRepairs = reparaciones.filter(r => r.equipo_id === deviceId);
    if (deviceRepairs.length === 0) return { label: 'Sin órdenes', color: 'bg-slate-100 text-slate-600' };
    
    // Sort to find the latest
    const latest = deviceRepairs.sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())[0];
    
    const labelMap: Record<string, string> = {
      pendiente: 'Pendiente',
      diagnostico: 'Diagnóstico',
      reparacion: 'Reparación',
      pruebas: 'Pruebas',
      reparado: 'Reparado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };

    const colorMap: Record<string, string> = {
      pendiente: 'bg-amber-50 text-amber-700 border-amber-250',
      diagnostico: 'bg-sky-50 text-sky-700 border-sky-250',
      reparacion: 'bg-indigo-50 text-indigo-700 border-indigo-250',
      pruebas: 'bg-purple-50 text-purple-700 border-purple-250',
      reparado: 'bg-teal-50 text-teal-700 border-teal-250',
      entregado: 'bg-emerald-50 text-emerald-700 border-emerald-250',
      cancelado: 'bg-rose-50 text-rose-700 border-rose-250'
    };

    return {
      label: `${labelMap[latest.estado] || latest.estado} (${latest.numero_orden})`,
      color: `border ${colorMap[latest.estado] || 'bg-slate-50 text-slate-700'}`
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="client-management-panel">
      
      {/* Left Column: Client List & Searches */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cédula, nombre completo o teléfono..."
              id="search-client-input"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-850 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          <button
            onClick={openCreateModal}
            id="btn-add-client"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Registrar Cliente
          </button>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClientes.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400">
              No se encontraron clientes registrados con ese criterio.
            </div>
          ) : (
            filteredClientes.map(cliente => (
              <div
                key={cliente.id}
                onClick={() => setSelectedClient(cliente)}
                id={`client-card-${cliente.id}`}
                className={`p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  selectedClient?.id === cliente.id
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-md ring-2 ring-indigo-500/5'
                    : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{cliente.nombre_completo}</h4>
                    {cliente.cedula && (
                      <span className="text-xxs font-mono bg-slate-100 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded uppercase font-semibold">
                        {cliente.cedula}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-4">
                    {cliente.telefono && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[170px]">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.direccion && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[170px]">{cliente.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex border-t border-slate-100 pt-3 items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Ingresado: {new Date(cliente.fecha_registro).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    {onSelectClientForDevice && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClientForDevice(cliente);
                        }}
                        className="text-xxs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2 py-1 rounded"
                      >
                        Vincular
                      </button>
                    )}
                    <button
                      onClick={(e) => openEditModal(cliente, e)}
                      id={`btn-edit-client-${cliente.id}`}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(cliente.id, e)}
                      id={`btn-delete-client-${cliente.id}`}
                      className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Complete Client Profile & Interactive Device History */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        {selectedClient ? (
          <div className="space-y-6" id="client-detail-view">
            
            {/* profile block */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-md">
                {selectedClient.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-md">{selectedClient.nombre_completo}</h3>
                <p className="text-xs text-slate-500 font-mono">Cédula: {selectedClient.cedula || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-150 text-xs">
              <div className="flex flex-col gap-1 text-slate-700">
                <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block">Teléfono de contacto</span>
                <span className="font-medium text-slate-800">{selectedClient.telefono || 'No registrado'}</span>
              </div>
              <div className="flex flex-col gap-1 text-slate-700 border-t border-slate-100 pt-2.5">
                <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block">Correo electrónico</span>
                <span className="font-medium text-slate-800 break-all">{selectedClient.email || 'No registrado'}</span>
              </div>
              <div className="flex flex-col gap-1 text-slate-700 border-t border-slate-100 pt-2.5">
                <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block">Dirección de habitación</span>
                <span className="font-medium text-slate-800">{selectedClient.direccion || 'Sin dirección declarada'}</span>
              </div>
              {selectedClient.notas && (
                <div className="flex flex-col gap-1 text-slate-700 border-t border-slate-100 pt-2.5">
                  <span className="font-bold text-slate-400 text-xxs uppercase tracking-wider block">Notas del cliente</span>
                  <p className="text-slate-600 bg-slate-50 rounded p-2 italic">{selectedClient.notas}</p>
                </div>
              )}
            </div>

            {/* device history ledger */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-400" /> Equipos Vinculados ({clientDevices.length})
                </h4>
              </div>

              {clientDevices.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-slate-200 bg-white rounded-xl text-slate-400 text-xs">
                  Sin equipos registrados para este cliente.
                </div>
              ) : (
                <div className="space-y-3">
                  {clientDevices.map(device => {
                    const latestRepairStatus = getDeviceRepairStatus(device.id);
                    return (
                      <div key={device.id} className="p-3 bg-white rounded-xl border border-slate-150 flex flex-col justify-between hover:border-indigo-150 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-indigo-600">{device.tipo_equipo}</span>
                            <h5 className="font-bold text-slate-800 text-xs">{device.marca} {device.modelo}</h5>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">S/N: {device.serial}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 text-[10px]">
                          <span className="text-slate-400">Ingreso: {new Date(device.fecha_ingreso).toLocaleDateString()}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[9px] ${latestRepairStatus.color}`}>
                            {latestRepairStatus.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 text-slate-350 bg-white/20 border border-dashed border-slate-200 rounded-3xl" id="client-no-selection">
            <User className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-xs font-bold text-slate-400">Ningún Cliente Seleccionado</span>
            <p className="text-[11px] text-slate-350 max-w-[180px] mt-1">Haga clic en una tarjeta de cliente para ver su ficha completa e historial de productos.</p>
          </div>
        )}
      </div>

      {/* FORM MODAL (Add / Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="client-form-modal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-105 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {isEditing ? 'Editar Perfil de Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                id="btn-close-client-modal"
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="text-rose-600 bg-rose-50 text-xs p-3 rounded-lg flex items-start gap-1">
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cédula / Identificación Nacional</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="ej. V-12345678"
                  id="client-form-cedula"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nombre Completo <span className="text-red-550">*</span></label>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="ej. Juan Carlos Pérez"
                  required
                  id="client-form-name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Teléfono Móvil / Fijo</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="ej. +58 412-5551234"
                  id="client-form-tel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. correo@ejemplo.com"
                  id="client-form-email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dirección Corta de Residencia</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="ej. Urb Altamira, Edif Resguardo Apt 12, Caracas"
                  id="client-form-dir"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Notas Administrativas Internas</label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="ej. Viene recomendado. Ofrecer descuento por lote corporativo..."
                  id="client-form-notes"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex border-t border-slate-100 pt-4 items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  id="btn-cancel-client"
                  className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-client"
                  className="px-4 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple placeholder icon support
function X(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
