import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorksheetData, SessionEntry } from './types';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { parseCSVToWorksheet, exportWorksheetToCSV } from './utils/worksheet';
import { useWorksheetHistory } from './hooks/useWorksheetHistory';
import { Navbar } from './components/Navbar';
import { StatusBar } from './components/StatusBar';
import { WorksheetGrid } from './components/WorksheetGrid';
import { SessionWindow } from './components/SessionWindow';
import { ProjectNavigator } from './components/ProjectNavigator';
import { ChartViewer, ChartViewData } from './components/ChartViewer';

// Modals
import { DescriptiveStatsModal } from './components/modals/DescriptiveStatsModal';
import { TTestModal } from './components/modals/TTestModal';
import { AnovaModal } from './components/modals/AnovaModal';
import { RegressionModal } from './components/modals/RegressionModal';
import { ControlChartModal } from './components/modals/ControlChartModal';
import { CapabilityModal } from './components/modals/CapabilityModal';
import { CorrelationModal } from './components/modals/CorrelationModal';
import { DataTransformModal } from './components/modals/DataTransformModal';
import { FirebaseModal } from './components/modals/FirebaseModal';

import {
  Split,
  Terminal,
  FileSpreadsheet,
  BarChart2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  // Load initial dataset with Undo/Redo State Management
  const {
    worksheet,
    setWorksheet,
    resetWorksheet,
    undo,
    redo,
    canUndo,
    canRedo,
    pastLength,
    futureLength
  } = useWorksheetHistory(SAMPLE_DATASETS[0].data);

  // Initial welcome and descriptive session entry
  const [sessionEntries, setSessionEntries] = useState<SessionEntry[]>([
    {
      id: 'welcome_1',
      timestamp: new Date().toLocaleTimeString(),
      title: 'Bienvenido a ITPA Estudio estadístico',
      type: 'system',
      summaryText: `ITPA Estudio estadístico - Plataforma de Control de Calidad y Análisis de Datos\n` +
        `Instituto Tecnológico de Pabellón de Arteaga (TecNM)\n` +
        `------------------------------------------------------------------------------------\n` +
        `Hoja de trabajo activa: "${SAMPLE_DATASETS[0].name}"\n` +
        `Variables disponibles: ${SAMPLE_DATASETS[0].data.columns.map(c => c.name).join(', ')}\n\n` +
        `Módulos de análisis estadístico en la barra superior:\n` +
        `• Estadística Descriptiva (Media, Desviación Estándar, Cuartiles, Histogramas)\n` +
        `• Pruebas de Hipótesis (Prueba T de 1 muestra, 2 muestras independientes y pareadas)\n` +
        `• ANOVA de un Factor con descomposición de varianzas y valores P exactos\n` +
        `• Modelos de Regresión Lineal Simple y Múltiple\n` +
        `• Control Estadístico de Procesos SPC (Gráficos Xbarra-R, I-MR, Gráficos P de atributos)\n` +
        `• Análisis de Capacidad de Procesos (Índices Cp, Cpk, Pp, Ppk, PPM)\n` +
        `• Sincronización en la nube con Firebase Firestore\n` +
        `• Historial de Deshacer y Rehacer (Undo / Redo con Ctrl+Z y Ctrl+Y)`
    }
  ]);

  const handleAddSessionEntry = useCallback((entry: SessionEntry) => {
    setSessionEntries(prev => [...prev, entry]);
  }, []);

  // Selected column and row for grid highlight & direct calculator insertion
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Insert single calculated value into currently selected cell (or top of selected column)
  const handleInsertValueToCell = useCallback((value: number | string) => {
    let targetColId = selectedColumnId;
    if (!targetColId && worksheet.columns.length > 0) {
      targetColId = worksheet.columns[0].id;
    }
    if (!targetColId) return;

    const targetRow = selectedRowIndex !== null && selectedRowIndex !== undefined ? selectedRowIndex : 0;
    const newRows = [...worksheet.rows];

    // Ensure rows array has enough elements
    while (newRows.length <= targetRow) {
      newRows.push({});
    }

    newRows[targetRow] = {
      ...newRows[targetRow],
      [targetColId]: value
    };

    setWorksheet({
      ...worksheet,
      rows: newRows,
      updatedAt: new Date().toISOString()
    });

    handleAddSessionEntry({
      id: `calc_insert_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Valor Insertado en Hoja de Trabajo',
      type: 'system',
      summaryText: `Se insertó el valor [${value}] en la columna ${targetColId}, renglón ${targetRow + 1}.`
    });
  }, [selectedColumnId, selectedRowIndex, worksheet, setWorksheet, handleAddSessionEntry]);

  // Insert generated data / array into a new column or overwrite an existing column
  const handleInsertColumnData = useCallback((columnName: string, data: (number | string)[], overwriteColId?: string) => {
    let targetColId = overwriteColId;
    let newColumns = [...worksheet.columns];

    if (!targetColId) {
      const nextIndex = newColumns.length + 1;
      targetColId = `C${nextIndex}`;
      newColumns.push({
        id: targetColId,
        name: columnName || `Columna_${nextIndex}`,
        type: typeof data[0] === 'number' ? 'numeric' : 'text'
      });
    } else {
      newColumns = newColumns.map(c => (c.id === targetColId ? { ...c, name: columnName || c.name } : c));
    }

    const rowCount = Math.max(worksheet.rows.length, data.length);
    const newRows = Array.from({ length: rowCount }, (_, i) => {
      const existing = worksheet.rows[i] || {};
      return {
        ...existing,
        [targetColId as string]: i < data.length ? data[i] : null
      };
    });

    setWorksheet({
      ...worksheet,
      columns: newColumns,
      rows: newRows,
      updatedAt: new Date().toISOString()
    });

    setSelectedColumnId(targetColId);

    handleAddSessionEntry({
      id: `rnd_col_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: 'Datos Generados en Hoja',
      type: 'system',
      summaryText: `Se cargaron ${data.length} valores en la columna [${targetColId}: ${columnName}].`
    });
  }, [worksheet, setWorksheet, handleAddSessionEntry]);

  // Sidebar toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chart Viewer State
  const [activeChart, setActiveChart] = useState<ChartViewData | null>(null);

  // Layout states: 'split' (Session top, Worksheet bottom), 'session_only', 'worksheet_only'
  const [layoutMode, setLayoutMode] = useState<'split' | 'session_only' | 'worksheet_only'>('split');

  // Modals Visibility
  const [isDescOpen, setIsDescOpen] = useState(false);
  const [isTTestOpen, setIsTTestOpen] = useState(false);
  const [isAnovaOpen, setIsAnovaOpen] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isSpcOpen, setIsSpcOpen] = useState(false);
  const [isCapOpen, setIsCapOpen] = useState(false);
  const [isCorrOpen, setIsCorrOpen] = useState(false);
  const [isTransformOpen, setIsTransformOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);

  // Hidden File Input Ref for CSV Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearSession = () => {
    setSessionEntries([]);
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const ok = undo();
      if (ok) {
        handleAddSessionEntry({
          id: `undo_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Acción Deshecha (Undo)',
          type: 'system',
          summaryText: `Se revirtió el último cambio en la hoja de trabajo "${worksheet.title}".`
        });
      }
    }
  }, [canUndo, undo, worksheet.title, handleAddSessionEntry]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const ok = redo();
      if (ok) {
        handleAddSessionEntry({
          id: `redo_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          title: 'Acción Rehecha (Redo)',
          type: 'system',
          summaryText: `Se restauró la acción previa en la hoja de trabajo "${worksheet.title}".`
        });
      }
    }
  }, [canRedo, redo, worksheet.title, handleAddSessionEntry]);

  // Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y / Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in modal text input / textarea
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      
      // If editing cell in grid table, let table handle it
      if (target?.closest('#worksheet-grid-wrapper table')) {
        return;
      }

      // If in a modal input, let browser do default input undo
      if (isInput) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  const handleNewWorksheet = () => {
    if (confirm('¿Desea crear una nueva hoja de trabajo vacía? Los datos no guardados se perderán.')) {
      const newWs: WorksheetData = {
        id: `ws_${Date.now()}`,
        title: 'Hoja de Trabajo 1',
        columns: [
          { id: 'C1', name: 'Var1', type: 'numeric', width: 100 },
          { id: 'C2', name: 'Var2', type: 'numeric', width: 100 },
          { id: 'C3', name: 'Grupo', type: 'text', width: 100 }
        ],
        rows: Array.from({ length: 25 }, () => ({
          C1: null,
          C2: null,
          C3: null
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      resetWorksheet(newWs);
      handleAddSessionEntry({
        id: `sys_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: 'Nueva Hoja de Trabajo Creada',
        type: 'system',
        summaryText: `Se ha inicializado una hoja de trabajo vacía con 3 columnas y 25 filas.`
      });
    }
  };

  const handleOpenImportCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const ws = parseCSVToWorksheet(text, file.name.replace(/\.[^/.]+$/, ''));
          resetWorksheet(ws);
          handleAddSessionEntry({
            id: `import_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            title: `Archivo CSV Importado: ${file.name}`,
            type: 'system',
            summaryText: `Se importó exitosamente "${file.name}".\nVariables: ${ws.columns.map(c => c.name).join(', ')}\nTotal de filas: ${ws.rows.length}.`
          });
        } catch (err: any) {
          alert('Error al leer el archivo CSV: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    exportWorksheetToCSV(worksheet);
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('session-window-content');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let position = 0;
      let heightLeft = pdfHeight;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ITPA_Reporte_Estadistico_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  const handleLoadSampleDataset = (ds: WorksheetData) => {
    resetWorksheet(ds);
    handleAddSessionEntry({
      id: `sample_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title: `Conjunto de Datos Cargado: ${ds.title}`,
      type: 'system',
      summaryText: `Se cargó el conjunto de muestra "${ds.title}".\nColumnas: ${ds.columns.map(c => c.name).join(', ')}\nFilas: ${ds.rows.length}.`
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f1f3f6] font-sans text-slate-800 overflow-hidden select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt,.tsv"
        className="hidden"
      />

      {/* Top Application Navbar */}
      <Navbar
        onNewWorksheet={handleNewWorksheet}
        onOpenImportCSV={handleOpenImportCSV}
        onExportCSV={handleExportCSV}
        onLoadSampleDataset={handleLoadSampleDataset}
        onOpenDescriptiveStats={() => setIsDescOpen(true)}
        onOpenTTest={() => setIsTTestOpen(true)}
        onOpenAnova={() => setIsAnovaOpen(true)}
        onOpenRegression={() => setIsRegOpen(true)}
        onOpenSPC={() => setIsSpcOpen(true)}
        onOpenCapability={() => setIsCapOpen(true)}
        onOpenCorrelation={() => setIsCorrOpen(true)}
        onOpenDataTransform={() => setIsTransformOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseOpen(true)}
        onOpenQuickHistogram={() => setIsDescOpen(true)}
        onOpenQuickBoxplot={() => setIsDescOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Main Workspace Layout with Left Main Panel and Right Project Navigator */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Section: Session Window + Worksheet Grid */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-300">
          {/* Subheader bar for Window View switching */}
          <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-medium">Vistas:</span>
              <div className="flex items-center bg-white p-0.5 rounded border border-slate-300 shadow-2xs">
                <button
                  onClick={() => setLayoutMode('split')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                    layoutMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Vista Dividida (Sesión y Hoja de Datos)"
                >
                  <Split className="w-3 h-3" />
                  <span>Dividida</span>
                </button>
                <button
                  onClick={() => setLayoutMode('session_only')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                    layoutMode === 'session_only' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Solo Ventana de Sesión (Resultados)"
                >
                  <Terminal className="w-3 h-3" />
                  <span>Sesión</span>
                </button>
                <button
                  onClick={() => setLayoutMode('worksheet_only')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                    layoutMode === 'worksheet_only' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Solo Hoja de Trabajo (Datos)"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Hoja de Trabajo</span>
                </button>
              </div>
            </div>

            {activeChart && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveChart(activeChart)}
                  className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center space-x-1 hover:bg-blue-100 transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Gráfico: {activeChart.title}</span>
                </button>
              </div>
            )}
          </div>

          {/* Core Content Container */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {layoutMode === 'split' ? (
              <div className="flex-1 flex flex-col min-h-0 divide-y divide-slate-300">
                {/* Session Window Section (Upper) */}
                <section className="h-[40%] min-h-[140px] bg-white flex flex-col overflow-hidden">
                  <SessionWindow
                    entries={sessionEntries}
                    onClearSession={handleClearSession}
                    onShowChart={chart => setActiveChart(chart)}
                  />
                </section>

                {/* Worksheet Grid Section (Lower) */}
                <section className="flex-1 bg-white overflow-hidden flex flex-col">
                  <WorksheetGrid
                    worksheet={worksheet}
                    onUpdateWorksheet={setWorksheet}
                    selectedColumnId={selectedColumnId}
                    selectedRowIndex={selectedRowIndex}
                    onSelectColumn={setSelectedColumnId}
                    onSelectRow={setSelectedRowIndex}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                  />
                </section>
              </div>
            ) : layoutMode === 'session_only' ? (
              <section className="flex-1 bg-white flex flex-col overflow-hidden">
                <SessionWindow
                  entries={sessionEntries}
                  onClearSession={handleClearSession}
                  onShowChart={chart => setActiveChart(chart)}
                />
              </section>
            ) : (
              <section className="flex-1 bg-white overflow-hidden flex flex-col">
                <WorksheetGrid
                  worksheet={worksheet}
                  onUpdateWorksheet={setWorksheet}
                  selectedColumnId={selectedColumnId}
                  selectedRowIndex={selectedRowIndex}
                  onSelectColumn={setSelectedColumnId}
                  onSelectRow={setSelectedRowIndex}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                />
              </section>
            )}
          </div>
        </div>

        {/* Right Section: Project Navigator Sidebar */}
        {isSidebarOpen && (
          <ProjectNavigator
            currentWorksheet={worksheet}
            onSelectSampleDataset={handleLoadSampleDataset}
            onNewWorksheet={handleNewWorksheet}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onOpenFirebase={() => setIsFirebaseOpen(true)}
            sessionEntries={sessionEntries}
            onShowChart={chart => setActiveChart(chart)}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            undoCount={pastLength}
            redoCount={futureLength}
            selectedColumnId={selectedColumnId}
            selectedRowIndex={selectedRowIndex}
            onInsertValueToCell={handleInsertValueToCell}
            onInsertColumnData={handleInsertColumnData}
          />
        )}

        {/* Floating / Pop-out Chart Viewer Modal */}
        {activeChart && (
          <ChartViewer
            chartView={activeChart}
            onClose={() => setActiveChart(null)}
          />
        )}
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        worksheet={worksheet}
        activeEntriesCount={sessionEntries.length}
      />

      {/* Statistical Analysis Modals */}
      <DescriptiveStatsModal
        isOpen={isDescOpen}
        onClose={() => setIsDescOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
        onShowChart={chart => setActiveChart(chart)}
      />

      <TTestModal
        isOpen={isTTestOpen}
        onClose={() => setIsTTestOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
      />

      <AnovaModal
        isOpen={isAnovaOpen}
        onClose={() => setIsAnovaOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
      />

      <RegressionModal
        isOpen={isRegOpen}
        onClose={() => setIsRegOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
        onShowChart={chart => setActiveChart(chart)}
      />

      <ControlChartModal
        isOpen={isSpcOpen}
        onClose={() => setIsSpcOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
        onShowChart={chart => setActiveChart(chart)}
      />

      <CapabilityModal
        isOpen={isCapOpen}
        onClose={() => setIsCapOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
        onShowChart={chart => setActiveChart(chart)}
      />

      <CorrelationModal
        isOpen={isCorrOpen}
        onClose={() => setIsCorrOpen(false)}
        worksheet={worksheet}
        onAddSessionEntry={handleAddSessionEntry}
      />

      <DataTransformModal
        isOpen={isTransformOpen}
        onClose={() => setIsTransformOpen(false)}
        worksheet={worksheet}
        onUpdateWorksheet={setWorksheet}
        onAddSessionEntry={handleAddSessionEntry}
      />

      <FirebaseModal
        isOpen={isFirebaseOpen}
        onClose={() => setIsFirebaseOpen(false)}
        currentWorksheet={worksheet}
        onLoadWorksheet={resetWorksheet}
        onAddSessionEntry={handleAddSessionEntry}
      />
    </div>
  );
}

