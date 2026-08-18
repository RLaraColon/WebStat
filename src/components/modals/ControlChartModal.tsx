import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { runControlChart } from '../../utils/statistics';
import { ChartViewData } from '../ChartViewer';
import { X, Check, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ControlChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
  onShowChart: (chartData: ChartViewData) => void;
}

export const ControlChartModal: React.FC<ControlChartModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry,
  onShowChart
}) => {
  const [chartType, setChartType] = useState<'xbar-r' | 'imr' | 'p-chart'>('xbar-r');
  const [variableCol, setVariableCol] = useState<string>('');
  const [subgroupSize, setSubgroupSize] = useState<number>(5);
  const [sampleSizeCol, setSampleSizeCol] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const handleRunSPC = () => {
    setErrorMsg(null);
    if (!variableCol) {
      setErrorMsg('Seleccione la columna de datos o defectos.');
      return;
    }

    try {
      const varDef = worksheet.columns.find(c => c.id === variableCol)!;
      const rawVals = worksheet.rows.map(r => r[variableCol]);
      const rawSizes = sampleSizeCol ? worksheet.rows.map(r => r[sampleSizeCol]) : undefined;

      const res = runControlChart(chartType, varDef.name, rawVals, subgroupSize, rawSizes);

      let out = ``;
      if (chartType === 'xbar-r') {
        out += `Gráfica Xbarra-R de ${res.variableName}\n`;
        out += `Tamaño de subgrupo = ${res.subgroupSize}, Cantidad de subgrupos = ${res.subgroups.length}\n\n`;
        out += `Límites de Control para Gráfica Xbarra (Medias)\n`;
        out += `LSC (UCL) = ${res.xbar.ucl.toFixed(4)}\n`;
        out += `Línea Central (LC) = ${res.xbar.cl.toFixed(4)}\n`;
        out += `LIC (LCL) = ${res.xbar.lcl.toFixed(4)}\n\n`;

        out += `Límites de Control para Gráfica R (Rangos)\n`;
        out += `LSC (UCL) = ${res.r.ucl.toFixed(4)}\n`;
        out += `Línea Central (LC) = ${res.r.cl.toFixed(4)}\n`;
        out += `LIC (LCL) = ${res.r.lcl.toFixed(4)}\n\n`;
      } else if (chartType === 'imr') {
        out += `Gráfica de Valores Individuales y Rango Móvil (I-MR) de ${res.variableName}\n\n`;
        out += `Gráfica Individual (I)\n`;
        out += `LSC = ${res.xbar.ucl.toFixed(4)}    LC = ${res.xbar.cl.toFixed(4)}    LIC = ${res.xbar.lcl.toFixed(4)}\n\n`;
        out += `Gráfica de Rango Móvil (MR)\n`;
        out += `LSC = ${res.r.ucl.toFixed(4)}    LC = ${res.r.cl.toFixed(4)}    LIC = 0.0000\n\n`;
      } else {
        out += `Gráfica P de Proporción de Defectos: ${res.variableName}\n\n`;
        out += `Línea Central (p barra) = ${res.xbar.cl.toFixed(4)}\n`;
        out += `LSC promedio = ${res.xbar.ucl.toFixed(4)}\n`;
        out += `LIC promedio = ${res.xbar.lcl.toFixed(4)}\n\n`;
      }

      if (res.violations.length > 0) {
        out += `⚠️ Resumen de Pruebas de Fuera de Control:\n`;
        res.violations.forEach(v => {
          out += `  * [${v.chart}] Punto ${v.pointIndex}: ${v.rule}\n`;
        });
        out += `\nDiagnóstico: El proceso presenta causas especiales de variación. Se recomienda investigación de causa raíz.\n`;
      } else {
        out += `✓ Todas las pruebas superadas: No se detectaron puntos fuera de control estadístico (Proceso estable).\n`;
      }

      onAddSessionEntry({
        id: `spc_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Gráfico de Control ${chartType.toUpperCase()} (${res.variableName})`,
        type: 'control_chart',
        summaryText: out
      });

      // Launch interactive chart
      onShowChart({
        type: chartType,
        title: `Gráfico de Control ${chartType === 'xbar-r' ? 'Xbar-R' : chartType === 'imr' ? 'I-MR' : 'P'}`,
        variableName: res.variableName,
        data: res
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar el gráfico de control.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Gráficos de Control de Calidad (SPC)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs">
          <button
            onClick={() => setChartType('xbar-r')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              chartType === 'xbar-r'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráfico Xbar-R
          </button>
          <button
            onClick={() => setChartType('imr')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              chartType === 'imr'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráfico I-MR
          </button>
          <button
            onClick={() => setChartType('p-chart')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              chartType === 'p-chart'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Gráfico P (Defectos)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              {chartType === 'p-chart' ? 'Columna de Piezas Defectuosas:' : 'Variable de Medición (Datos Continuos):'}
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

          {chartType === 'xbar-r' && (
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Tamaño del Subgrupo (n):
              </label>
              <input
                type="number"
                min={2}
                max={25}
                value={subgroupSize}
                onChange={e => setSubgroupSize(parseInt(e.target.value) || 5)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Comúnmente n = 3, 4 o 5 observaciones consecutivas por subgrupo.
              </p>
            </div>
          )}

          {chartType === 'p-chart' && (
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Tamaño del Lote Inspeccionado (Fijo o Columna):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min={1}
                    value={subgroupSize}
                    onChange={e => setSubgroupSize(parseInt(e.target.value) || 100)}
                    placeholder="Tamaño fijo (ej. 200)"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <select
                    value={sampleSizeCol}
                    onChange={e => setSampleSizeCol(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="">-- O por Columna --</option>
                    {numericCols.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id}: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11.5px] text-slate-600">
            <strong>Reglas de Detección de Causas Especiales:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
              <li>1 punto &gt; 3 desviaciones estándar de la línea central (LSC/LIC)</li>
              <li>Calculado estrictamente local sin consumo de tokens</li>
            </ul>
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
            onClick={handleRunSPC}
            disabled={!variableCol}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Generar Gráfico SPC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
