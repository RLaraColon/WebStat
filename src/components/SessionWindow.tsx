import React, { useState } from 'react';
import { SessionEntry } from '../types';
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  Download,
  FileText,
  Maximize2,
  Minimize2,
  BarChart2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SessionWindowProps {
  entries: SessionEntry[];
  onClearSession: () => void;
  onShowChart?: (chartData: any) => void;
}

export const SessionWindow: React.FC<SessionWindowProps> = ({
  entries,
  onClearSession,
  onShowChart
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [collapsedEntries, setCollapsedEntries] = useState<Record<string, boolean>>({});
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const toggleCollapse = (id: string) => {
    setCollapsedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportAllAsText = () => {
    const fullLog = entries
      .map(e => `====================================================\n[${e.timestamp}] ${e.title}\n====================================================\n${e.summaryText}\n\n`)
      .join('\n');
    const blob = new Blob([fullLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITPA_Estadistica_Sesion_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSessionPDF = async () => {
    const el = document.getElementById('session-window-content');
    if (!el) return;
    try {
      setIsExportingPDF(true);
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
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div
      id="session-window-container"
      className={`flex flex-col bg-white overflow-hidden transition-all duration-200 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-lg shadow-2xl border border-slate-300' : 'h-full'
      }`}
    >
      {/* Session Window Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 select-none">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-700" />
            <span>Ventana de Sesión (Resultados)</span>
          </span>
          <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.2 rounded font-mono">
            {entries.length} ejecuciones
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={exportAllAsText}
            title="Exportar resultados como texto (.txt)"
            disabled={entries.length === 0}
            className="flex items-center space-x-1 px-2 py-0.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 disabled:opacity-40 transition-colors shadow-2xs"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline text-[11px]">TXT</span>
          </button>

          <button
            onClick={exportSessionPDF}
            title="Exportar a PDF profesional"
            disabled={entries.length === 0 || isExportingPDF}
            className="flex items-center space-x-1 px-2 py-0.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 disabled:opacity-40 transition-colors shadow-2xs"
          >
            <FileText className="w-3 h-3 text-rose-500" />
            <span className="hidden sm:inline text-[11px]">{isExportingPDF ? 'Generando...' : 'PDF'}</span>
          </button>

          <button
            onClick={onClearSession}
            title="Limpiar registro de sesión"
            disabled={entries.length === 0}
            className="p-1 text-slate-500 hover:text-rose-600 bg-white hover:bg-slate-50 rounded border border-slate-300 disabled:opacity-40 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restaurar tamaño' : 'Maximizar ventana'}
            className="p-1 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-2xs"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Session Window Output Content */}
      <div
        id="session-window-content"
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[11px] leading-tight text-slate-700 bg-white selection:bg-blue-100 selection:text-blue-900"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-slate-400 space-y-2">
            <Terminal className="w-7 h-7 stroke-[1.5] text-slate-300" />
            <p className="text-xs font-sans font-semibold text-slate-500">Sin análisis ejecutados aún</p>
            <p className="text-[11px] font-sans text-slate-400 max-w-sm text-center">
              Seleccione una función estadística del menú o barra superior (Descriptive Stats, ANOVA, Regresión, SPC) para generar resultados aquí.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const isCollapsed = collapsedEntries[entry.id];
            return (
              <div
                key={entry.id}
                id={`session-entry-${entry.id}`}
                className="border border-slate-200 bg-slate-50/40 rounded-md overflow-hidden shadow-2xs"
              >
                {/* Entry header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-xs">
                  <button
                    onClick={() => toggleCollapse(entry.id)}
                    className="flex items-center space-x-1.5 text-blue-800 font-bold hover:text-blue-950 text-left"
                  >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    <span>&gt; {entry.title}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>

                    {entry.chartData && onShowChart && (
                      <button
                        onClick={() => onShowChart(entry.chartData)}
                        className="flex items-center space-x-1 px-2 py-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors font-medium"
                        title="Ver gráfico interactivo"
                      >
                        <BarChart2 className="w-3 h-3 text-blue-600" />
                        <span>Ver Gráfico</span>
                      </button>
                    )}

                    <button
                      onClick={() => copyToClipboard(entry.summaryText, entry.id)}
                      className="p-1 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors"
                      title="Copiar texto de resultados"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Entry text body */}
                {!isCollapsed && (
                  <div className="p-3 text-slate-800 whitespace-pre overflow-x-auto text-[11px] leading-5 font-mono bg-white">
                    {entry.summaryText}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
