import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { runOneWayAnova } from '../../utils/statistics';
import { X, Check, PieChart, Layers } from 'lucide-react';

interface AnovaModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
}

export const AnovaModal: React.FC<AnovaModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry
}) => {
  const [responseCol, setResponseCol] = useState<string>('');
  const [factorCol, setFactorCol] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnova = () => {
    setErrorMsg(null);
    if (!responseCol || !factorCol) {
      setErrorMsg('Debe seleccionar la columna de Respuesta y la columna de Factor.');
      return;
    }

    try {
      const respDef = worksheet.columns.find(c => c.id === responseCol)!;
      const factDef = worksheet.columns.find(c => c.id === factorCol)!;

      const respVals = worksheet.rows.map(r => r[responseCol]);
      const factVals = worksheet.rows.map(r => r[factorCol]);

      const res = runOneWayAnova(factDef.name, respDef.name, factVals, respVals);

      let out = `Análisis de Varianza de un solo factor (ANOVA): ${res.responseName} vs. ${res.factorName}\n\n`;
      out += `Información del Factor\n`;
      out += `Factor        Niveles  Valores\n`;
      out += `--------------------------------------------------------\n`;
      out += `${res.factorName.padEnd(13)} ${String(res.groups.length).padEnd(8)} ${res.groups.map(g => g.name).join(', ')}\n\n`;

      out += `Análisis de Varianza (Tabla ANOVA)\n`;
      out += `Fuente             GL       SC Ajust.     MC Ajust.    Valor F    Valor P\n`;
      out += `-------------------------------------------------------------------------\n`;
      out += `${res.factorName.padEnd(18)} ${String(res.dfFactor).padEnd(8)} ${res.ssFactor.toFixed(3).padEnd(13)} ${res.msFactor.toFixed(3).padEnd(12)} ${res.fValue.toFixed(2).padEnd(10)} ${res.pValue.toFixed(4)}\n`;
      out += `Error              ${String(res.dfError).padEnd(8)} ${res.ssError.toFixed(3).padEnd(13)} ${res.msError.toFixed(3).padEnd(12)}\n`;
      out += `Total              ${String(res.dfTotal).padEnd(8)} ${res.ssTotal.toFixed(3).padEnd(13)}\n\n`;

      out += `Resumen del Modelo\n`;
      out += `S = ${res.pooledStdDev.toFixed(4)}    R-cuad = ${res.rSquared.toFixed(2)}%    R-cuad (ajustado) = ${res.rSquaredAdj.toFixed(2)}%\n\n`;

      out += `Medias y Desviaciones por Nivel del Factor (Desv.Est. agrupada = ${res.pooledStdDev.toFixed(4)})\n`;
      out += `Nivel               N         Media     Desv.Est.    IC de 95% individual\n`;
      out += `--------------------------------------------------------------------------\n`;
      res.groups.forEach(g => {
        out += `${g.name.padEnd(19)} ${String(g.n).padEnd(9)} ${g.mean.toFixed(4).padEnd(10)} ${g.stdDev.toFixed(4).padEnd(12)} (${g.ciLower.toFixed(4)}, ${g.ciUpper.toFixed(4)})\n`;
      });
      out += `\n`;

      if (res.pValue < 0.05) {
        out += `Conclusión: Con un valor p = ${res.pValue.toFixed(4)} < 0.05, se RECHAZA la hipótesis de igualdad de medias. Al menos un nivel de '${res.factorName}' produce una media estadísticamente diferente en '${res.responseName}'.\n`;
      } else {
        out += `Conclusión: Con un valor p = ${res.pValue.toFixed(4)} ≥ 0.05, NO se rechaza la hipótesis de igualdad de medias. No existe evidencia suficiente de diferencias entre los grupos.\n`;
      }

      onAddSessionEntry({
        id: `anova_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `ANOVA de un Factor (${res.responseName} por ${res.factorName})`,
        type: 'anova',
        summaryText: out
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar ANOVA.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">ANOVA de un Factor</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Respuesta (Variable Continua Y):
            </label>
            <select
              value={responseCol}
              onChange={e => setResponseCol(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
            >
              <option value="">-- Seleccionar Variable de Respuesta --</option>
              {worksheet.columns.filter(c => c.type === 'numeric').map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Factor (Variable Categórica / Grupos X):
            </label>
            <select
              value={factorCol}
              onChange={e => setFactorCol(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
            >
              <option value="">-- Seleccionar Variable de Factor --</option>
              {worksheet.columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}: {c.name} ({c.type})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              La columna del factor define las categorías, tratamientos, máquinas o lotes a comparar.
            </p>
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
            onClick={handleRunAnova}
            disabled={!responseCol || !factorCol}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular ANOVA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
