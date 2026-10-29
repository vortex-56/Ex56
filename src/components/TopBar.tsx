import React from 'react';
import { 
  FolderKanban, 
  Plus, 
  Download, 
  Save, 
  Check, 
  Calendar,
  Layers,
  Undo2,
  Redo2
} from 'lucide-react';

interface TopBarProps {
  projectName: string;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  onOpenNewActivity: () => void;
  onOpenImportExport: () => void;
  onOpenGroups: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  hasUnsavedChanges,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onSave,
  onOpenProjects,
  onOpenNewActivity,
  onOpenImportExport,
  onOpenGroups,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-6 h-14 sm:h-16">
        
        {/* Zone 1: Brand & Project Name */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {/* Logo Amarillo Ex56 */}
          <div 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-xs shrink-0 select-none"
            title="Ex56"
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-slate-950" />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base font-extrabold text-slate-950 tracking-tight whitespace-nowrap">
              Ex56
            </span>
            <span className="text-slate-300 font-light" aria-hidden="true">/</span>
            <button
              onClick={onOpenProjects}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-800 flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-amber-50/80 transition-colors max-w-[100px] sm:max-w-[200px] truncate cursor-pointer"
              title="Cambiar o editar proyecto"
            >
              <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{projectName}</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Subtitle / Quiet indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Gestor de Actividades
          </span>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Groups management */}
          <button
            onClick={onOpenGroups}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Administrar grupos de actividades"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Grupos</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Exportar o importar en CSV / TXT"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Datos</span>
          </button>

          {/* Retroceder acción (Deshacer / Undo) */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              canUndo
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 cursor-pointer shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={canUndo ? 'Retroceder la última acción realizada (Deshacer) [Ctrl+Z]' : 'No hay acciones previas para retroceder'}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Deshacer</span>
          </button>

          {/* Avanzar acción (Rehacer / Redo) */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              canRedo
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 cursor-pointer shadow-2xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={canRedo ? 'Avanzar a la acción siguiente (Rehacer) [Ctrl+Y]' : 'No hay acciones siguientes para rehacer'}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Avanzar</span>
          </button>

          {/* Desktop Save Status / Action */}
          <button
            onClick={onSave}
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs border border-amber-600/20'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
            title={hasUnsavedChanges ? 'Hay cambios sin guardar. Haz clic para guardar.' : 'Todo guardado'}
          >
            {hasUnsavedChanges ? (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardado</span>
              </>
            )}
          </button>

          {/* Desktop Primary Action: + Nueva Actividad con color amarillo inteligente */}
          <button
            onClick={onOpenNewActivity}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Actividad</span>
          </button>
        </div>

      </div>

      {/* Mobile Second Line: Guardar & Agregar Actividad */}
      <div className="sm:hidden px-3 py-2 border-t border-slate-200 bg-white flex items-center gap-2">
        {/* Save Status / Action */}
        <button
          onClick={onSave}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
            hasUnsavedChanges
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-600/20'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title={hasUnsavedChanges ? 'Hay cambios sin guardar. Haz clic para guardar.' : 'Todo guardado'}
        >
          {hasUnsavedChanges ? (
            <>
              <Save className="w-4 h-4 shrink-0" />
              <span>Guardar</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 shrink-0" />
              <span>Guardado</span>
            </>
          )}
        </button>

        {/* Primary Action: + Nueva Actividad en amarillo inteligente */}
        <button
          onClick={onOpenNewActivity}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
          <span>Agregar Actividad</span>
        </button>
      </div>
    </header>
  );
};
