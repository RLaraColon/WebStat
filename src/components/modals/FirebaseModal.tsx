import React, { useState, useEffect } from 'react';
import { FirebaseConfig, WorksheetData, SessionEntry } from '../../types';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  listWorksheetsCloud,
  saveWorksheetCloud,
  deleteWorksheetCloud
} from '../../services/firebase';
import {
  Cloud,
  Database,
  Key,
  Check,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
  Shield,
  FolderOpen
} from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorksheet: WorksheetData;
  onLoadWorksheet: (ws: WorksheetData) => void;
  onAddSessionEntry: (entry: SessionEntry) => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  currentWorksheet,
  onLoadWorksheet,
  onAddSessionEntry
}) => {
  const [activeTab, setActiveTab] = useState<'save_load' | 'config'>('save_load');
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const [savedProjects, setSavedProjects] = useState<WorksheetData[]>([]);
  const [sourceMode, setSourceMode] = useState<'firestore' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedFirebaseConfig();
      if (saved) {
        setConfig(saved);
      }
      loadProjectsList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadProjectsList = async () => {
    setIsLoading(true);
    try {
      const { worksheets, source } = await listWorksheetsCloud();
      setSavedProjects(worksheets);
      setSourceMode(source);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrent = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await saveWorksheetCloud(currentWorksheet);
      setStatusMessage({
        text: res.message,
        type: 'success'
      });
      onAddSessionEntry({
        id: `cloud_save_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        title: `Proyecto Guardado en la Nube (${currentWorksheet.title})`,
        type: 'system',
        summaryText: `El proyecto '${currentWorksheet.title}' (${currentWorksheet.columns.length} variables, ${currentWorksheet.rows.length} filas) fue almacenado satisfactoriamente.\nMétodo: ${res.mode === 'firestore' ? 'Firebase Firestore (Plan Spark)' : 'Almacenamiento Local Seguro'}`
      });
      await loadProjectsList();
    } catch (err: any) {
      setStatusMessage({
        text: `Error al guardar: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      setStatusMessage({ text: 'Por favor complete al menos el API Key y Project ID.', type: 'error' });
      return;
    }
    saveFirebaseConfig(config);
    setStatusMessage({
      text: 'Credenciales de Firebase guardadas. Se utilizará su colección de Firestore (Plan Gratuito Spark).',
      type: 'success'
    });
    loadProjectsList();
  };

  const handleClearConfig = () => {
    clearFirebaseConfig();
    setConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    setStatusMessage({ text: 'Credenciales eliminadas. Se utilizará almacenamiento local del navegador.', type: 'info' });
    loadProjectsList();
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar la hoja de trabajo '${title}'?`)) return;
    await deleteWorksheetCloud(id);
    loadProjectsList();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e3a8a] text-white">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-sky-300" />
            <h3 className="font-semibold text-sm">Persistencia en la Nube (Firebase Firestore - Spark Plan)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded text-blue-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('save_load')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'save_load'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Hojas de Trabajo y Proyectos
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Credenciales de Firebase (Plan Gratuito)
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs text-slate-700 max-h-[460px] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-2.5 rounded text-xs border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {activeTab === 'save_load' ? (
            <div className="space-y-4">
              {/* Active Sheet Card */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Hoja de Trabajo Activa:</div>
                  <div className="text-sm font-bold text-slate-800">{currentWorksheet.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currentWorksheet.columns.length} Columnas • {currentWorksheet.rows.length} Filas
                  </div>
                </div>
                <button
                  onClick={handleSaveCurrent}
                  disabled={isLoading}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Guardando...' : 'Guardar en la Nube'}</span>
                </button>
              </div>

              {/* Projects List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">
                    Proyectos Disponibles ({sourceMode === 'firestore' ? 'Firebase Firestore' : 'Almacenamiento Local'}):
                  </span>
                  <button
                    onClick={loadProjectsList}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-md divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
                  {savedProjects.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No hay proyectos guardados aún. Guarde su hoja de trabajo actual arriba.
                    </div>
                  ) : (
                    savedProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{proj.title}</div>
                          <div className="text-[10.5px] text-slate-400 font-mono">
                            {proj.columns.length} Cols • {proj.rows.length} Filas • Actualizado: {new Date(proj.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              onLoadWorksheet(proj);
                              onClose();
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded border border-slate-200 font-medium text-xs transition-colors"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Abrir</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id, proj.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
              <div className="bg-sky-50 border border-sky-200 p-3 rounded text-sky-900 text-xs leading-relaxed">
                <strong>Configuración del Plan Gratuito (Spark Plan):</strong>
                <p className="mt-1">
                  Ingrese las credenciales de su proyecto Firebase desde la Consola de Firebase (Configuración del proyecto &gt; SDK web). Todas las lecturas y escrituras se ejecutan dentro del límite diario gratuito (1 GiB, 50k lecturas/día) con <strong>costo $0</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">API Key:</label>
                  <input
                    type="text"
                    value={config.apiKey}
                    onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Project ID:</label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={e => setConfig({ ...config, projectId: e.target.value })}
                    placeholder="mi-proyecto-webstat"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">Auth Domain:</label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={e => setConfig({ ...config, authDomain: e.target.value })}
                    placeholder="mi-proyecto.firebaseapp.com"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-800">App ID:</label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={e => setConfig({ ...config, appId: e.target.value })}
                    placeholder="1:123456789:web:abcdef"
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleClearConfig}
                  className="text-rose-600 hover:text-rose-700 font-medium"
                >
                  Restablecer / Usar Local
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Credenciales</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 bg-slate-100 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded font-medium text-xs shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
