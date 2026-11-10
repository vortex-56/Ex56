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
  Edit2,
  Lightbulb,
  LogOut,
  User
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
  onOpenNewIdea?: () => void;
  onOpenImportExport: () => void;
  onOpenGroups: () => void;
  onOpenDailyMissions?: () => void;
  dailyPendingCount?: number;
  activeTab: 'guia' | 'registro' | 'ideas';
  onSelectTab: (tab: 'guia' | 'registro' | 'ideas') => void;
  userEmail?: string | null;
  userAvatar?: string | null;
  onSignOut?: () => void;
  isGuest?: boolean;
  onExitGuest?: () => void;
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
  onOpenNewIdea,
  onOpenImportExport,
  onOpenGroups,
  onOpenDailyMissions,
  dailyPendingCount = 0,
  activeTab,
  onSelectTab,
  userEmail,
  userAvatar,
  onSignOut,
  isGuest = false,
  onExitGuest,
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-2xs">
      
      {/* =========================================================================
          DESKTOP MAIN BAR (Visible en pantallas sm: en adelante)
          Diseño optimizado: Zona izquierda agrupa Logo, Proyecto y Pestañas;
          Zona derecha agrupa las acciones y el estado de usuario/invitado
          movidos más hacia la izquierda con márgenes compactos para que el
          botón "Salir" nunca quede recortado en el borde derecho.
         ========================================================================= */}
      <div className="hidden sm:flex w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 items-center justify-between gap-2 lg:gap-3 h-14 sm:h-16">
        
        {/* Zona Izquierda: Logo, Nombre de Proyecto y Pestañas juntas */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0 min-w-0">
          {/* Logo Amarillo Ex56 / Botón Misiones Diarias */}
          <button 
            type="button"
            onClick={onOpenDailyMissions}
            className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-xs shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="Misiones del Día (Despliega menú desde la izquierda)"
            aria-label="Misiones del Día"
          >
            <Calendar className="w-4.5 h-4.5 stroke-[2.5] text-slate-950" />
            {dailyPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-950 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-amber-300 shadow-xs">
                {dailyPendingCount}
              </span>
            )}
          </button>

          {/* Nombre Ex56 y Selector de Proyecto */}
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
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-amber-800 flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-amber-50/80 transition-colors max-w-[110px] lg:max-w-[180px] truncate cursor-pointer"
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

          {/* Pestañas de navegación en Escritorio (Guía, Registro, Ideas) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs shrink-0 ml-1">
            <button
              type="button"
              onClick={() => onSelectTab('guia')}
              className={`px-2.5 lg:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-2.5 lg:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'registro'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
              <span>Registro</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('ideas')}
              className={`px-2.5 lg:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ideas'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ideas</span>
            </button>
          </div>
        </div>

        {/* Zona Derecha: Botones de Acción y Usuario/Invitado */}
        <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
          {/* Grupos */}
          <button
            onClick={onOpenGroups}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Administrar grupos de actividades"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Grupos</span>
          </button>

          {/* Import / Export */}
          <button
            onClick={onOpenImportExport}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            title="Exportar o importar en CSV / TXT"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Datos</span>
          </button>

          {/* Deshacer */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shadow-2xs ${
              canUndo
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={canUndo ? 'Retroceder la última acción realizada (Deshacer) [Ctrl+Z]' : 'No hay acciones previas'}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Deshacer</span>
          </button>

          {/* Rehacer */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shadow-2xs ${
              canRedo
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
            }`}
            title={canRedo ? 'Avanzar a la acción siguiente (Rehacer) [Ctrl+Y]' : 'No hay acciones siguientes'}
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Avanzar</span>
          </button>

          {/* Guardar */}
          <button
            onClick={onSave}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
              hasUnsavedChanges
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-600/20'
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

          {/* Botón Principal Dinámico */}
          {activeTab === 'ideas' ? (
            <button
              onClick={onOpenNewIdea}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Idea</span>
            </button>
          ) : activeTab === 'registro' ? (
            <button
              onClick={onOpenNewResource || onOpenNewActivity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Registro</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewActivity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all shadow-xs whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Agregar Actividad</span>
            </button>
          )}

          {/* Insignia Modo Invitado / Usuario y Botón Salir / Cerrar Sesión */}
          {(onSignOut || onExitGuest) && (
            <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 shrink-0">
              {isGuest ? (
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold whitespace-nowrap"
                  title="Tus datos se guardan en el navegador"
                >
                  <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="hidden lg:inline">Modo Invitado</span>
                  <span className="lg:hidden">Invitado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1" title={userEmail || 'Usuario'}>
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 text-xs font-bold shrink-0">
                      {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  {userEmail && (
                    <span className="hidden xl:inline text-xs text-slate-700 max-w-[110px] truncate font-medium">
                      {userEmail}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={isGuest ? onExitGuest : onSignOut}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                title={isGuest ? 'Salir del modo invitado y volver al login' : 'Cerrar sesión de Google'}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{isGuest ? 'Salir' : 'Cerrar'}</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* =========================================================================
          MOBILE VIEW (sm:hidden)
          Organizado en líneas dedicadas para que NINGÚN BOTÓN ni PESTAÑA quede
          oculto o recortado por falta de espacio en pantallas pequeñas:
          - Línea 1: Logo + Proyecto + Botón Salir / Invitado
          - Línea 2: Las 3 Pestañas (Guía, Registro, Ideas) en fila propia al 100%
          - Línea 3: Herramientas (Grupos, Datos, Deshacer, Avanzar)
          - Línea 4: Guardar y Acción Primaria (Agregar Actividad / Recurso / Idea)
         ========================================================================= */}
      
      {/* Mobile Línea 1: Cabecera superior con Logo, Proyecto y Botón Salir */}
      <div className="sm:hidden px-2.5 py-2 flex items-center justify-between gap-1.5 w-full bg-white">
        {/* Izquierda: Misiones, Logo y Proyecto */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button 
            type="button"
            onClick={onOpenDailyMissions}
            className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-2xs shrink-0 cursor-pointer active:scale-95"
            title="Misiones del Día"
          >
            <Calendar className="w-4 h-4 stroke-[2.5]" />
            {dailyPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-950 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-amber-300 shadow-xs">
                {dailyPendingCount}
              </span>
            )}
          </button>

          <span className="text-sm font-extrabold text-slate-950 tracking-tight whitespace-nowrap shrink-0">
            Ex56
          </span>
          <span className="text-slate-300 font-light" aria-hidden="true">/</span>

          {isEditingName ? (
            <div className="flex items-center gap-1 min-w-0">
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
                className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-amber-400 rounded text-slate-900 focus:outline-hidden w-24"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1 bg-amber-400 text-slate-950 rounded text-xs"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 min-w-0">
              <button
                onClick={onOpenProjects}
                className="text-xs font-semibold text-slate-800 flex items-center gap-1 px-1.5 py-1 rounded hover:bg-slate-100 max-w-[120px] truncate cursor-pointer"
                title="Cambiar proyecto"
              >
                <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{projectName}</span>
              </button>
              {onRenameProject && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-amber-700 rounded cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Derecha Mobile: Modo Invitado / Usuario y Botón Salir */}
        {(onSignOut || onExitGuest) && (
          <div className="flex items-center gap-1 shrink-0">
            {isGuest ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
                Invitado
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-600 max-w-[80px] truncate">
                {userEmail?.split('@')[0]}
              </span>
            )}

            <button
              type="button"
              onClick={isGuest ? onExitGuest : onSignOut}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title={isGuest ? 'Salir del modo invitado' : 'Cerrar sesión'}
            >
              <LogOut className="w-3 h-3 shrink-0" />
              <span>{isGuest ? 'Salir' : 'Cerrar'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Línea 2: Las 3 Pestañas Principales en fila propia dedicada al 100% de ancho */}
      <div className="sm:hidden px-2 py-1.5 border-t border-slate-200 bg-slate-100/95 grid grid-cols-3 gap-1.5 w-full">
        <button
          type="button"
          onClick={() => onSelectTab('guia')}
          className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
            activeTab === 'guia'
              ? 'bg-white text-slate-950 border border-slate-300/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-200/50'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Guía</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('registro')}
          className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
            activeTab === 'registro'
              ? 'bg-white text-slate-950 border border-slate-300/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-200/50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Registro</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('ideas')}
          className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
            activeTab === 'ideas'
              ? 'bg-white text-slate-950 border border-slate-300/80 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-slate-200/50'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Ideas</span>
        </button>
      </div>

      {/* Mobile Línea 3: Herramientas (Grupos, Datos, Retroceder, Avanzar) */}
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
          <span className="truncate">Datos</span>
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
          <span className="truncate">Deshacer</span>
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

      {/* Mobile Línea 4: Guardar y Acción Primaria */}
      <div className="sm:hidden px-2.5 py-1.5 border-t border-slate-200 bg-white flex items-center gap-1.5">
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

        <button
          onClick={
            activeTab === 'ideas'
              ? onOpenNewIdea
              : activeTab === 'registro'
              ? (onOpenNewResource || onOpenNewActivity)
              : onOpenNewActivity
          }
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95 ${
            activeTab === 'ideas'
              ? 'text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600/30'
              : 'text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>
            {activeTab === 'ideas'
              ? 'Nueva Idea'
              : activeTab === 'registro'
              ? 'Nuevo Registro'
              : 'Agregar Actividad'}
          </span>
        </button>
      </div>

    </header>
  );
};
