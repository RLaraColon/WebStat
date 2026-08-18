import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../../types';
import { Calculator, X, Check, ArrowRight } from 'lucide-react';

interface DataTransformModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: WorksheetData;
  onUpdateWorksheet: (ws: WorksheetData) => void;
  onAddSessionEntry: (entry: SessionEntry) => void;
}

export const DataTransformModal: React.FC<DataTransformModalProps> = ({
  isOpen,
  onClose,
  worksheet,
  onUpdateWorksheet,
  onAddSessionEntry
}) => {
  const [targetColName, setTargetColName] = useState<string>('Transformada');
  const [transformType, setTransformType] = useState<'standardize' | 'log' | 'sqrt' | 'power2' | 'add_cols'>('standardize');
  const [sourceCol, setSourceCol] = useState<string>('');
  const [secondCol, setSecondCol] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericCols = worksheet.columns.filter(c => c.type === 'numeric');

  if (!isOpen) return null;

  const handleExecute = () => {
    setErrorMsg(null);
    if (!sourceCol) {
      setErrorMsg('Seleccione una columna de origen.');
      return;
    }

    try {
      const srcDef = worksheet.columns.find(c => c.id === sourceCol)!;
      const rawVals = worksheet.rows.map(r => r[sourceCol]);
      const cleanNums = rawVals
        .map(v => (v !== null && v !== undefined && v !== '' ? Number(v) : NaN))
        .filter(v => !isNaN(v));

      if (cleanNums.length === 0) {
        throw new Error('La columna seleccionada no contiene números válidos.');
      }

      const mean = cleanNums.reduce((a, b) => a + b, 0) / cleanNums.length;
      const ss = cleanNums.reduce((a, b) => a + (b - mean) ** 2, 0);
      const stdDev = cleanNums.length > 1 ? Math.sqrt(ss / (cleanNums.length - 1)) : 1;

      const newColId = `C${worksheet.columns.length + 1}`;
      const newCol = {
        id: newColId,
        name: targetColName.trim() || `Transf_${srcDef.name}`,
        type: 'numeric' as const,
        width: 120
      };

      const newRows = worksheet.rows.map(row => {
        const val = row[sourceCol];
        let transformedVal: number | null = null;

        if (val !== null && val !== undefined && val !== '') {
          const num = Number(val);
          if (!isNaN(num)) {
            if (transformType === 'standardize') {
              transformedVal = stdDev > 0 ? (num - mean) / stdDev : 0;
            } else if (transformType === 'log') {
              transformedVal = num > 0 ? Math.log(num) : null;
            } else if (transformType === 'sqrt') {
              transformedVal = num >= 0 ? Math.sqrt(num) : null;
            } else if (transformType === 'power2') {
              transformedVal = num * num;
            } else if (transformType === 'add_cols' && secondCol) {
              const val2 = Number(row[secondCol]);
              transformedVal = !isNaN(val2) ? num + val2 : null;
            }
          }
        }

        return {
          ...row,
          [newColId]: transformedVal !== null ? Math.round(transformedVal * 10000) / 10000 : null
        };
      });

      onUpdateWorksheet({
        ...worksheet,
        columns: [...worksheet.columns, newCol],
        rows: newRows,
        updatedAt: new Date().toISOString()
      });

      onAddSessionEntry({
        id: `calc_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Transformación de Datos (${newCol.name})`,
        type: 'system',
        summaryText: `Se creó la columna ${newColId} (${newCol.name}) mediante la transformación ${transformType} aplicada a ${srcDef.name}.\nTotal de filas procesadas: ${newRows.length}.`
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la transformación de datos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Calculadora y Transformación de Datos</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">Tipo de Transformación:</label>
            <select
              value={transformType}
              onChange={e => setTransformType(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-sans"
            >
              <option value="standardize">Estandarización Z-Score (Media = 0, Desv.Est = 1)</option>
              <option value="log">Logaritmo Natural: ln(X)</option>
              <option value="sqrt">Raíz Cuadrada: √X</option>
              <option value="power2">Elevar al Cuadrado: X²</option>
              <option value="add_cols">Suma de dos columnas: C1 + C2</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-800">Columna de Origen (X):</label>
            <select
              value={sourceCol}
              onChange={e => setSourceCol(e.target.value)}
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

          {transformType === 'add_cols' && (
            <div>
              <label className="block font-semibold mb-1 text-slate-800">Segunda Columna:</label>
              <select
                value={secondCol}
                onChange={e => setSecondCol(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
              >
                <option value="">-- Seleccionar Segunda Columna --</option>
                {numericCols.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id}: {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Nombre de la Nueva Columna Resultado:
            </label>
            <input
              type="text"
              value={targetColName}
              onChange={e => setTargetColName(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-sans"
            />
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
            onClick={handleExecute}
            disabled={!sourceCol}
            className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Calcular y Añadir Columna</span>
          </button>
        </div>
      </div>
    </div>
  );
};
