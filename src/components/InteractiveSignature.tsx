import { useRef, useState, useEffect } from 'react';
import { ShieldAlert, Trash2, CheckCircle } from 'lucide-react';

interface InteractiveSignatureProps {
  onSave: (base64Data: string) => void;
  onClear?: () => void;
  initialSignature?: string;
}

export default function InteractiveSignature({ onSave, onClear, initialSignature }: InteractiveSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#1e3a8a'; // Deep cobalt blue for pen ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSigned(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // Handle touch events vs mouse events
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    if (onClear) onClear();
    onSave('');
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    // Export data URL
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block">
          Firma Digital Aceptación del Cliente
        </label>
        {hasSigned && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" /> Firmado
          </span>
        )}
      </div>

      <div className="border border-dashed border-slate-300 rounded-lg p-1 bg-slate-50 relative overflow-hidden h-36">
        <canvas
          id="signature-canvas"
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full bg-white cursor-crosshair rounded block touch-none"
        />

        {!hasSigned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 select-none">
            <span className="text-sm font-medium">Dibuje su firma aquí</span>
            <span className="text-xxs text-slate-300">Usa el ratón o pantalla táctil</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xxs text-slate-400 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-slate-400 flex-shrink-0" />
          Firma vinculada a la Ley de Mensajes de Datos y Firmas Electrónicas.
        </span>

        <button
          type="button"
          onClick={clearCanvas}
          id="btn-clear-signature"
          className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>
    </div>
  );
}
