import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Cpu, Clock, CheckCircle, ChevronDown, ChevronUp, Wrench, ShieldAlert } from 'lucide-react';

interface SmartDiagnosticProps {
  initialMarca?: string;
  initialModelo?: string;
  initialFalla?: string;
  initialSintomas?: string;
  onApplyDiagnostic?: (data: {
    diagnostico: string;
    repuestos: Array<{ nombre: string; cantidad: number; costo: number }>;
    manoDeObra: number;
    diasGarantia: number;
  }) => void;
}

export default function SmartDiagnostic({
  initialMarca = '',
  initialModelo = '',
  initialFalla = '',
  initialSintomas = '',
  onApplyDiagnostic
}: SmartDiagnosticProps) {
  const [marca, setMarca] = useState(initialMarca);
  const [modelo, setModelo] = useState(initialModelo);
  const [falla, setFalla] = useState(initialFalla);
  const [sintomas, setSintomas] = useState(initialSintomas);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(!initialMarca);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca || !modelo || !falla) {
      setError('Por favor complete la marca, modelo y falla del equipo.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marca,
          modelo,
          falla,
          sintomas
        })
      });

      if (!res.ok) {
        throw new Error('Fallo al obtener respuesta de Gemini.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Error de conexión con el motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  const applyToOrder = () => {
    if (!result || !onApplyDiagnostic) return;

    // Convert repuestos format: { nombre: string, costo_estimado: number } -> { nombre: string, cantidad: 1, costo: number }
    const repuestosMap = (result.repuestos_recomendados || []).map((r: any) => ({
      nombre: r.nombre,
      cantidad: 1,
      costo: r.costo_estimado || 0
    }));

    // Auto-calculate appropriate warranty days
    let warrantyDays = 30;
    if (result.dificultad === 'Difícil') warrantyDays = 90;
    else if (result.dificultad === 'Fácil') warrantyDays = 30;

    // Build technical report summary
    const techReport = `DIAGNÓSTICO IA GEMINI:\n` +
      `Causas posibles:\n${result.causas_posibles.map((c: string) => `- ${c}`).join('\n')}\n\n` +
      `Procedimiento recomendado:\n${result.procedimiento_reparacion.map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}\n` +
      `Riesgos identificados:\n${result.riesgos_o_notas.map((r: string) => `- ${r}`).join('\n')}`;

    onApplyDiagnostic({
      diagnostico: techReport,
      repuestos: repuestosMap,
      manoDeObra: Math.ceil((result.tiempo_reparacion_minutos || 60) * 0.5), // e.g. $0.5 por minuto de trabajo estimado
      diasGarantia: warrantyDays
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-800" id="smart-diagnostic-box">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-md font-bold text-slate-100">Búsqueda Inteligente e Diagnóstico IA</h3>
          <p className="text-xs text-slate-400">Asistente técnico basado en Gemini 3.5 Flash</p>
        </div>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          id="btn-toggle-diagnose-form"
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          {showForm ? 'Ocultar campos de entrada' : 'Ver/Editar datos de análisis'} 
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleDiagnose} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xxs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Marca</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="ej. Sony, Apple, Samsung"
                id="diagnose-marca"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xxs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="ej. PlayStation 5, iPhone 13"
                id="diagnose-modelo"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xxs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Falla Reportada</label>
            <textarea
              rows={2}
              value={falla}
              onChange={(e) => setFalla(e.target.value)}
              placeholder="ej. No enciende. Se apaga de golpe arrojando pitidos continuos."
              id="diagnose-falla"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xxs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Síntomas Secundarios (Opcional)</label>
            <input
              type="text"
              value={sintomas}
              onChange={(e) => setSintomas(e.target.value)}
              placeholder="ej. Huele a quemado leve cerca de ranuras de aire, soplador zumba feo"
              id="diagnose-sintomas"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="btn-run-diagnose"
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                Analizando circuitería con Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Ejecutar Diagnóstico Experto
              </>
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-300 text-xs my-4">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-5 animate-fade-in" id="diagnostic-results">
          {/* Indicators row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 text-center">
              <span className="text-xxs uppercase text-slate-400 block mb-0.5">Dificultad</span>
              <span className={`text-md font-bold ${
                result.dificultad === 'Fácil' ? 'text-emerald-400' :
                result.dificultad === 'Mediana' ? 'text-amber-400' : 'text-red-400'
              }`}>{result.dificultad}</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 text-center">
              <span className="text-xxs uppercase text-slate-400 block mb-0.5">Tasa de Éxito</span>
              <span className="text-md font-extrabold text-indigo-300">{result.tasa_exito_porcentaje}%</span>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 text-center">
              <span className="text-xxs uppercase text-slate-400 block mb-0.5">Tiempo Promedio</span>
              <span className="text-md font-bold text-amber-400 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-amber-500" />
                {result.tiempo_reparacion_minutos} min
              </span>
            </div>
          </div>

          {/* Causes */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800/70">
            <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-2.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Posibles Causas Técnicas:
            </h4>
            <ul className="space-y-1.5">
              {result.causas_posibles.map((causa: string, index: number) => (
                <li key={index} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold flex-shrink-0">•</span>
                  <span>{causa}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Procedure */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800/70">
            <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-2.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-400" /> Procedimiento de Reparación Sugerido:
            </h4>
            <ol className="space-y-2">
              {result.procedimiento_reparacion.map((step: string, index: number) => (
                <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xxs font-extrabold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Spares */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-800/70">
            <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" /> Repuestos Recomendados:
            </h4>
            <div className="divide-y divide-slate-800">
              {(result.repuestos_recomendados || result.repuestos_recomendaos || []).map((rep: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-1.5 text-xs">
                  <span className="text-slate-300">{rep.nombre}</span>
                  <span className="font-mono text-emerald-400 font-bold">${Number(rep.costo_estimado).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks / Notes */}
          <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
            <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Notas Críticas y Riesgos:
            </h4>
            <ul className="space-y-1.5">
              {result.riesgos_o_notas.map((nota: string, index: number) => (
                <li key={index} className="text-xs text-amber-200/80 flex items-start gap-1.5">
                  <span className="text-amber-500 font-semibold">•</span>
                  <span>{nota}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Back Action */}
          {onApplyDiagnostic && (
            <button
              type="button"
              onClick={applyToOrder}
              id="btn-apply-ai-diagnosis"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-bold uppercase tracking-wider text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-150 shadow-md"
            >
              <CheckCircle className="w-4 h-4" /> Importar Datos de Diagnóstico a la Orden
            </button>
          )}

          {result.is_simulated && (
            <div className="text-right text-xxs text-slate-500 italic">
              * Ejecutándose bajo el motor analítico local de respaldo.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
