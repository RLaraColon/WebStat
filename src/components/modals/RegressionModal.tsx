import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { runLinearRegression } from '../../utils/statistics';
import { ChartViewData } from '../ChartViewer';
import { X, Check, TrendingUp, CheckSquare, Square } from 'lucide-react';

interface RegressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
  onShowChart: (chartData: ChartViewData) => void;
}

export const RegressionModal: React.FC<RegressionModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry,
  onShowChart
}) => {
  const [responseCol, setResponseCol] = useState<string>('');
  const [selectedPredictors, setSelectedPredictors] = useState<string[]>([]);
  const [generateFittedPlot, setGenerateFittedPlot] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const togglePredictor = (colId: string) => {
    if (colId === responseCol) return;
    if (selectedPredictors.includes(colId)) {
      setSelectedPredictors(selectedPredictors.filter(id => id !== colId));
    } else {
      setSelectedPredictors([...selectedPredictors, colId]);
    }
  };

  const handleRunRegression = () => {
    setErrorMsg(null);
    if (!responseCol) {
      setErrorMsg('Seleccione la variable dependiente (Respuesta Y).');
      return;
    }
    if (selectedPredictors.length === 0) {
      setErrorMsg('Seleccione al menos una variable independiente (Predictora X).');
      return;
    }

    try {
      const respDef = worksheet.columns.find(c => c.id === responseCol)!;
      const predDefs = selectedPredictors.map(id => worksheet.columns.find(c => c.id === id)!);

      const yRaw = worksheet.rows.map(r => r[responseCol]);
      const xRaws = selectedPredictors.map(id => worksheet.rows.map(r => r[id]));

      const res = runLinearRegression(
        respDef.name,
        yRaw,
        predDefs.map(p => p.name),
        xRaws
      );

      let out = `Análisis de Regresión: ${res.responseCol} versus ${res.predictorCols.join(', ')}\n\n`;
      out += `Ecuación de Regresión:\n`;
      out += `  ${res.equation}\n\n`;

      out += `Coeficientes del Modelo\n`;
      out += `Término              Coeficiente    EE Coef.    Valor T    Valor P\n`;
      out += `------------------------------------------------------------------\n`;
      res.coefficients.forEach(c => {
        out += `${c.term.padEnd(20)} ${c.coef.toFixed(4).padEnd(14)} ${c.seCoef.toFixed(4).padEnd(11)} ${c.tValue.toFixed(2).padEnd(10)} ${c.pValue.toFixed(4)}\n`;
      });
      out += `\n`;

      out += `Resumen del Modelo\n`;
      out += `S = ${res.summary.s.toFixed(4)}    R-cuad = ${res.summary.rSq.toFixed(2)}%    R-cuad (ajustado) = ${res.summary.rSqAdj.toFixed(2)}%\n\n`;

      out += `Análisis de Varianza (Tabla ANOVA de Regresión)\n`;
      out += `Fuente             GL       SC Ajust.     MC Ajust.    Valor F    Valor P\n`;
      out += `-------------------------------------------------------------------------\n`;
      res.anova.forEach(a => {
        const fStr = a.f > 0 ? a.f.toFixed(2) : '';
        const pStr = a.f > 0 ? a.p.toFixed(4) : '';
        out += `${a.source.padEnd(18)} ${String(a.df).padEnd(8)} ${a.ss.toFixed(3).padEnd(13)} ${a.ms > 0 ? a.ms.toFixed(3).padEnd(12) : ''.padEnd(12)} ${fStr.padEnd(10)} ${pStr}\n`;
      });
      out += `\n`;

      const regP = res.anova[0].p;
      if (regP < 0.05) {
        out += `Conclusión: El modelo de regresión es estadísticamente significativo (p = ${regP.toFixed(4)} < 0.05) y explica el ${res.summary.rSq.toFixed(2)}% de la variabilidad observada en '${res.responseCol}'.\n`;
      } else {
        out += `Conclusión: El modelo no alcanza significancia estadística (p = ${regP.toFixed(4)} ≥ 0.05).\n`;
      }

      onAddSessionEntry({
        id: `reg_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Regresión Lineal (${res.responseCol})`,
        type: 'regression',
        summaryText: out
      });

      // Scatter with regression trendline if single predictor
      if (generateFittedPlot && selectedPredictors.length === 1) {
        onShowChart({
          type: 'scatter',
          title: `Gráfica de Línea Ajustada: ${res.responseCol} vs ${res.predictorCols[0]}`,
          variableName: res.responseCol,
          data: {
            xValues: res.xValues.map(r => r[0]),
            yValues: res.yValues,
            xName: res.predictorCols[0],
            yName: res.responseCol,
            equation: res.equation,
            rSq: res.summary.rSq,
            regression: res
          }
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al calcular la regresión.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Ajuste de Modelo de Regresión</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Respuesta (Variable Dependiente Y):
            </label>
            <select
              value={responseCol}
              onChange={e => {
                setResponseCol(e.target.value);
                setSelectedPredictors(selectedPredictors.filter(id => id !== e.target.value));
              }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
            >
              <option value="">-- Seleccionar Variable Y --</option>
              {numericCols.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Predictores Continuos (Variables X):
            </label>
            <div className="border border-slate-300 rounded-md max-h-36 overflow-y-auto divide-y divide-slate-100 bg-slate-50 p-1">
              {numericCols.filter(c => c.id !== responseCol).map(col => {
                const isChecked = selectedPredictors.includes(col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => togglePredictor(col.id)}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                      isChecked ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-mono font-bold text-slate-600">{col.id}:</span>
                      <span>{col.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-center space-x-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={generateFittedPlot}
              onChange={e => setGenerateFittedPlot(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span>Generar Gráfico de Dispersión con Línea de Tendencia (si es regresión simple)</span>
          </label>
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
            onClick={handleRunRegression}
            disabled={!responseCol || selectedPredictors.length === 0}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular Regresión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
