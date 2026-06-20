import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckSquare, Square, User, Plus, Search, HelpCircle, Laptop, Smartphone, Tv, Gamepad2, Info } from 'lucide-react';
import { Cliente, Equipo, TipoEquipo } from '../types';

interface DeviceManagementProps {
  clientes: Cliente[];
  equipos: Equipo[];
  onRefresh: () => void;
  selectedClientFromParent?: Cliente | null;
  onSelectClientFromParentReset?: () => void;
  onDeviceRegistered?: (device: Equipo) => void;
}

const ACCESSORY_PRESETS = ['Cargador', 'Cable USB', 'Funda/Estuche', 'Caja Original', 'Control Remoto', 'Batería', 'Bandeja SIM'];

export default function DeviceManagement({
  clientes,
  equipos,
  onRefresh,
  selectedClientFromParent,
  onSelectClientFromParentReset,
  onDeviceRegistered
}: DeviceManagementProps) {
  // Client selection
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // Form Fields
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [serial, setSerial] = useState('');
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>('celular');
  const [color, setColor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estadoIngreso, setEstadoIngreso] = useState<'nuevo' | 'bueno' | 'regular' | 'malo'>('regular');
  
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [customAccessory, setCustomAccessory] = useState('');

  // Photographic Evidence State (Real camera + mockup)
  const [photos, setPhotos] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form errors
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClientFromParent) {
      setSelectedClient(selectedClientFromParent);
    }
    return () => {
      // Cleanup camera bounds
      stopCamera();
    };
  }, [selectedClientFromParent]);

  // Handle Client select
  const handleSelectClient = (client: Cliente) => {
    setSelectedClient(client);
    setClientSearch('');
    if (onSelectClientFromParentReset) onSelectClientFromParentReset();
  };

  // Accessories Multi-select toggler
  const toggleAccessory = (acc: string) => {
    if (selectedAccessories.includes(acc)) {
      setSelectedAccessories(selectedAccessories.filter(a => a !== acc));
    } else {
      setSelectedAccessories([...selectedAccessories, acc]);
    }
  };

  const handleAddCustomAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAccessory.trim() && !selectedAccessories.includes(customAccessory.trim())) {
      setSelectedAccessories([...selectedAccessories, customAccessory.trim()]);
      setCustomAccessory('');
    }
  };

  // Webcam Management with Web permissions using the camera
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer rear camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera block / unavailable:', err);
      setCameraError('No se pudo acceder a la cámara. Por favor autorice accesos en el navegador o use un archivo.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Snap photo Base64
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotos([...photos, dataUrl]);
    }
    stopCamera();
  };

  // Handle manual file picker import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file as any);
    });
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Preset mockup photos in case user cannot run camera
  const applyMockEvidence = () => {
    const testMockPhoto = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAsIGhlaWdodD0yMDAiPgo8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXZpZGVuY2lhIEZvdG9ncsOhZmljYSBJbmdyZXNvPC90ZXh0Pgo8L3N2Zz4=`;
    setPhotos([...photos, testMockPhoto]);
  };

  // Form reset
  const resetForm = () => {
    setMarca('');
    setModelo('');
    setSerial('');
    setTipoEquipo('celular');
    setColor('');
    setObservaciones('');
    setEstadoIngreso('regular');
    setSelectedAccessories([]);
    setPhotos([]);
    setFormError(null);
  };

  // Submit Device Registration
  const handleSubmitDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedClient) {
      setFormError('Debe asociar este equipo a un cliente registrado.');
      return;
    }
    if (!marca || !modelo || !serial) {
      setFormError('La marca, modelo y serial son requeridos obligatoriamente.');
      return;
    }

    // Check serial uniqueness locally first
    const serialExists = equipos.find(eq => eq.serial.toLowerCase() === serial.trim().toLowerCase() && eq.activo);
    if (serialExists) {
      setFormError(`El serial '${serial}' ya se encuentra registrado para otro equipo (${serialExists.marca} ${serialExists.modelo}). El serial de ingreso debe ser único.`);
      return;
    }

    const payload = {
      cliente_id: selectedClient.id,
      marca: marca.trim(),
      modelo: modelo.trim(),
      serial: serial.trim(),
      tipo_equipo: tipoEquipo,
      color: color.trim(),
      accesorios_recibidos: selectedAccessories,
      estado_ingreso: estadoIngreso,
      observaciones_ingreso: observaciones.trim(),
      fotos_ingreso: photos
    };

    try {
      const res = await fetch('/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Fallo general al registrar el equipo.');
      }

      setFormSuccess(`¡Equipo registrado exitosamente para el cliente ${selectedClient.nombre_completo}!`);
      
      resetForm();
      setSelectedClient(null);
      if (onSelectClientFromParentReset) onSelectClientFromParentReset();
      onRefresh();

      // Trigger redirect callback if required to directly register repair
      if (onDeviceRegistered) {
        onDeviceRegistered(data);
      }
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Filter clients list for dropdown selection
  const filteredClientsForSelect = clientes.filter(c => {
    const query = clientSearch.toLowerCase();
    return c.nombre_completo.toLowerCase().includes(query) || (c.cedula && c.cedula.toLowerCase().includes(query));
  });

  const getDeviceIcon = (type: TipoEquipo) => {
    switch (type) {
      case 'celular': return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'laptop': return <Laptop className="w-5 h-5 text-indigo-500" />;
      case 'tv': return <Tv className="w-5 h-5 text-indigo-500" />;
      case 'consola': return <Gamepad2 className="w-5 h-5 text-indigo-500" />;
      default: return <HelpCircle className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="device-management-section">
      
      {/* Column 1: Client select bridge */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest block">Asignar Propietario</h4>
        
        {selectedClient ? (
          <div className="bg-white p-4 rounded-xl border border-indigo-150 relative" id="assigned-client-card">
            <span className="text-xxs uppercase tracking-wider text-indigo-600 font-extrabold block mb-1">Cliente Vinculado</span>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-extrabold">
                {selectedClient.nombre_completo.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">{selectedClient.nombre_completo}</h5>
                <span className="text-xxs text-slate-400 block mt-0.5">Cédula: {selectedClient.cedula || 'N/A'}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedClient(null);
                if (onSelectClientFromParentReset) onSelectClientFromParentReset();
              }}
              id="btn-remove-client-link"
              className="absolute top-3 right-3 text-xxs text-slate-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="space-y-3" id="client-association-block">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente registrado..."
                id="search-client-for-device"
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Client micro ledger list */}
            <div className="max-h-56 overflow-y-auto border border-slate-150 rounded-lg bg-white divide-y divide-slate-100">
              {filteredClientsForSelect.length === 0 ? (
                <div className="text-center p-4 text-xs text-slate-400 italic">No hay resultados.</div>
              ) : (
                filteredClientsForSelect.slice(0, 5).map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    id={`link-client-row-${c.id}`}
                    className="p-3 text-left hover:bg-indigo-50/20 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{c.nombre_completo}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">ID: {c.cedula || 'N/A'} · Tlf: {c.telefono}</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                ))
              )}
            </div>
            
            <div className="text-xxs text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <span>Para registrar un dispositivo, primero debe seleccionar o crear el perfil de cliente.</span>
            </div>
          </div>
        )}
      </div>

      {/* Column 2 & 3: Intake details & camera */}
      <div className="lg:col-span-2 bg-white border border-slate-250 rounded-2xl p-6 relative">
        <h3 className="font-extrabold text-slate-800 text-sm mb-4">Hoja de Recepción del Dispositivo</h3>
        
        {formSuccess && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 text-xs font-bold mb-4">
            {formSuccess}
          </div>
        )}
        
        {formError && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 text-xs font-bold mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitDevice} className="space-y-6">
          
          {/* Main hardware block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="text-xxs uppercase font-extrabold text-slate-400 block mb-1">Tipo de Equipo</label>
              <div className="grid grid-cols-5 gap-1.5" id="device-type-selector">
                {(['celular', 'tablet', 'laptop', 'tv', 'consola'] as TipoEquipo[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTipoEquipo(type)}
                    id={`btn-type-${type}`}
                    className={`py-2 rounded-xl flex flex-col items-center justify-center border text-[9px] font-bold cursor-pointer transition-all ${
                      tipoEquipo === type 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-xs' 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {getDeviceIcon(type)}
                    <span className="capitalize mt-1">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xxs uppercase font-extrabold text-slate-400 block mb-1">Estado Físico Entrada</label>
              <div className="grid grid-cols-4 gap-1.5" id="device-condition-selector">
                {([
                  { val: 'nuevo', lbl: 'Nuevo', col: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                  { val: 'bueno', lbl: 'Bueno', col: 'bg-sky-50 text-sky-600 border-sky-200' },
                  { val: 'regular', lbl: 'Regular', col: 'bg-amber-50 text-amber-600 border-amber-200' },
                  { val: 'malo', lbl: 'Malo', col: 'bg-rose-50 text-rose-600 border-rose-250' }
                ]).map(tag => (
                  <button
                    key={tag.val}
                    type="button"
                    onClick={() => setEstadoIngreso(tag.val as any)}
                    id={`btn-state-${tag.val}`}
                    className={`py-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center ${
                      estadoIngreso === tag.val 
                        ? `${tag.col} shadow-xs font-extrabold scale-102` 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {tag.lbl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Marca del Fabricante</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="ej. Apple, Asus, Xiaomi"
                required
                id="device-marca"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Modelo Exacto</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="ej. ROG Ally Z1, iPhone 15 Pro Max"
                required
                id="device-modelo"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Número de Serial (S/N) <small className="text-indigo-600 font-bold">*Debe ser único</small></label>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="ej. SN-C28731XA9X"
                required
                id="device-serial"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Color de Carcasa / Chasis</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="ej. Titanium Gray, Tornasol Celestial"
                id="device-color"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black"
              />
            </div>

          </div>

          {/* Accessories Block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Accesorios Recibidos de Custodia</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" id="accessories-select-grid">
              {ACCESSORY_PRESETS.map(acc => {
                const checked = selectedAccessories.includes(acc);
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => toggleAccessory(acc)}
                    id={`btn-acc-${acc}`}
                    className={`flex items-center gap-1.5 p-2 rounded-lg text-left text-xs transition-colors border ${
                      checked 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                    <span>{acc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customAccessory}
                onChange={(e) => setCustomAccessory(e.target.value)}
                placeholder="Agregar otro accesorio..."
                id="custom-accessory-input"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-black"
              />
              <button
                type="button"
                onClick={handleAddCustomAccessory}
                id="btn-add-custom-acc"
                className="bg-slate-900 text-white text-xs font-medium px-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Remarks text */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Marcas de desgaste e Inspección Visual de Ingreso</label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="ej. Hendiduras visibles en cubierta trasera, pantalla astillada en zona del conector con tactil flotante..."
              id="device-obs"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-black shadow-xs"
            />
          </div>

          {/* Photo evidence block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pruebas y Registro Fotográfico de Ingreso ({photos.length})</label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyMockEvidence}
                  id="btn-mock-photo"
                  className="text-xxs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  + Generar Placeholders Base64
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Trigger camera panel card */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-center aspect-video relative overflow-hidden">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="photo-file-picker"
                />
                <Camera className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] text-slate-600 font-bold block">Subir Archivos</span>
                <span className="text-[8px] text-slate-400 block">o arrastrar fotos</span>
              </div>

              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                id="btn-toggle-camera"
                className="border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl flex flex-col items-center justify-center p-4 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all cursor-pointer text-center aspect-video"
              >
                <Camera className="w-5 h-5 text-indigo-500 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold block">{cameraActive ? 'Apagar Cámara' : 'Usar Cámara Móvil'}</span>
                <span className="text-[8px] text-indigo-400 block">Captura al instante</span>
              </button>

              {/* Photo evidence renders */}
              {photos.map((src, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-xs">
                  <img src={src} alt="Evidencia ingreso" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-500 cursor-pointer transition-colors shadow"
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white font-mono text-[8px] p-1 truncate text-center">
                    Foto {index + 1} - Etiqueta Ingreso
                  </div>
                </div>
              ))}

            </div>

            {/* Simulated Live Camera overlay */}
            {cameraActive && (
              <div className="mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800 text-center space-y-3 shadow-lg">
                <div className="relative aspect-video max-w-sm mx-auto bg-black rounded-lg overflow-hidden border border-slate-700">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded animate-pulse">
                    EN VIVO
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    id="btn-capture-snapshot"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-4 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    Tomar Foto Evidencia
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    id="btn-stop-camera"
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="text-amber-600 font-semibold text-xxs bg-amber-50 p-3 rounded-lg mt-2">
                {cameraError}
              </div>
            )}
          </div>

          {/* Action triggers */}
          <div className="flex border-t border-slate-100 pt-6 items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              id="btn-reset-device-form"
              className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Limpiar Campos
            </button>
            <button
              type="submit"
              id="btn-submit-device"
              className="px-5 py-2.5 text-xs text-white bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              Registrar Equipo
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
