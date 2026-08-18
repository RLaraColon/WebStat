import React from 'react';
import { WorksheetData } from '../types';
import { Cpu, CheckCircle2, FileSpreadsheet, Cloud } from 'lucide-react';

interface StatusBarProps {
  worksheet: WorksheetData;
  activeEntriesCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ worksheet, activeEntriesCount }) => {
  return (
    <footer className="h-6 bg-[#f1f3f6] border-t border-slate-300 px-3 flex items-center justify-between text-[10px] text-slate-500 select-none z-30 font-sans">
      <div className="flex items-center space-x-4">
        <span className="flex items-center space-x-1">
          <span className="font-semibold text-slate-600">Proyecto:</span>
          <span>ITPA_Estadistica.ws</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center space-x-1">
          <span className="font-semibold text-slate-600">Hoja:</span>
          <span className="text-blue-700 font-medium">{worksheet.title}</span>
        </span>
        <span className="text-slate-300">|</span>
        <span className="font-mono">
          Renglones: {worksheet.rows.length} | Columnas: {worksheet.columns.length}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 text-slate-600">
          <span>CPU Local: Óptimo</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center space-x-1 font-bold text-slate-700">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span>Plan Gratuito | Motor Local (0 Tokens)</span>
        </div>
      </div>
    </footer>
  );
};
