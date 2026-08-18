import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { calculateCorrelationMatrix } from '../../utils/statistics';
import { X, Check, Grid, CheckSquare, Square } from 'lucide-react';

interface CorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onAddSessionEntry: (entry: SessionEntry) => void;
}

export const CorrelationModal: React.FC<CorrelationModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onAddSessionEntry
}) => {
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const toggleCol = (id: string) => {
    if (selectedCols.includes(id)) {
      setSelectedCols(selectedCols.filter(c => c !== id));
    } else {
      setSelectedCols([...selectedCols, id]);
    }
  };

  const handleRunCorrelation = () => {
    if (selectedCols.length < 2) return;

    const colDefs = selectedCols.map(id => worksheet.columns.find(c => c.id === id)!);
    const names = colDefs.map(c => c.name);
    const dataCols = selectedCols.map(id => worksheet.rows.map(r => r[id]));

    const res = calculateCorrelationMatrix(names, dataCols);

    let out = `Matriz de Correlación de Pearson\n\n`;
    // Build matrix header
    const colHeader = '                    ' + names.map(n => n.slice(0, 12).padStart(14)).join('');
    out += `${colHeader}\n`;
    out += `${'-'.repeat(colHeader.length + 5)}\n`;

    names.forEach((name1, i) => {
      let rLine = name1.padEnd(20);
      let pLine = ''.padEnd(20);

      names.forEach((name2, j) => {
        if (j > i) {
          rLine += ''.padStart(14);
          pLine += ''.padStart(14);
        } else {
          const match = res.matrix.find(
            m => (m.var1 === name1 && m.var2 === name2) || (m.var1 === name2 && m.var2 === name1)
          );
          if (match) {
            rLine += match.r.toFixed(4).padStart(14);
            if (i !== j) {
              pLine += `(p=${match.pValue.toFixed(3)})`.padStart(14);
            } else {
              pLine += ''.padStart(14);
            }
          }
        }
      });
      out += `${rLine}\n`;
      if (pLine.trim() !== '') {
        out += `${pLine}\n\n`;
      }
    });

    out += `\nInterpretación:\n`;
    out += `  * r cercano a +1: Fuerte correlación positiva directa.\n`;
    out += `  * r cercano a -1: Fuerte correlación negativa inversa.\n`;
    out += `  * r cercano a 0:  Sin correlación lineal linealmente separable.\n`;
    out += `  * Contenido de cada celda: Coeficiente de Pearson (r) y valor P de significancia.\n`;

    onAddSessionEntry({
      id: `corr_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: `Matriz de Correlación (${names.join(', ')})`,
      type: 'correlation',
      summaryText: out
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Correlación de Pearson</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-xs text-slate-700">
          <label className="block font-semibold text-slate-800">
            Seleccione al menos 2 variables continuas:
          </label>
          <div className="border border-slate-300 rounded-md max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50 p-1">
            {numericCols.map(col => {
              const isChecked = selectedCols.includes(col.id);
              return (
                <div
                  key={col.id}
                  onClick={() => toggleCol(col.id)}
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
                </div>
              );
            })}
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
            onClick={handleRunCorrelation}
            disabled={selectedCols.length < 2}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular Correlación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
