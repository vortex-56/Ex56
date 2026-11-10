import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { 
  exportProjectToJSON,
  exportProjectToCSV, 
  exportProjectToTXT, 
  importProjectFromAnyFormat,
  triggerFileDownload,
  getExportFilename
} from '../utils/exportImport';
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Check, 
  AlertCircle, 
  Copy, 
  X,
  ClipboardPaste,
  Sparkles,
  Clock
} from 'lucide-react';

import { exportProjectFromSupabaseToTXT } from '../lib/supabaseProjects';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  onImportProject: (importedProject: Project, overwriteCurrent: boolean, rawText?: string) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onImportProject,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  // Import states
  const [importedPreview, setImportedPreview] = useState<Project | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [overwriteCurrent, setOverwriteCurrent] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [rawImportText, setRawImportText] = useState('');
  const [isPastingMode, setIsPastingMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const nowIso = new Date().toISOString();
    const updated = { ...currentProject, lastDownloadedAt: nowIso };
    onImportProject(updated, true);
    const jsonContent = exportProjectToJSON(updated);
    const filename = getExportFilename('json');
    triggerFileDownload(filename, jsonContent, 'application/json;charset=utf-8;');
  };

  const handleExportCSV = () => {
    const nowIso = new Date().toISOString();
    const updated = { ...currentProject, lastDownloadedAt: nowIso };
    onImportProject(updated, true);
    const csvContent = exportProjectToCSV(updated);
    const filename = getExportFilename('csv');
    triggerFileDownload(filename, csvContent, 'text/csv;charset=utf-8;');
  };

  const handleExportTXT = async () => {
    const nowIso = new Date().toISOString();
    const updated = { ...currentProject, lastDownloadedAt: nowIso };
    onImportProject(updated, true);

    let txtContent = '';
    try {
      // Reconstructs TXT reading from all Supabase tables
      txtContent = await exportProjectFromSupabaseToTXT(currentProject.id, updated);
    } catch {
      txtContent = exportProjectToTXT(updated);
    }

    const filename = getExportFilename('txt');
    triggerFileDownload(filename, txtContent, 'text/plain;charset=utf-8;');
  };

  const handleCopy = async (type: 'json' | 'csv' | 'txt') => {
    let content = '';
    if (type === 'json') content = exportProjectToJSON(currentProject);
    else if (type === 'csv') content = exportProjectToCSV(currentProject);
    else {
      try {
        content = await exportProjectFromSupabaseToTXT(currentProject.id, currentProject);
      } catch {
        content = exportProjectToTXT(currentProject);
      }
    }

    navigator.clipboard.writeText(content).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const processImportText = (text: string) => {
    setImportError(null);
    setImportedPreview(null);
    setRawImportText(text);
    try {
      if (!text.trim()) throw new Error('El archivo o texto está vacío');

      // Specifically check for PLANMATRIX_RAW_DATA_START / END
      const startTag = '=== PLANMATRIX_RAW_DATA_START ===';
      const endTag = '=== PLANMATRIX_RAW_DATA_END ===';
      if (text.includes(startTag) && text.includes(endTag)) {
        const jsonStr = text.split(startTag)[1].split(endTag)[0].trim();
        const parsed = JSON.parse(jsonStr);
        setImportedPreview(parsed);
        return;
      }

      const parsed = importProjectFromAnyFormat(text);
      if (!parsed.name && !parsed.id) {
        throw new Error('Estructura de proyecto no válida.');
      }
      setImportedPreview(parsed);
    } catch (err: any) {
      setImportError(err.message || 'Error al procesar el archivo o texto');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processImportText(text);
    };

    reader.onerror = () => {
      setImportError('No se pudo leer el archivo seleccionado');
    };

    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    processImportText(pastedText);
  };

  const handleConfirmImport = () => {
    if (!importedPreview) return;
    onImportProject(importedPreview, overwriteCurrent, rawImportText || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Exportar e Importar Datos (Ex56)
            </h2>
            <p className="text-xs text-slate-500">
              Guarda copias de respaldo en tu computadora o continúa tu avance en otro dispositivo.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar (Descargar)</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-500 text-amber-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar (Cargar archivo)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Selecciona el formato para descargar el proyecto como <strong>Ex56</strong> con todas las actividades vigentes, <strong>historial pasado de actividades</strong>, <strong>recursos</strong> con sus costos, y la sección de <strong>Ideas y Notas</strong>:
              </p>

              {/* Indicador de última fecha de descarga */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Última fecha de descarga guardada:
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {currentProject.lastDownloadedAt
                    ? (currentProject.lastDownloadedAt.includes('T') ? new Date(currentProject.lastDownloadedAt).toLocaleString('es-PE') : currentProject.lastDownloadedAt)
                    : 'Aún no descargado'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* JSON Full Option */}
                <div className="p-3.5 rounded-xl border-2 border-amber-400 bg-amber-50/50 hover:bg-amber-50 transition-all flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black">
                        <FileJson className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                        Recomendado
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950">Ex56 Completo (.json)</h3>
                    <p className="text-[11px] text-slate-600 mt-1 leading-tight">
                      Copia 100% íntegra con actividades, historial pasado, recursos, estados de duración y gastos.
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-amber-200">
                    <button
                      onClick={handleExportJSON}
                      className="flex-1 py-1.5 px-2 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar JSON (.json)</span>
                    </button>
                    <button
                      onClick={() => handleCopy('json')}
                      className="p-1.5 bg-white border border-amber-300 rounded-lg text-slate-700 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Copiar contenido JSON"
                    >
                      {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* CSV Option */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Formato CSV (.csv)</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                      Tablas estructuradas para Excel y Google Sheets con actividades, historial y recursos.
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-200/80">
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar CSV (.csv)</span>
                    </button>
                    <button
                      onClick={() => handleCopy('csv')}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copiar contenido CSV"
                    >
                      {copiedType === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* TXT Option */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center mb-2">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">Formato Texto (.txt)</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                      Reporte legible para bloc de notas con historial, recursos y bloque de restauración.
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-slate-200/80">
                    <button
                      onClick={handleExportTXT}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar TXT (.txt)</span>
                    </button>
                    <button
                      onClick={() => handleCopy('txt')}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copiar contenido TXT"
                    >
                      {copiedType === 'txt' ? <Check className="w-3.5 h-3.5 text-amber-800" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300/80 text-xs text-amber-950 flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cada archivo se descarga con su <strong>fecha y hora exacta</strong> (ej. <strong>Ex56_2026-11-04_16-35-12.json</strong>) para identificar siempre la copia más reciente.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Importa un archivo <strong>.csv</strong> o <strong>.txt</strong> previamente exportado:
                </p>
                <button
                  type="button"
                  onClick={() => setIsPastingMode(!isPastingMode)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>{isPastingMode ? 'Subir archivo' : 'O pegar texto directamente'}</span>
                </button>
              </div>

              {!isPastingMode ? (
                /* Upload Drop Zone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-amber-50/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    Haz clic aquí para seleccionar tu archivo CSV o TXT
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Archivos soportados: .csv, .txt, .json
                  </div>
                </div>
              ) : (
                /* Direct Paste Text Area */
                <div className="space-y-2">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Pega aquí el contenido copiado de tu archivo CSV o TXT..."
                    rows={6}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim()}
                    className="w-full py-2 px-4 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 disabled:opacity-50 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    Procesar Texto Pegado
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview Box */}
              {importedPreview && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Archivo reconocido con éxito:</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-100 text-xs space-y-1">
                    <div><strong>Proyecto:</strong> {importedPreview.name}</div>
                    <div><strong>Actividades:</strong> {importedPreview.activities.length}</div>
                    <div><strong>Grupos:</strong> {importedPreview.groups.length}</div>
                    <div><strong>Casillas marcadas:</strong> {Object.keys(importedPreview.completionLogs || {}).length}</div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={overwriteCurrent}
                        onChange={(e) => setOverwriteCurrent(e.target.checked)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 accent-amber-500"
                      />
                      <span>Sobrescribir el proyecto actual (si no lo marcas, se creará como un proyecto nuevo)</span>
                    </label>

                    <button
                      onClick={handleConfirmImport}
                      className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      {overwriteCurrent ? 'Reemplazar Proyecto Actual' : 'Cargar como Nuevo Proyecto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
