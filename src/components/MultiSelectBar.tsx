import React, { useState } from 'react';
import { ActivityGroup } from '../types';
import { 
  Layers, 
  Trash2, 
  CheckCircle2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown 
} from 'lucide-react';

interface MultiSelectBarProps {
  mode: 'activities' | 'groups';
  selectedCount: number;
  groups: ActivityGroup[];
  onAssignToGroup?: (groupId: string | null) => void;
  onCreateAndAssignGroup?: (name: string) => void;
  onMarkSelectedCompleted?: (completed: boolean) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onMoveUp: () => void;
  onMoveToStart: () => void;
  onMoveDown: () => void;
  onMoveToEnd: () => void;
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  mode,
  selectedCount,
  groups,
  onAssignToGroup,
  onCreateAndAssignGroup,
  onMarkSelectedCompleted,
  onDeleteSelected,
  onClearSelection,
  onMoveUp,
  onMoveToStart,
  onMoveDown,
  onMoveToEnd,
}) => {
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  if (selectedCount === 0) return null;

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !onCreateAndAssignGroup) return;
    onCreateAndAssignGroup(newGroupName.trim());
    setNewGroupName('');
    setIsCreatingNewGroup(false);
  };

  const isGroupsMode = mode === 'groups';

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 max-w-4xl w-[96%] sm:w-auto border border-slate-700/80 backdrop-blur-md">
      {/* Count Badge */}
      <div className="flex items-center gap-1.5 pr-2 sm:pr-3 border-r border-slate-700/80 shrink-0">
        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center shadow-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap hidden xs:inline">
          {isGroupsMode
            ? selectedCount === 1 ? '1 grupo' : `${selectedCount} grupos`
            : selectedCount === 1 ? '1 actividad' : `${selectedCount} activ.`}
        </span>
      </div>

      {/* Reorder Buttons (Subir, Subir hasta inicio, Bajar, Bajar hasta final) */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 shrink-0">
        <button
          onClick={onMoveToStart}
          className="p-1 sm:px-2 sm:py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title={isGroupsMode ? 'Mover grupos seleccionados al inicio de la lista' : 'Mover actividades seleccionadas al inicio'}
        >
          <ChevronsUp className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Al Inicio</span>
        </button>
        <button
          onClick={onMoveUp}
          className="p-1 sm:px-2 sm:py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Subir 1 posición"
        >
          <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Subir</span>
        </button>
        <button
          onClick={onMoveDown}
          className="p-1 sm:px-2 sm:py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title="Bajar 1 posición"
        >
          <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Bajar</span>
        </button>
        <button
          onClick={onMoveToEnd}
          className="p-1 sm:px-2 sm:py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          title={isGroupsMode ? 'Mover grupos seleccionados al final de la lista' : 'Mover actividades seleccionadas al final'}
        >
          <ChevronsDown className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Al Final</span>
        </button>
      </div>

      {/* Activities specific: Move to group & Mark completed */}
      {!isGroupsMode && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {isCreatingNewGroup ? (
            <form onSubmit={handleCreateGroupSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del nuevo grupo..."
                autoFocus
                className="px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400 w-32 sm:w-auto"
              />
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-2 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Mover
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            onAssignToGroup && (
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
                <select
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingNewGroup(true);
                    } else {
                      onAssignToGroup(e.target.value === '' ? null : e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 max-w-[120px] sm:max-w-none truncate"
                >
                  <option value="" disabled>Mover a grupo...</option>
                  <option value="">Sin grupo (Quitar)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                  <option value="__NEW__">+ Crear nuevo grupo...</option>
                </select>
              </div>
            )
          )}

          {/* Mark Completed */}
          {onMarkSelectedCompleted && (
            <button
              onClick={() => onMarkSelectedCompleted(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Marcar como terminadas"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminar</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={onDeleteSelected}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
        title={isGroupsMode ? 'Eliminar grupos seleccionados' : 'Eliminar actividades seleccionadas'}
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Eliminar</span>
      </button>

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        className="p-1 text-slate-400 hover:text-white ml-auto rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Cancelar selección"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
