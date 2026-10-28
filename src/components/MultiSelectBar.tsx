import React, { useState } from 'react';
import { ActivityGroup } from '../types';
import { Layers, Trash2, CheckCircle2, X, Plus } from 'lucide-react';

interface MultiSelectBarProps {
  selectedCount: number;
  groups: ActivityGroup[];
  onAssignToGroup: (groupId: string | null) => void;
  onCreateAndAssignGroup: (name: string) => void;
  onMarkSelectedCompleted: (completed: boolean) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const MultiSelectBar: React.FC<MultiSelectBarProps> = ({
  selectedCount,
  groups,
  onAssignToGroup,
  onCreateAndAssignGroup,
  onMarkSelectedCompleted,
  onDeleteSelected,
  onClearSelection,
}) => {
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  if (selectedCount === 0) return null;

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateAndAssignGroup(newGroupName.trim());
    setNewGroupName('');
    setIsCreatingNewGroup(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 max-w-2xl w-[92%] sm:w-auto border border-slate-800">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80 shrink-0">
        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold flex items-center justify-center shadow-2xs">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap">
          {selectedCount === 1 ? '1 seleccionada' : `${selectedCount} seleccionadas`}
        </span>
      </div>

      {/* Group Assignment Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {isCreatingNewGroup ? (
          <form onSubmit={handleCreateGroupSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nombre del nuevo grupo..."
              autoFocus
              className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newGroupName.trim()}
              className="px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              Crear y Mover
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
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setIsCreatingNewGroup(true);
                } else {
                  onAssignToGroup(e.target.value === '' ? null : e.target.value);
                }
              }}
              defaultValue=""
              className="text-xs bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
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
        )}

        {/* Mark Completed */}
        <button
          onClick={() => onMarkSelectedCompleted(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-md transition-colors"
          title="Marcar como terminadas"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Terminar</span>
        </button>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-md transition-colors"
          title="Eliminar actividades seleccionadas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      </div>

      {/* Clear selection */}
      <button
        onClick={onClearSelection}
        className="p-1 text-slate-400 hover:text-white ml-auto rounded-md hover:bg-slate-800 transition-colors"
        title="Cancelar selección"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
