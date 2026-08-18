import React, { useState } from 'react';
import { ColumnDefinition, WorksheetData, SessionEntry } from '../../types';
import { calculateDescriptiveStats, calculateProbabilityPlotData } from '../../utils/statistics';
import { ChartViewData } from '../ChartViewer';
import { X, Check, BarChart2, CheckSquare, Square } from 'lucide-react';

interface DescriptiveStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
  onShowChart: (chartData: ChartViewData) => void;
}

export const DescriptiveStatsModal: React.FC<DescriptiveStatsModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry,
  onShowChart
}) => {
  const [selectedColIds, setSelectedColIds] = useState<string[]>([]);
  const [generateHistogram, setGenerateHistogram] = useState(true);
  const [generateBoxplot, setGenerateBoxplot] = useState(false);
  const [generateProbPlot, setGenerateProbPlot] = useState(false);

  // Available numeric columns
  const numericColumns = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const toggleColumnSelection = (colId: string) => {
    if (selectedColIds.includes(colId)) {
      setSelectedColIds(selectedColIds.filter(id => id !== colId));
    } else {
      setSelectedColIds([...selectedColIds, colId]);
    }
  };

  const handleRunAnalysis = () => {
    if (selectedColIds.length === 0) return;

    let sessionOutput = `Estadísticas Descriptivas\n\n`;
    sessionOutput += `Variable            N   N*     Media   EE Media    Desv.Est.    Varianza      CoefVar       Mínimo          Q1     Mediana          Q3      Máximo         IQR   Asimetría    Curtosis\n`;
    sessionOutput += `------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------\n`;

    selectedColIds.forEach(colId => {
      const colDef = worksheet.columns.find(c => c.id === colId);
      if (!colDef) return;

      const rawVals = worksheet.rows.map(r => r[colId]);
      const stats = calculateDescriptiveStats(colId, colDef.name, rawVals, worksheet.rows.length);

      const varName = (colDef.name + ` (${colDef.id})`).padEnd(16).slice(0, 16);
      const nStr = String(stats.n).padStart(4);
      const nMissStr = String(stats.nMissing).padStart(4);
      const meanStr = stats.mean.toFixed(4).padStart(10);
      const seStr = stats.seMean.toFixed(4).padStart(10);
      const sdStr = stats.stdDev.toFixed(4).padStart(12);
      const varStr = stats.variance.toFixed(4).padStart(12);
      const cvStr = (stats.coefVar.toFixed(2) + '%').padStart(12);
      const minStr = stats.min.toFixed(4).padStart(12);
      const q1Str = stats.q1.toFixed(4).padStart(12);
      const medStr = stats.median.toFixed(4).padStart(12);
      const q3Str = stats.q3.toFixed(4).padStart(12);
      const maxStr = stats.max.toFixed(4).padStart(12);
      const iqrStr = stats.iqr.toFixed(4).padStart(12);
      const skewStr = stats.skewness.toFixed(3).padStart(11);
      const kurtStr = stats.kurtosis.toFixed(3).padStart(11);

      sessionOutput += `${varName} ${nStr} ${nMissStr} ${meanStr} ${seStr} ${sdStr} ${varStr} ${cvStr} ${minStr} ${q1Str} ${medStr} ${q3Str} ${maxStr} ${iqrStr} ${skewStr} ${kurtStr}\n`;
      sessionOutput += `   [Intervalo de Confianza del 95% para la Media: (${stats.ciLower95.toFixed(4)}, ${stats.ciUpper95.toFixed(4)})]\n\n`;

      // Trigger charts
      if (generateHistogram && stats.n > 0) {
        onShowChart({
          type: 'histogram',
          title: `Histograma de ${colDef.name}`,
          variableName: colDef.name,
          data: stats
        });
      } else if (generateBoxplot && stats.n > 0) {
        onShowChart({
          type: 'boxplot',
          title: `Diagrama de Caja de ${colDef.name}`,
          variableName: colDef.name,
          data: { ...stats, varName: colDef.name }
        });
      } else if (generateProbPlot && stats.n > 0) {
        const probData = calculateProbabilityPlotData(stats.values);
        onShowChart({
          type: 'probability',
          title: `Gráfica de Probabilidad Normal - ${colDef.name}`,
          variableName: colDef.name,
          data: probData
        });
      }
    });

    onAddSessionEntry({
      id: `desc_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: `Estadísticas Descriptivas (${selectedColIds.length} variables)`,
      type: 'descriptive',
      summaryText: sessionOutput
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Estadísticas Descriptivas</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Seleccione Variables (Columnas):
            </label>
            <div className="border border-slate-300 rounded-md max-h-44 overflow-y-auto divide-y divide-slate-100 bg-slate-50 p-1">
              {numericColumns.length === 0 ? (
                <div className="p-3 text-center text-slate-400">
                  No hay columnas numéricas en la hoja actual.
                </div>
              ) : (
                numericColumns.map(col => {
                  const isChecked = selectedColIds.includes(col.id);
                  return (
                    <div
                      key={col.id}
                      onClick={() => toggleColumnSelection(col.id)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
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
                      <span className="text-[10px] text-slate-500 uppercase">{col.type}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Graphical options */}
          <div className="border-t border-slate-200 pt-3">
            <label className="block font-semibold mb-2 text-slate-800">
              Gráficos Opcionales:
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateHistogram}
                  onChange={e => setGenerateHistogram(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Histograma de datos con curva de distribución normal ajustada</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateBoxplot}
                  onChange={e => setGenerateBoxplot(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Diagrama de Caja (Boxplot)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateProbPlot}
                  onChange={e => setGenerateProbPlot(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Gráfica de Probabilidad Normal (Prueba Anderson-Darling)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 bg-slate-100 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded font-medium text-xs shadow-2xs transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={selectedColIds.length === 0}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular Estadísticas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
