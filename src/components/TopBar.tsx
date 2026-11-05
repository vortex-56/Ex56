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
  Redo2,
  LayoutGrid,
  ClipboardList,
  Package,
  Edit2
} from 'lucide-react';

interface TopBarProps {
  projectName: string;
  onRenameProject?: (newName: string) => void;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  onSave: () => void;
  onOpenProjects: () => void;
  onOpenNewActivity: () => void;
  onOpenNewResource?: () => void;
  onOpenImportExport: () => void;
  onOpenGroups: () => void;
  onOpenDailyMissions?: () => void;
  dailyPendingCount?: number;
  activeTab: 'guia' | 'registro';
  onSelectTab: (tab: 'guia' | 'registro') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onRenameProject,
  hasUnsavedChanges,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onSave,
  onOpenProjects,
  onOpenNewActivity,
  onOpenNewResource,
  onOpenImportExport,
  onOpenGroups,
  onOpenDailyMissions,
  dailyPendingCount = 0,
  activeTab,
  onSelectTab,
}) => {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(projectName);

  React.useEffect(() => {
    setNameValue(projectName);
  }, [projectName]);

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue.trim() !== projectName && onRenameProject) {
      onRenameProject(nameValue.trim());
    } else {
      setNameValue(projectName);
    }
    setIsEditingName(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-6 h-14 sm:h-16">
        
        {/* Zone 1: Brand & Project Name */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {/* Logo Amarillo Ex56 / Botón Misiones Diarias (Abre menú desplegable desde la izquierda) */}
          <button 
            type="button"
            onClick={onOpenDailyMissions}
            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-xs shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="Misiones del Día (Despliega menú desde la izquierda)"
            aria-label="Misiones del Día"
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-slate-950" />
            {dailyPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-950 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-amber-300 shadow-xs">
                {dailyPendingCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base font-extrabold text-slate-950 tracking-tight whitespace-nowrap">
              Ex56
            </span>
            <span className="text-slate-300 font-light" aria-hidden="true">/</span>

            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setNameValue(projectName);
                      setIsEditingName(false);
                    }
                  }}
                  className="px-2 py-0.5 text-xs sm:text-sm font-semibold bg-white border border-amber-400 rounded-lg text-slate-900 focus:outline-hidden w-28 sm:w-40"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-1 bg-amber-400 text-slate-950 rounded hover:bg-amber-500 text-xs font-bold cursor-pointer"
                  title="Guardar nombre"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameValue(projectName);
                    setIsEditingName(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded text-xs cursor-pointer"
                  title="Cancelar"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 group/pname">
                <button
                  onClick={onOpenProjects}
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-800 flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-amber-50/80 transition-colors max-w-[90px] sm:max-w-[160px] truncate cursor-pointer"
                  title="Cambiar o ver proyectos"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{projectName}</span>
                </button>
                {onRenameProject && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-amber-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Renombrar proyecto"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Tabs (Guía | Registro) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onSelectTab('guia')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guia'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
            <span>Guía</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('registro')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'registro'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-cyan-600" />
            <span>Registro</span>
          </button>
        </div>

        {/* Zone 3: Actions (Desktop only, mobile has dedicated lines below) */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2 shrink-0">
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

          {/* Desktop Primary Action: Dynamic based on activeTab */}
          {activeTab === 'registro' ? (
            <button
              onClick={onOpenNewResource || onOpenNewActivity}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Registro</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewActivity}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Agregar Actividad</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Second Line: Grupos, Descargar, Retroceder y Avanzar para evitar barra desplazadora */}
      <div className="sm:hidden px-2 py-1.5 border-t border-slate-200 bg-slate-50/90 grid grid-cols-4 gap-1 w-full">
        <button
          onClick={onOpenGroups}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-0.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 transition-colors shadow-2xs truncate cursor-pointer"
          title="Administrar grupos de actividades"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">Grupos</span>
        </button>

        <button
          onClick={onOpenImportExport}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-0.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 transition-colors shadow-2xs truncate cursor-pointer"
          title="Descargar o importar datos (CSV / TXT)"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">Descargar</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`inline-flex items-center justify-center gap-1 py-1.5 px-0.5 text-[11px] font-semibold rounded-lg border transition-all shadow-2xs truncate ${
            canUndo
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 cursor-pointer'
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
          title="Retroceder última acción (Deshacer)"
        >
          <Undo2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Retroceder</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`inline-flex items-center justify-center gap-1 py-1.5 px-0.5 text-[11px] font-semibold rounded-lg border transition-all shadow-2xs truncate ${
            canRedo
              ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 cursor-pointer'
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
          title="Avanzar acción siguiente (Rehacer)"
        >
          <Redo2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Avanzar</span>
        </button>
      </div>

      {/* Mobile Third Line: Guardar & Agregar Actividad / Recurso */}
      <div className="sm:hidden px-2.5 py-1.5 border-t border-slate-200 bg-white flex items-center gap-1.5">
        {/* Save Status / Action */}
        <button
          onClick={onSave}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs ${
            hasUnsavedChanges
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-600/20'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title={hasUnsavedChanges ? 'Hay cambios sin guardar. Haz clic para guardar.' : 'Todo guardado'}
        >
          {hasUnsavedChanges ? (
            <>
              <Save className="w-3.5 h-3.5 shrink-0" />
              <span>Guardar</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Guardado</span>
            </>
          )}
        </button>

        {/* Primary Action Mobile */}
        <button
          onClick={activeTab === 'registro' ? (onOpenNewResource || onOpenNewActivity) : onOpenNewActivity}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>{activeTab === 'registro' ? 'Nuevo Registro' : 'Agregar Actividad'}</span>
        </button>
      </div>
    </header>
  );
};
