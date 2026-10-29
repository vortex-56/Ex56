import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { 
  exportProjectToCSV, 
  exportProjectToTXT, 
  importProjectFromAnyFormat,
  triggerFileDownload 
} from '../utils/exportImport';
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Copy, 
  X,
  ClipboardPaste
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  onImportProject: (importedProject: Project, overwriteCurrent: boolean) => void;
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
  const [isPastingMode, setIsPastingMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getTimestampedFilename = (extension: 'csv' | 'txt') => {
    const cleanName = currentProject.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ]+/gi, '_')
      .replace(/^_+|_+$/g, '') || 'proyecto';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${cleanName}_${year}-${month}-${day}_${hours}${minutes}.${extension}`;
  };

  const handleExportCSV = () => {
    const csvContent = exportProjectToCSV(currentProject);
    const filename = getTimestampedFilename('csv');
    triggerFileDownload(filename, csvContent, 'text/csv;charset=utf-8;');
  };

  const handleExportTXT = () => {
    const txtContent = exportProjectToTXT(currentProject);
    const filename = getTimestampedFilename('txt');
    triggerFileDownload(filename, txtContent, 'text/plain;charset=utf-8;');
  };

  const handleCopy = (type: 'csv' | 'txt') => {
    const content = type === 'csv' ? exportProjectToCSV(currentProject) : exportProjectToTXT(currentProject);
    navigator.clipboard.writeText(content).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  const processImportText = (text: string) => {
    setImportError(null);
    setImportedPreview(null);
    try {
      if (!text.trim()) throw new Error('El archivo o texto está vacío');
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
    onImportProject(importedPreview, overwriteCurrent);
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
                Selecciona el formato que prefieras para descargar el proyecto actual (<strong>{currentProject.name}</strong>) con todas sus actividades, fechas, sesiones y casillas marcadas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* CSV Option */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Formato CSV (.csv)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Compatible con Excel, Google Sheets y sistemas de datos tabulares.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200/80">
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar CSV</span>
                    </button>
                    <button
                      onClick={() => handleCopy('csv')}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copiar contenido"
                    >
                      {copiedType === 'csv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* TXT Option */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Formato Texto (.txt)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Reporte legible en cualquier bloc de notas con copia íntegra de restauración.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200/80">
                    <button
                      onClick={handleExportTXT}
                      className="flex-1 py-1.5 px-3 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar TXT</span>
                    </button>
                    <button
                      onClick={() => handleCopy('txt')}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Copiar contenido"
                    >
                      {copiedType === 'txt' ? <Check className="w-3.5 h-3.5 text-amber-800" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                💡 Consejo: Puedes exportar tus proyectos al finalizar tu jornada o para compartirlos con colegas.
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
