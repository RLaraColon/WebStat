import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart2,
  FileSpreadsheet,
  FolderOpen,
  Save,
  Download,
  Upload,
  Layers,
  TrendingUp,
  Activity,
  Gauge,
  Grid,
  Calculator,
  HelpCircle,
  Plus,
  Cloud,
  ChevronDown,
  Database,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Cpu,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Undo2,
  Redo2,
  RotateCcw
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { WorksheetData } from '../types';

interface NavbarProps {
  onNewWorksheet: () => void;
  onOpenImportCSV: () => void;
  onExportCSV: () => void;
  onLoadSampleDataset: (dataset: WorksheetData) => void;
  onOpenDescriptiveStats: () => void;
  onOpenTTest: () => void;
  onOpenAnova: () => void;
  onOpenRegression: () => void;
  onOpenSPC: () => void;
  onOpenCapability: () => void;
  onOpenCorrelation: () => void;
  onOpenDataTransform: () => void;
  onOpenFirebaseModal: () => void;
  onOpenQuickHistogram: () => void;
  onOpenQuickBoxplot: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewWorksheet,
  onOpenImportCSV,
  onExportCSV,
  onLoadSampleDataset,
  onOpenDescriptiveStats,
  onOpenTTest,
  onOpenAnova,
  onOpenRegression,
  onOpenSPC,
  onOpenCapability,
  onOpenCorrelation,
  onOpenDataTransform,
  onOpenFirebaseModal,
  onOpenQuickHistogram,
  onOpenQuickBoxplot,
  isSidebarOpen = true,
  onToggleSidebar,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName: string) => {
    setOpenDropdown(openDropdown === menuName ? null : menuName);
  };

  return (
    <header ref={navRef} className="flex flex-col select-none z-40 relative">
      {/* Top Application Bar - Deep Royal Navy */}
      <div className="flex items-center justify-between h-10 px-3 bg-[#1e3a8a] text-white border-b border-blue-900 shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-tight text-white flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-sky-300" />
              <span>ITPA Estudio estadístico</span>
              <span className="font-normal opacity-85 text-[11px] ml-1 bg-blue-950/80 px-1.5 py-0.5 rounded text-sky-200 border border-blue-400/30">TecNM</span>
            </span>
          </div>

          {/* Top Menu Links */}
          <nav className="flex space-x-1 sm:space-x-2 text-xs font-medium">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('file')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'file' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Archivo</span>
              </button>

              {openDropdown === 'file' && (
                <div className="absolute left-0 mt-1 w-60 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      onClick={() => { onNewWorksheet(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Nueva Hoja de Trabajo</span>
                    </button>
                    <button
                      onClick={() => { onOpenImportCSV(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Importar Archivo CSV / TSV...</span>
                    </button>
                    <button
                      onClick={() => { onExportCSV(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Exportar Hoja a CSV</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cargar Datos de Muestra
                    </div>
                    {SAMPLE_DATASETS.map((ds, idx) => (
                      <button
                        key={idx}
                        onClick={() => { onLoadSampleDataset(ds.data); setOpenDropdown(null); }}
                        className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 text-slate-700 flex flex-col"
                      >
                        <span className="font-semibold text-slate-800">{ds.name}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[210px]">{ds.description}</span>
                      </button>
                    ))}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { onOpenFirebaseModal(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-blue-700 font-medium"
                    >
                      <Cloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Guardar / Abrir en Firestore...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('edit')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'edit' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Edición</span>
              </button>

              {openDropdown === 'edit' && (
                <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      disabled={!canUndo}
                      onClick={() => { if (onUndo && canUndo) { onUndo(); setOpenDropdown(null); } }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between font-medium ${
                        canUndo
                          ? 'hover:bg-blue-50 hover:text-blue-700 text-slate-700 cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Undo2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Deshacer</span>
                      </div>
                      <kbd className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">Ctrl+Z</kbd>
                    </button>

                    <button
                      disabled={!canRedo}
                      onClick={() => { if (onRedo && canRedo) { onRedo(); setOpenDropdown(null); } }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between font-medium ${
                        canRedo
                          ? 'hover:bg-blue-50 hover:text-blue-700 text-slate-700 cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Redo2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Rehacer</span>
                      </div>
                      <kbd className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded">Ctrl+Y</kbd>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { onOpenDataTransform(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Calculator className="w-3.5 h-3.5 text-slate-500" />
                      <span>Calcular Columna...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Stat Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('stat')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'stat' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Estadísticas</span>
              </button>

              {openDropdown === 'stat' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      onClick={() => { onOpenDescriptiveStats(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-800 font-medium"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Estadísticas Descriptivas...</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pruebas de Hipótesis
                    </div>
                    <button
                      onClick={() => { onOpenTTest(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Prueba T (1 Muestra, 2 Muestras, Pareada)</span>
                    </button>
                    <button
                      onClick={() => { onOpenCorrelation(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Grid className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Correlación de Pearson</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Modelado
                    </div>
                    <button
                      onClick={() => { onOpenAnova(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ANOVA de un Factor...</span>
                    </button>
                    <button
                      onClick={() => { onOpenRegression(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      <span>Regresión Lineal Simple y Múltiple</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quality Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('quality')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'quality' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Calidad (SPC)</span>
              </button>

              {openDropdown === 'quality' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      onClick={() => { onOpenSPC(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gráficos de Control (Xbar-R, I-MR, P-Chart)</span>
                    </button>
                    <button
                      onClick={() => { onOpenCapability(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Capacidad del Proceso (Cp / Cpk / Pp / Ppk)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Graph Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('graph')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'graph' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Gráficos</span>
              </button>

              {openDropdown === 'graph' && (
                <div className="absolute left-0 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      onClick={() => { onOpenQuickHistogram(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Histograma con Curva Normal</span>
                    </button>
                    <button
                      onClick={() => { onOpenQuickBoxplot(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Diagrama de Caja (Boxplot)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calc Menu */}
            <div className="relative">
              <button
                onClick={() => toggleMenu('calc')}
                className={`cursor-pointer hover:bg-blue-800 px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                  openDropdown === 'calc' ? 'bg-blue-800 text-white underline decoration-blue-300 decoration-2 underline-offset-4' : ''
                }`}
              >
                <span>Calc</span>
              </button>

              {openDropdown === 'calc' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (!isSidebarOpen && onToggleSidebar) onToggleSidebar();
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Calculadora Científica y Funciones</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!isSidebarOpen && onToggleSidebar) onToggleSidebar();
                        setOpenDropdown(null);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-600" />
                      <span>Generador de Datos Aleatorios</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { onOpenDataTransform(); setOpenDropdown(null); }}
                      className="w-full px-3 py-1.5 text-left hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 text-slate-700 font-medium"
                    >
                      <Grid className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Transformación y Fórmulas de Columnas...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Status & Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Zero Token Badge */}
          <div
            className="hidden sm:flex items-center space-x-1 px-2 py-0.5 bg-blue-950/60 text-sky-200 border border-blue-800/80 rounded text-[11px] font-medium"
            title="Todos los cálculos estadísticos se ejecutan 100% en el navegador de manera local y privada"
          >
            <Cpu className="w-3 h-3 text-sky-300" />
            <span>0 Tokens (Cálculo Local)</span>
          </div>

          {/* Firebase Spark Status */}
          <div
            onClick={onOpenFirebaseModal}
            className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-green-600 hover:bg-green-500 rounded-full text-[10px] text-white font-medium cursor-pointer transition-colors shadow-2xs"
            title="Conexión a la nube Firestore (Plan Spark Gratuito)"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            <span>Firebase: Conectado</span>
          </div>

          <button
            onClick={onOpenFirebaseModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs transition-all shadow-sm font-medium flex items-center space-x-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Proyecto</span>
          </button>

          <button
            onClick={() => setShowAboutModal(true)}
            className="p-1 text-blue-200 hover:text-white hover:bg-blue-800 rounded transition-colors"
            title="Acerca de ITPA Estudio estadístico"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1 text-blue-200 hover:text-white hover:bg-blue-800 rounded transition-colors"
              title={isSidebarOpen ? 'Ocultar Explorador' : 'Mostrar Explorador'}
            >
              {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Secondary Clean Action Toolbar (White Background with Slate Borders) */}
      <div className="flex items-center justify-between h-10 bg-white border-b border-slate-300 px-3 shadow-2xs z-10 text-xs">
        <div className="flex items-center space-x-3 overflow-x-auto py-1">
          {/* File Operations Group */}
          <div className="flex space-x-1 items-center border-r border-slate-200 pr-3">
            <button
              onClick={onNewWorksheet}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Nueva Hoja de Trabajo"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenImportCSV}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Importar CSV/TSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onExportCSV}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
              title="Exportar Hoja a CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Undo / Redo History Group */}
          <div className="flex space-x-1 items-center border-r border-slate-200 pr-3">
            <button
              disabled={!canUndo}
              onClick={onUndo}
              className={`p-1.5 rounded transition-colors flex items-center space-x-1 ${
                canUndo
                  ? 'hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Deshacer último cambio (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              disabled={!canRedo}
              onClick={onRedo}
              className={`p-1.5 rounded transition-colors flex items-center space-x-1 ${
                canRedo
                  ? 'hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer active:scale-95'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title="Rehacer cambio (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Main Statistical Action Group */}
          <div className="flex space-x-2 items-center">
            <button
              onClick={onOpenDescriptiveStats}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-100 rounded bg-slate-50 text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <span className="font-bold text-blue-700 font-serif">∑</span>
              <span>Estadística Descriptiva</span>
            </button>

            <button
              onClick={onOpenRegression}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <span className="font-bold text-rose-600 font-serif">R</span>
              <span>Regresión</span>
            </button>

            <button
              onClick={onOpenAnova}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <span className="font-bold text-indigo-600 font-serif">A</span>
              <span>ANOVA</span>
            </button>

            <button
              onClick={onOpenTTest}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <span className="font-bold text-amber-600 font-serif">T</span>
              <span>Prueba T</span>
            </button>

            <button
              onClick={onOpenSPC}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Control SPC</span>
            </button>

            <button
              onClick={onOpenCapability}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-slate-700 font-medium transition-colors shadow-2xs"
            >
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
              <span>Capacidad Cpk</span>
            </button>

            <button
              onClick={onOpenQuickHistogram}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-50 rounded bg-white text-blue-700 font-medium transition-colors shadow-2xs"
            >
              <BarChart2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Gráficos</span>
            </button>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-sky-300" />
                <h3 className="font-semibold text-sm">Acerca de ITPA Estudio estadístico</h3>
              </div>
              <button onClick={() => setShowAboutModal(false)} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs leading-relaxed">
              <p>
                <strong>ITPA Estudio estadístico</strong> es una plataforma de análisis estadístico y control de calidad industrial diseñada para la comunidad académica e investigadora del <strong>Instituto Tecnológico de Pabellón de Arteaga (TecNM)</strong>.
              </p>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cálculos 100% Locales en Navegador (Cero Tokens de IA)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Todos los algoritmos de inferencia (ANOVA, Regresión Lineal OLS, Pruebas T de Student, Control Estadístico SPC, Capacidad de Proceso Cpk) se procesan directamente en su equipo con máxima velocidad y privacidad.
                </p>
                <div className="flex items-center space-x-2 text-blue-700 font-semibold pt-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sincronización en la nube con Firebase Firestore</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Guarde y respalde sus hojas de trabajo y proyectos en la nube de forma segura y sin costo adicional.
                </p>
              </div>
            </div>
            <div className="flex justify-end px-4 py-3 bg-slate-100 border-t border-slate-200">
              <button
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-1.5 bg-[#1e3a8a] hover:bg-blue-700 text-white rounded font-medium text-xs shadow-2xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
