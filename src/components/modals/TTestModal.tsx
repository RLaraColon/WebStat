import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { run1SampleTTest, run2SampleTTest, runPairedTTest } from '../../utils/statistics';
import { X, Check, HelpCircle, GitCommit } from 'lucide-react';

interface TTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
}

export const TTestModal: React.FC<TTestModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry
}) => {
  const [testType, setTestType] = useState<'1sample' | '2sample' | 'paired'>('1sample');
  const [col1, setCol1] = useState<string>('');
  const [col2, setCol2] = useState<string>('');
  const [hypoMean, setHypoMean] = useState<number>(0);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [alternative, setAlternative] = useState<'two-sided' | 'less' | 'greater'>('two-sided');
  const [equalVariances, setEqualVariances] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const handleExecute = () => {
    setErrorMsg(null);
    try {
      if (testType === '1sample') {
        if (!col1) throw new Error('Seleccione la columna para la muestra.');
        const colDef = worksheet.columns.find(c => c.id === col1)!;
        const vals = worksheet.rows.map(r => r[col1]);
        const res = run1SampleTTest(colDef.name, vals, hypoMean, confidenceLevel, alternative);

        const altSymbol = alternative === 'two-sided' ? '≠' : alternative === 'greater' ? '>' : '<';

        let out = `Prueba T de una muestra: ${res.columnName}\n\n`;
        out += `Estadísticas Descriptivas\n`;
        out += `N         Media     Desv.Est.    EE Media    IC de ${res.ciLevel}% para μ\n`;
        out += `------------------------------------------------------------------------------------\n`;
        out += `${String(res.sampleSize).padEnd(9)} ${res.mean.toFixed(4).padEnd(10)} ${res.stdDev.toFixed(4).padEnd(12)} ${res.seMean.toFixed(4).padEnd(11)} (${res.ciLower.toFixed(4)}, ${res.ciUpper.toFixed(4)})\n\n`;
        out += `Prueba de Hipótesis\n`;
        out += `Hipótesis nula       H₀: μ = ${res.hypothesizedMean}\n`;
        out += `Hipótesis alterna    H₁: μ ${altSymbol} ${res.hypothesizedMean}\n\n`;
        out += `Valor T     GL     Valor P\n`;
        out += `--------------------------\n`;
        out += `${res.tStatistic.toFixed(2).padEnd(11)} ${String(res.df).padEnd(6)} ${res.pValue.toFixed(4)}\n\n`;

        if (res.pValue < (100 - confidenceLevel) / 100) {
          out += `Conclusión: Con un nivel de significancia α = ${((100 - confidenceLevel) / 100).toFixed(2)}, se RECHAZA la hipótesis nula (p < α). Existe evidencia estadísticamente significativa de que la media poblacional difiere de ${res.hypothesizedMean}.\n`;
        } else {
          out += `Conclusión: Con un nivel de significancia α = ${((100 - confidenceLevel) / 100).toFixed(2)}, NO se rechaza la hipótesis nula (p ≥ α). No existe evidencia suficiente para concluir que la media difiere de ${res.hypothesizedMean}.\n`;
        }

        onAddSessionEntry({
          id: `ttest1_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Prueba T de 1 Muestra (${res.columnName})`,
          type: 'ttest1',
          summaryText: out
        });
      } else if (testType === '2sample') {
        if (!col1 || !col2) throw new Error('Seleccione ambas columnas de muestras independientes.');
        const colDef1 = worksheet.columns.find(c => c.id === col1)!;
        const colDef2 = worksheet.columns.find(c => c.id === col2)!;
        const v1 = worksheet.rows.map(r => r[col1]);
        const v2 = worksheet.rows.map(r => r[col2]);

        const res = run2SampleTTest(colDef1.name, v1, colDef2.name, v2, equalVariances, confidenceLevel, alternative);
        const altSymbol = alternative === 'two-sided' ? '≠' : alternative === 'greater' ? '>' : '<';

        let out = `Prueba T de dos muestras independientes: ${res.col1Name} vs ${res.col2Name}\n\n`;
        out += `Estadísticas de Muestra\n`;
        out += `Muestra               N         Media     Desv.Est.    EE Media\n`;
        out += `----------------------------------------------------------------\n`;
        out += `${res.col1Name.padEnd(21)} ${String(res.n1).padEnd(9)} ${res.mean1.toFixed(4).padEnd(10)} ${res.s1.toFixed(4).padEnd(12)} ${(res.s1/Math.sqrt(res.n1)).toFixed(4)}\n`;
        out += `${res.col2Name.padEnd(21)} ${String(res.n2).padEnd(9)} ${res.mean2.toFixed(4).padEnd(10)} ${res.s2.toFixed(4).padEnd(12)} ${(res.s2/Math.sqrt(res.n2)).toFixed(4)}\n\n`;
        out += `Diferencia: μ₁ - μ₂ = ${res.diff.toFixed(4)}\n`;
        out += `Estimación de la diferencia: ${res.diff.toFixed(4)}\n`;
        out += `IC de ${res.ciLevel}% para la diferencia: (${res.ciLower.toFixed(4)}, ${res.ciUpper.toFixed(4)})\n`;
        out += `Método de varianzas: ${res.equalVariances ? 'Varianzas agrupadas iguales' : "Aproximación de Welch (varianzas desiguales)"}\n\n`;
        out += `Prueba de Hipótesis\n`;
        out += `Hipótesis nula       H₀: μ₁ - μ₂ = 0\n`;
        out += `Hipótesis alterna    H₁: μ₁ - μ₂ ${altSymbol} 0\n\n`;
        out += `Valor T     GL     Valor P\n`;
        out += `--------------------------\n`;
        out += `${res.tStatistic.toFixed(2).padEnd(11)} ${String(res.df).padEnd(6)} ${res.pValue.toFixed(4)}\n\n`;

        if (res.pValue < (100 - confidenceLevel) / 100) {
          out += `Conclusión: Con p = ${res.pValue.toFixed(4)} < α (${((100 - confidenceLevel)/100).toFixed(2)}), se RECHAZA H₀. Las dos poblaciones presentan medias estadísticamente diferentes.\n`;
        } else {
          out += `Conclusión: Con p = ${res.pValue.toFixed(4)} ≥ α (${((100 - confidenceLevel)/100).toFixed(2)}), NO se rechaza H₀. No hay diferencia estadísticamente significativa entre las medias.\n`;
        }

        onAddSessionEntry({
          id: `ttest2_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Prueba T de 2 Muestras (${res.col1Name} vs ${res.col2Name})`,
          type: 'ttest2',
          summaryText: out
        });
      } else {
        // Paired
        if (!col1 || !col2) throw new Error('Seleccione las columnas de muestra 1 y muestra 2 pareadas.');
        const colDef1 = worksheet.columns.find(c => c.id === col1)!;
        const colDef2 = worksheet.columns.find(c => c.id === col2)!;
        const v1 = worksheet.rows.map(r => r[col1]);
        const v2 = worksheet.rows.map(r => r[col2]);

        const res = runPairedTTest(colDef1.name, v1, colDef2.name, v2, confidenceLevel, alternative);
        const altSymbol = alternative === 'two-sided' ? '≠' : alternative === 'greater' ? '>' : '<';

        let out = `Prueba T Pareada: ${colDef1.name} - ${colDef2.name}\n\n`;
        out += `Estadísticas Descriptivas de las Diferencias (${colDef1.name} - ${colDef2.name})\n`;
        out += `N         Media     Desv.Est.    EE Media    IC de ${res.ciLevel}% para la diferencia media\n`;
        out += `-----------------------------------------------------------------------------------------\n`;
        out += `${String(res.sampleSize).padEnd(9)} ${res.mean.toFixed(4).padEnd(10)} ${res.stdDev.toFixed(4).padEnd(12)} ${res.seMean.toFixed(4).padEnd(11)} (${res.ciLower.toFixed(4)}, ${res.ciUpper.toFixed(4)})\n\n`;
        out += `Prueba de Hipótesis Pareada\n`;
        out += `Hipótesis nula       H₀: μ_d = 0\n`;
        out += `Hipótesis alterna    H₁: μ_d ${altSymbol} 0\n\n`;
        out += `Valor T     GL     Valor P\n`;
        out += `--------------------------\n`;
        out += `${res.tStatistic.toFixed(2).padEnd(11)} ${String(res.df).padEnd(6)} ${res.pValue.toFixed(4)}\n\n`;

        if (res.pValue < (100 - confidenceLevel) / 100) {
          out += `Conclusión: Con p = ${res.pValue.toFixed(4)} < α (${((100 - confidenceLevel)/100).toFixed(2)}), se RECHAZA H₀. Hay un cambio o diferencia significativo entre las observaciones pareadas.\n`;
        } else {
          out += `Conclusión: Con p = ${res.pValue.toFixed(4)} ≥ α, NO se rechaza H₀. No hay evidencia de diferencia entre las condiciones.\n`;
        }

        onAddSessionEntry({
          id: `ttest_p_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Prueba T Pareada (${colDef1.name} - ${colDef2.name})`,
          type: 'ttest_paired',
          summaryText: out
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar la prueba T.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Pruebas de Hipótesis (Prueba T)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs">
          <button
            onClick={() => setTestType('1sample')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              testType === '1sample'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1 Muestra
          </button>
          <button
            onClick={() => setTestType('2sample')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              testType === '2sample'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2 Muestras (Indep.)
          </button>
          <button
            onClick={() => setTestType('paired')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              testType === 'paired'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Pareada (Antes/Después)
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          {/* Sample Selectors */}
          <div className="space-y-2">
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                {testType === '1sample' ? 'Variable de Muestra:' : 'Muestra 1:'}
              </label>
              <select
                value={col1}
                onChange={e => setCol1(e.target.value)}
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

            {(testType === '2sample' || testType === 'paired') && (
              <div>
                <label className="block font-semibold mb-1 text-slate-800">Muestra 2:</label>
                <select
                  value={col2}
                  onChange={e => setCol2(e.target.value)}
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
            )}
          </div>

          {/* Hypothesized Mean for 1 sample */}
          {testType === '1sample' && (
            <div>
              <label className="block font-semibold mb-1 text-slate-800">
                Media Hipotética de Prueba (μ₀):
              </label>
              <input
                type="number"
                step="any"
                value={hypoMean}
                onChange={e => setHypoMean(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800">Nivel de Confianza:</label>
              <select
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(Number(e.target.value))}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
              >
                <option value={90}>90.0% (α = 0.10)</option>
                <option value={95}>95.0% (α = 0.05)</option>
                <option value={99}>99.0% (α = 0.01)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-800">Hipótesis Alterna:</label>
              <select
                value={alternative}
                onChange={e => setAlternative(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
              >
                <option value="two-sided">Diferente de (≠)</option>
                <option value="less">Menor que (&lt;)</option>
                <option value="greater">Mayor que (&gt;)</option>
              </select>
            </div>
          </div>

          {testType === '2sample' && (
            <label className="flex items-center space-x-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={equalVariances}
                onChange={e => setEqualVariances(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-slate-600">Asumir varianzas iguales (Varianza agrupada)</span>
            </label>
          )}
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
            onClick={handleExecute}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Ejecutar Prueba</span>
          </button>
        </div>
      </div>
    </div>
  );
};
