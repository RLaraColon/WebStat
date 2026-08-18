import React, { useState } from 'react';
import { WorksheetData, SessionEntry } from '../types';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import {
  Folder,
  FileSpreadsheet,
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Download,
  FileText,
  ChevronRight,
  Plus,
  Undo2,
  Redo2,
  History,
  Calculator as CalcIcon,
  Sparkles
} from 'lucide-react';
import { ChartViewData } from './ChartViewer';
import { ScientificToolbox } from './ScientificToolbox';

interface ProjectNavigatorProps {
  currentWorksheet: WorksheetData;
  onSelectSampleDataset: (dataset: WorksheetData) => void;
  onNewWorksheet: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onOpenFirebase: () => void;
  sessionEntries: SessionEntry[];
  onShowChart?: (chart: ChartViewData) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoCount?: number;
  redoCount?: number;
  selectedColumnId?: string | null;
  selectedRowIndex?: number | null;
  onInsertValueToCell?: (value: number | string) => void;
  onInsertColumnData?: (columnName: string, data: (number | string)[], overwriteColId?: string) => void;
}

export const ProjectNavigator: React.FC<ProjectNavigatorProps> = ({
  currentWorksheet,
  onSelectSampleDataset,
  onNewWorksheet,
  onExportCSV,
  onExportPDF,
  onOpenFirebase: _onOpenFirebase,
  sessionEntries,
  onShowChart,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoCount = 0,
  redoCount = 0,
  selectedColumnId = null,
  selectedRowIndex = null,
  onInsertValueToCell = () => {},
  onInsertColumnData = () => {}
}) => {
  const [sidebarMode, setSidebarMode] = useState<'explorer' | 'calculator'>('calculator');

  // Extract chart entries
  const recentCharts = sessionEntries
    .filter(e => e.chartData)
    .map(e => e.chartData as ChartViewData)
    .slice(-6);

  return (
    <aside
      id="project-navigator"
      className="w-80 bg-white flex flex-col border-l border-slate-300 shadow-xs h-full overflow-hidden select-none flex-shrink-0"
    >
      {/* Top Header Mode Tabs */}
      <div className="p-1.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-1">
        <button
          onClick={() => setSidebarMode('calculator')}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
            sidebarMode === 'calculator'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
          }`}
          title="Herramientas de cálculo científico, conversor, constantes y números aleatorios"
        >
          <CalcIcon className="w-3.5 h-3.5" />
          <span>Calculadora</span>
          <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${sidebarMode === 'calculator' ? 'bg-blue-700 text-sky-200' : 'bg-slate-200 text-slate-600'}`}>
            PRO
          </span>
        </button>

        <button
          onClick={() => setSidebarMode('explorer')}
          className={`flex-1 py-1.5 px-2 rounded flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
            sidebarMode === 'explorer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
          }`}
          title="Explorador de archivos, hojas de trabajo, variables y gráficos"
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Explorador</span>
        </button>
      </div>

      {/* Main Mode Content */}
      {sidebarMode === 'calculator' ? (
        <ScientificToolbox
          worksheet={currentWorksheet}
          selectedColumnId={selectedColumnId}
          selectedRowIndex={selectedRowIndex}
          onInsertValueToCell={onInsertValueToCell}
          onInsertColumnData={onInsertColumnData}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {/* Worksheets Section */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <div className="flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hojas de Trabajo</span>
                </div>
                <button
                  onClick={onNewWorksheet}
                  className="p-0.5 hover:bg-slate-100 text-slate-500 hover:text-blue-700 rounded transition-colors cursor-pointer"
                  title="Nueva Hoja"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <ul className="space-y-1">
                {/* Active Worksheet */}
                <li className="flex items-center justify-between text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-1.5 rounded font-medium shadow-2xs">
                  <div className="flex items-center space-x-1.5 truncate">
                    <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                    <span className="truncate">{currentWorksheet.title}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-mono flex-shrink-0 ml-1">
                    {currentWorksheet.rows.length}R × {currentWorksheet.columns.length}C
                  </span>
                </li>

                {/* Other Sample Datasets available */}
                {SAMPLE_DATASETS.filter(ds => ds.name !== currentWorksheet.title).map((ds, idx) => (
                  <li
                    key={idx}
                    onClick={() => onSelectSampleDataset(ds.data)}
                    className="flex items-center justify-between text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-2 py-1.5 rounded cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                      <span className="truncate">{ds.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Undo / Redo History Card */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5 text-blue-700" />
                  <span>Historial de Estados</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {undoCount} prev / {redoCount} sig
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  disabled={!canUndo}
                  onClick={onUndo}
                  className={`py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center space-x-1 border transition-colors ${
                    canUndo
                      ? 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200 shadow-2xs cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Deshacer última modificación (Ctrl+Z)"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Deshacer</span>
                </button>
                <button
                  disabled={!canRedo}
                  onClick={onRedo}
                  className={`py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center space-x-1 border transition-colors ${
                    canRedo
                      ? 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200 shadow-2xs cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title="Rehacer modificación (Ctrl+Y)"
                >
                  <Redo2 className="w-3 h-3" />
                  <span>Rehacer</span>
                </button>
              </div>
            </div>

            {/* Saved / Generated Charts Section */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Gráficos Generados ({recentCharts.length})</span>
              </div>

              {recentCharts.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded border border-slate-200/80 text-center text-[11px] text-slate-400">
                  Ejecute un análisis estadístico para generar gráficos interactivos.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {recentCharts.map((chart, idx) => (
                    <div
                      key={idx}
                      onClick={() => onShowChart && onShowChart(chart)}
                      className="aspect-square bg-slate-50 hover:bg-blue-50/60 rounded border border-slate-200 hover:border-blue-300 p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-2xs"
                      title={`Abrir gráfico: ${chart.title}`}
                    >
                      <div className="h-7 w-7 mb-1 flex items-center justify-center text-blue-600 bg-white rounded-full shadow-2xs group-hover:scale-110 transition-transform">
                        {chart.type === 'histogram' ? (
                          <BarChart2 className="w-4 h-4" />
                        ) : chart.type === 'regression' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : chart.type === 'spc' ? (
                          <Activity className="w-4 h-4" />
                        ) : (
                          <Layers className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-700 group-hover:text-blue-700 line-clamp-2 leading-tight">
                        {chart.variableName || chart.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Variables Inspector */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Variables en Hoja</span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto bg-slate-50 p-1.5 rounded border border-slate-200/80 text-[11px] font-mono">
                {currentWorksheet.columns.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-slate-600 py-0.5 px-1 hover:bg-white rounded">
                    <span className="font-semibold text-blue-800">{c.id}</span>
                    <span className="text-slate-800 font-sans truncate max-w-[110px]">{c.name}</span>
                    <span className="text-[9px] uppercase px-1 bg-slate-200 text-slate-600 rounded">
                      {c.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Quick Action Buttons */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
            <button
              onClick={onExportPDF}
              className="w-full py-2 bg-slate-800 text-white text-[11px] font-bold rounded hover:bg-slate-700 uppercase tracking-tight shadow-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Exportar Reporte PDF</span>
            </button>

            <button
              onClick={onExportCSV}
              className="w-full py-2 border border-slate-300 text-slate-700 bg-white text-[11px] font-bold rounded hover:bg-slate-100 uppercase tracking-tight flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

