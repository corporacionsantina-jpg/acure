import { useEffect } from 'react';
import { Printer, X, CreditCard, Clock, Sparkles } from 'lucide-react';
import { Cliente, Equipo, Reparacion } from '../types';

interface TicketPrinterProps {
  cliente: Cliente;
  equipo: Equipo;
  reparacion: Reparacion;
  onClose: () => void;
}

export default function TicketPrinter({ cliente, equipo, reparacion, onClose }: TicketPrinterProps) {
  // Generate date strings
  const entryDate = new Date(reparacion.fecha_ingreso).toLocaleString('es-VE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  
  const promiseDate = reparacion.fecha_entrega_prometida 
    ? new Date(reparacion.fecha_entrega_prometida).toLocaleString('es-VE', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : 'No especificada';

  const handleNativePrint = () => {
    // Open a new formatted small print window specifically styled for 58mm receipts
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      alert('Por favor habilite las ventanas emergentes en su navegador para imprimir el ticket.');
      return;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reparacion.numero_orden)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impresión Ticket - ${reparacion.numero_orden}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              width: 58mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              margin: 0;
              padding: 5px;
              background: #fff;
              -webkit-print-color-adjust: exact;
            }
            .align-center { text-align: center; }
            .align-right { text-align: right; }
            .bold { font-weight: bold; }
            .double-height { font-size: 14px; }
            .header { margin-bottom: 8px; }
            .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
            .item-row { display: flex; justify-content: space-between; }
            .qr-container { text-align: center; margin: 8px 0; }
            .qr-image { width: 100px; height: 100px; }
            .policy-box { font-size: 7px; text-align: justify; line-height: 1.1; margin-top: 10px; }
            button { display: none; } /* Hide print elements during print */
          </style>
        </head>
        <body>
          <div class="align-center header">
            <span class="bold double-height">TALLER CENTRAL</span><br/>
            <span>SERVICIO TECNICO DE ELECTRONICA</span><br/>
            <span>RIF: J-304918274-0</span><br/>
            <span>Tlf: 0412-1234567</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="bold">ORDEN DE REPARACION: ${reparacion.numero_orden}</div>
          <div>Ingreso: ${entryDate}</div>
          <div>Promesa: ${promiseDate}</div>
          <div>Tecnico: ${reparacion.tecnico_asignado || 'Sin asignar'}</div>

          <div class="divider"></div>

          <div class="bold">CLIENTE:</div>
          <div>Nom: ${cliente.nombre_completo}</div>
          <div>Cedula: ${cliente.cedula || 'N/A'}</div>
          <div>Tlf: ${cliente.telefono || 'N/A'}</div>

          <div class="divider"></div>

          <div class="bold">EQUIPO:</div>
          <div>Tipo: ${equipo.tipo_equipo.toUpperCase()}</div>
          <div>Marca/Mod: ${equipo.marca} ${equipo.modelo}</div>
          <div>Serial: ${equipo.serial}</div>
          <div>Color: ${equipo.color || 'No especificado'}</div>
          <div>Marcos/Detalles: ${equipo.observaciones_ingreso || 'Ninguna'}</div>
          <div>Accesorios: ${equipo.accesorios_recibidos.join(', ') || 'Ninguno'}</div>

          <div class="divider"></div>

          <div class="bold">FALLA REPORTADA:</div>
          <div>${reparacion.falla_reportada}</div>

          <div class="divider"></div>

          <div class="bold">PRESUPUESTO PRELIMINAR:</div>
          <div class="item-row">
            <span>Mano de Obra:</span>
            <span>$${reparacion.costo_mano_obra.toFixed(2)}</span>
          </div>
          <div class="item-row">
            <span>Repuestos:</span>
            <span>$${reparacion.costo_repuestos.toFixed(2)}</span>
          </div>
          ${reparacion.descuento > 0 ? `
          <div class="item-row">
            <span>Descuento:</span>
            <span>-$${reparacion.descuento.toFixed(2)}</span>
          </div>` : ''}
          <div class="divider"></div>
          <div class="item-row bold double-height">
            <span>TOTAL CALE:</span>
            <span>$${reparacion.monto_final.toFixed(2)}</span>
          </div>

          <div class="divider"></div>

          <div class="qr-container">
            <img class="qr-image" src="${qrUrl}" alt="QR code" /><br/>
            <span style="font-size: 7px;">Escanee para consultar estado</span>
          </div>

          <div class="divider"></div>

          <div class="policy-box">
            <span class="bold">CLAUSULA DE ABANDONO:</span> Transcurridos TREINTA (30) dias continuos a partir de la notificacion de reparacion de este equipo sin ser retirado por el cliente, se considerará legalmente en estado de ABANDONO y pasará a ser propiedad exclusiva del taller para desguace o chatarra para sufragar costos administrativos.
            <br/><br/>
            <span class="bold">POLITICAS DE GARANTIA:</span> ${reparacion.dias_garantia} dias de garantia. Solo cubre fallas o repuestos expresamente instalados por nuestro taller. No se cubren anomalias por humedad, sulfatacion, golpes, roturas, rasgones o tensiones electricas.
          </div>

          <div class="divider"></div>
          <div class="align-center bold" style="margin-top: 10px;">
            Gracias por su confianza!
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const simulateWebUSBPrint = () => {
    alert(`Comando ESC/POS enviado de forma emulada via WebUSB a impresora térmica 58mm en puerto virtual.\n\nContenido transmitido:\n- ESC @ (Inicializar)\n- GS ! 17 (Doble Ancho/Alto para REP-ORDEN)\n- ESC a 1 (Centrar Cabecera)\n- Impresión de texto rasterizado de código de barras.\n- ESC d 4 (Avance de papel y corte parcial)`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleNativePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reparacion, cliente, entryDate, promiseDate]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="ticket-modal">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header Modal */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-800 text-sm">Impresión de Ticket Térmico 58mm</h3>
          </div>
          <button
            onClick={onClose}
            id="btn-close-ticket"
            className="text-gray-400 hover:text-gray-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Panel */}
        <div className="bg-slate-100 p-6 flex justify-center">
          {/* Simulated 58mm Paper Roll */}
          <div className="w-[58mm] min-w-[270px] bg-white border border-slate-300 shadow-md p-4 font-mono text-[11px] leading-tight text-black relative select-none" id="simulated-ticket-paper">
            
            {/* Torn paper edge visual top */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%)] bg-[length:6px_6px] bg-repeat-x -mt-1 transform rotate-180"></div>
            
            <div className="text-center mb-4">
              <span className="font-bold text-sm block">LABORATORIO ELECTRÓNICO</span>
              <span className="text-[10px] block">SERVICIO TÉCNICO PROFESIONAL</span>
              <span className="text-[9px] block">RIF: J-304918274-0</span>
              <span className="text-[9px] block">Tlfs: +58 0412-1234567</span>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="font-bold text-[12px] mb-1 text-center">ORDEN: {reparacion.numero_orden}</div>
            <div>Ref: {reparacion.id.substring(0, 8).toUpperCase()}</div>
            <div>Ingreso: {entryDate}</div>
            {reparacion.fecha_entrega_prometida && <div>Promesa: {promiseDate}</div>}
            <div>Técnico: {reparacion.tecnico_asignado || 'Erick Silva'}</div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="font-bold">CLIENTE:</div>
            <div>Nombre: {cliente.nombre_completo}</div>
            <div>Cédula: {cliente.cedula || 'Sin Cédula'}</div>
            <div>Tlf: {cliente.telefono}</div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="font-bold">EQUIPO:</div>
            <div>Dispositivo: {equipo.tipo_equipo.toUpperCase()}</div>
            <div>Marca/Mod: {equipo.marca} {equipo.modelo}</div>
            <div>Serial S/N: {equipo.serial}</div>
            {equipo.color && <div>Color: {equipo.color}</div>}
            <div>Detalles: {equipo.observaciones_ingreso || 'Marcas leves'}</div>
            <div>Accesorios: {equipo.accesorios_recibidos.join(', ') || 'Ninguno'}</div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="font-bold">FALLA REPORTADA:</div>
            <div className="italic text-[10px]">{reparacion.falla_reportada}</div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="font-bold">PRESUPUESTO PRELIMINAR:</div>
            <div className="flex justify-between">
              <span>Mano de Obra:</span>
              <span className="font-mono">${reparacion.costo_mano_obra.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Repuestos:</span>
              <span className="font-mono">${reparacion.costo_repuestos.toFixed(2)}</span>
            </div>
            {reparacion.descuento > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Descuento:</span>
                <span className="font-mono">-${reparacion.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="border-b border-dashed border-black my-1"></div>
            <div className="flex justify-between font-bold text-[12px]">
              <span>TOTAL ESTIMADO:</span>
              <span className="font-mono">${reparacion.monto_final.toFixed(2)}</span>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            <div className="flex flex-col items-center justify-center my-2 bg-slate-50 p-2 border border-slate-200 rounded">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(reparacion.numero_orden)}`} 
                alt="Simulated QR Barcode"
                className="w-20 h-20 bg-white" 
              />
              <span className="text-[7px] text-slate-500 mt-1 uppercase tracking-wider">Servicio de Monitoreo QR</span>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            {/* Crucial Policies block */}
            <div className="text-[7.5px] leading-snug text-justify text-slate-800 space-y-1">
              <div>
                <span className="font-bold">CLÁUSULA DE ABANDONO:</span> Se notifica formalmente al cliente que transcurridos <span className="font-bold">TREINTA (30) DÍAS</span> continuos tras su notificación, si el equipo no es retirado, se considerará legalmente ABANDONADO y el taller dispondrá de éste como compensación por conceptos de repuestos, bodega e insolvencia.
              </div>
              <div>
                <span className="font-bold">POLÍTICAS DE GARANTÍA:</span> Cobertura de {reparacion.dias_garantia} días única y exclusivamente por reparaciones detalladas. Se anulará en caso de rupturas físicas, sellos violados, accidentes por alta tensión o rastros de líquidos.
              </div>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>
            <div className="text-center font-bold mt-2">¡Cuidamos su tecnología!</div>

            {/* Torn paper edge visual bottom */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[length:6px_6px] bg-repeat-x mb-[-4px] transform"></div>
          </div>
        </div>

        {/* Action button triggers footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          
          <button
            onClick={handleNativePrint}
            id="btn-print-native"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Imprimir Ticket en Impresora Real
          </button>

          <button
            onClick={simulateWebUSBPrint}
            id="btn-print-usb-escpos"
            className="w-full bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            Transmitir Comandos ESC/POS WebUSB (Emulado)
          </button>
          
          <div className="flex items-center gap-1.5 justify-center mt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-500">Perfecto para impresoras de 58mm y 80mm</span>
          </div>
        </div>

      </div>
    </div>
  );
}
