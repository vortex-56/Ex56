import React, { useState } from 'react';
import { Project } from '../types';
import { FolderKanban, Plus, Trash2, ArrowRight, Sparkles, X, Clock, CheckCircle2 } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onLoadSampleProject: () => void;
  isInitialOnboarding?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onLoadSampleProject,
  isInitialOnboarding = false,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName('');
    if (!isInitialOnboarding) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isInitialOnboarding ? 'Bienvenido a Ex56' : 'Menú de Proyectos'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isInitialOnboarding 
                ? 'Escribe tu nombre o el nombre que desees darle a tu proyecto para comenzar.'
                : 'Crea, selecciona o administra tus proyectos de seguimiento matricial.'}
            </p>
          </div>
          {!isInitialOnboarding && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Create new project form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              {isInitialOnboarding ? 'Nombre del proyecto o tu nombre' : 'Crear un nuevo proyecto'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ej. Hábitos de Boris, Rendimiento Q4, Trabajo & Salud..."
                autoFocus
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
              <button
                type="submit"
                disabled={!newProjectName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isInitialOnboarding ? 'Comenzar Proyecto' : 'Crear'}</span>
              </button>
            </div>
          </form>

          {/* Quick Sample Demo Loader */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200/90 flex items-center justify-center text-amber-900 shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  ¿Deseas probar con el proyecto de ejemplo?
                </h4>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Carga los 4 casos solicitados: Meditar (diario), Videos (Lun-Sáb), 10 Planchas (3 sesiones circulares) y Fotos (finito).
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onLoadSampleProject();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
            >
              Cargar Ejemplo
            </button>
          </div>

          {/* Existing Projects List */}
          {projects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Proyectos Guardados ({projects.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const completedChecks = Object.values(proj.completionLogs || {}).filter(Boolean).length;
                  const isConfirmingDelete = confirmDeleteId === proj.id;

                  return (
                    <div
                      key={proj.id}
                      className={`group p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-50/40 border-amber-400 ring-1 ring-amber-400/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {proj.name}
                          </span>
                          {isActive && (
                            <span className="text-[11px] font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                              Activo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span>{proj.activities.length} actividades</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                            <span>{completedChecks} checks</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                            <button
                              onClick={() => onDeleteProject(proj.id)}
                              className="px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 rounded-md transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmDeleteId(proj.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Eliminar proyecto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                onSelectProject(proj.id);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-950 rounded-lg transition-colors cursor-pointer"
                            >
                              <span>Entrar</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Los datos se guardan de forma segura en tu navegador.</span>
          {!isInitialOnboarding && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
