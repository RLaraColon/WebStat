import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { runCapabilityAnalysis } from '../../utils/statistics';
import { ChartViewData } from '../ChartViewer';
import { X, Check, Target, Gauge } from 'lucide-react';

interface CapabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
  onShowChart: (chartData: ChartViewData) => void;
}

export const CapabilityModal: React.FC<CapabilityModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry,
  onShowChart
}) => {
  const [variableCol, setVariableCol] = useState<string>('');
  const [lsl, setLsl] = useState<string>('');
  const [usl, setUsl] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [subgroupSize, setSubgroupSize] = useState<number>(5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const handleRunCapability = () => {
    setErrorMsg(null);
    if (!variableCol) {
      setErrorMsg('Seleccione una variable de proceso.');
      return;
    }

    const numLsl = lsl.trim() !== '' ? parseFloat(lsl.replace(',', '.')) : undefined;
    const numUsl = usl.trim() !== '' ? parseFloat(usl.replace(',', '.')) : undefined;
    const numTarget = target.trim() !== '' ? parseFloat(target.replace(',', '.')) : undefined;

    if (numLsl === undefined && numUsl === undefined) {
      setErrorMsg('Debe ingresar al menos un límite de especificación (LIE / LSL o LSE / USL).');
      return;
    }

    if (numLsl !== undefined && numUsl !== undefined && numLsl >= numUsl) {
      setErrorMsg('El Límite Inferior (LSL) debe ser estrictamente menor que el Superior (USL).');
      return;
    }

    try {
      const colDef = worksheet.columns.find(c => c.id === variableCol)!;
      const rawVals = worksheet.rows.map(r => r[variableCol]);

      const res = runCapabilityAnalysis(colDef.name, rawVals, numLsl, numUsl, numTarget, subgroupSize);

      let out = `Informe de Capacidad del Proceso: ${res.variableName}\n`;
      out += `Límite Inferior de Espec. (LIE / LSL): ${res.lsl ?? 'Ninguno'}\n`;
      out += `Objetivo / Target:                     ${res.target ?? 'Ninguno'}\n`;
      out += `Límite Superior de Espec. (LSE / USL): ${res.usl ?? 'Ninguno'}\n`;
      out += `Tamaño de muestra N = ${res.sampleSize}, Tamaño de subgrupo n = ${subgroupSize}\n\n`;

      out += `Estadísticas del Proceso\n`;
      out += `Media (X barra) = ${res.mean.toFixed(4)}\n`;
      out += `Desv.Est. Dentro de subgrupos (StDev Within) = ${res.withinStdDev.toFixed(4)}\n`;
      out += `Desv.Est. General / Total (StDev Overall) =    ${res.overallStdDev.toFixed(4)}\n\n`;

      out += `Capacidad Potencial (Dentro de subgrupos / Corto Plazo)\n`;
      out += `  Cp:  ${res.cp !== undefined ? res.cp.toFixed(3) : 'N/A'}\n`;
      out += `  CPL: ${res.cpl !== undefined ? res.cpl.toFixed(3) : 'N/A'}\n`;
      out += `  CPU: ${res.cpu !== undefined ? res.cpu.toFixed(3) : 'N/A'}\n`;
      out += `  Cpk: ${res.cpk !== undefined ? res.cpk.toFixed(3) : 'N/A'}\n\n`;

      out += `Rendimiento General (Largo Plazo)\n`;
      out += `  Pp:  ${res.pp !== undefined ? res.pp.toFixed(3) : 'N/A'}\n`;
      out += `  PPL: ${res.ppl !== undefined ? res.ppl.toFixed(3) : 'N/A'}\n`;
      out += `  PPU: ${res.ppu !== undefined ? res.ppu.toFixed(3) : 'N/A'}\n`;
      out += `  Ppk: ${res.ppk !== undefined ? res.ppk.toFixed(3) : 'N/A'}\n\n`;

      out += `Rendimiento Esperado (Partes por Millón - PPM fuera de especificación):\n`;
      out += `  PPM < LIE (LSL): ${res.ppmExpectedBelow}\n`;
      out += `  PPM > LSE (USL): ${res.ppmExpectedAbove}\n`;
      out += `  PPM Total:       ${res.ppmExpectedTotal}\n\n`;

      if (res.cpk !== undefined) {
        if (res.cpk >= 1.33) {
          out += `Evaluación: Proceso CAPAZ y ADECUADO (Cpk ≥ 1.33). El proceso cumple con los estándares industriales de calidad Seis Sigma.\n`;
        } else if (res.cpk >= 1.0) {
          out += `Evaluación: Proceso ACEPTABLE pero marginal (1.0 ≤ Cpk < 1.33). Requiere control riguroso para evitar piezas no conformes.\n`;
        } else {
          out += `Evaluación: Proceso NO CAPAZ (Cpk < 1.00). El proceso produce defectos de manera recurrente fuera de tolerancias.\n`;
        }
      }

      onAddSessionEntry({
        id: `cap_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Análisis de Capacidad (${res.variableName})`,
        type: 'capability',
        summaryText: out
      });

      onShowChart({
        type: 'capability',
        title: `Capacidad del Proceso: ${res.variableName}`,
        variableName: res.variableName,
        data: res
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en el análisis de capacidad.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Análisis de Capacidad del Proceso (Cp / Cpk)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Variable de Medición:
            </label>
            <select
              value={variableCol}
              onChange={e => setVariableCol(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
            >
              <option value="">-- Seleccionar Columna --</option>
              {numericCols.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Límite Inferior (LIE / LSL):
              </label>
              <input
                type="text"
                value={lsl}
                onChange={e => setLsl(e.target.value)}
                placeholder="Ej. 24.90"
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Límite Superior (LSE / USL):
              </label>
              <input
                type="text"
                value={usl}
                onChange={e => setUsl(e.target.value)}
                placeholder="Ej. 25.10"
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Valor Objetivo (Target Opcional):
              </label>
              <input
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="Ej. 25.00"
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Tamaño del Subgrupo:
              </label>
              <input
                type="number"
                min={2}
                max={25}
                value={subgroupSize}
                onChange={e => setSubgroupSize(parseInt(e.target.value) || 5)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-slate-100 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded font-medium text-xs shadow-2xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleRunCapability}
            disabled={!variableCol}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular Capacidad</span>
          </button>
        </div>
      </div>
    </div>
  );
};
