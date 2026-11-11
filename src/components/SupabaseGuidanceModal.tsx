import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface SupabaseGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string | null;
  onRetrySync: () => void;
}

export const SupabaseGuidanceModal: React.FC<SupabaseGuidanceModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
  onRetrySync,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase para permitir que tu cuenta guarde y sincronice entre la computadora y tu teléfono:
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE completion_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE resource_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-amber-500 text-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Configuración de Base de Datos Supabase</h3>
              <p className="text-xs font-semibold text-amber-950/80">Permitir sincronización entre tu PC y tu teléfono</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-amber-600/30 text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Error reportado por Supabase:</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-rose-200 break-all text-rose-800">
                {errorMessage}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="font-semibold text-slate-900">
              ¿Por qué no se sincroniza entre la computadora y el teléfono?
            </p>
            <p className="text-slate-600 text-xs leading-relaxed">
              En Supabase, las tablas creadas tienen activada por defecto la opción <strong>Row Level Security (RLS)</strong>. 
              Si RLS está activado sin políticas de acceso, Supabase <strong>bloquea cualquier guardado o lectura</strong> en la nube, haciendo que los cambios solo queden temporalmente en la memoria del navegador.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">
              Solución en 30 segundos (Paso a paso):
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li>Ingresa a tu consola de <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-700 font-bold underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3 inline" /></a>.</li>
              <li>Abre tu proyecto y ve a <strong>SQL Editor</strong> en el menú lateral izquierdo.</li>
              <li>Copia el código que está abajo, pégalo en el editor y haz clic en <strong>RUN</strong>.</li>
            </ol>
          </div>

          {/* SQL Code Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-800">Código SQL a ejecutar:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-slate-800 select-all">
              {sqlScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onRetrySync();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ya ejecuté el SQL, ¡Sincronizar ahora!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
