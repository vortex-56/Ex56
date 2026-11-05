import React, { useState, useEffect } from 'react';
import { ActivityGroup, GroupType } from '../types';
import { COLOR_PALETTE } from '../utils/colors';
import { Layers, Plus, Trash2, Edit2, Check, X, Tag, ArrowUp, ArrowDown, Package, CheckSquare } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ActivityGroup[];
  onCreateGroup: (name: string, color: string, code?: string, showBox?: boolean, type?: GroupType) => void;
  onUpdateGroup: (group: ActivityGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onReorderGroups?: (groups: ActivityGroup[]) => void;
  initialGroup?: ActivityGroup | null;
  defaultType?: GroupType;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onReorderGroups,
  initialGroup,
  defaultType = 'activity',
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(COLOR_PALETTE[0].hex);
  const [newGroupShowBox, setNewGroupShowBox] = useState(false);
  const [newGroupType, setNewGroupType] = useState<GroupType>(defaultType);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [editingShowBox, setEditingShowBox] = useState(false);
  const [editingType, setEditingType] = useState<GroupType>('activity');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (initialGroup && isOpen) {
      setEditingGroupId(initialGroup.id);
      setEditingName(initialGroup.name);
      setEditingCode(initialGroup.code || '');
      setEditingColor(initialGroup.color);
      setEditingShowBox(!!initialGroup.showBox);
      setEditingType(initialGroup.type || 'activity');
    } else if (!isOpen) {
      setEditingGroupId(null);
    }
    if (isOpen) {
      setNewGroupType(defaultType);
    }
  }, [initialGroup, isOpen, defaultType]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(
      newGroupName.trim(), 
      newGroupColor, 
      newGroupCode.trim().toUpperCase() || undefined,
      newGroupShowBox,
      newGroupType
    );
    setNewGroupName('');
    setNewGroupCode('');
    setNewGroupShowBox(false);
  };

  const startEdit = (g: ActivityGroup) => {
    setEditingGroupId(g.id);
    setEditingName(g.name);
    setEditingCode(g.code || '');
    setEditingColor(g.color);
    setEditingShowBox(!!g.showBox);
    setEditingType(g.type || 'activity');
  };

  const saveEdit = (g: ActivityGroup) => {
    if (!editingName.trim()) return;
    onUpdateGroup({
      ...g,
      name: editingName.trim(),
      code: editingCode.trim().toUpperCase() || undefined,
      color: editingColor || g.color,
      showBox: editingShowBox,
      type: editingType,
    });
    setEditingGroupId(null);
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
    if (!onReorderGroups) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;
    const newGroups = [...groups];
    const temp = newGroups[index];
    newGroups[index] = newGroups[targetIndex];
    newGroups[targetIndex] = temp;
    onReorderGroups(newGroups);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Grupos y Categorías
              </h2>
              <p className="text-xs text-slate-500">
                Crea grupos para actividades o recursos, reordena su posición y asigna códigos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Create Group Form */}
          <form onSubmit={handleCreate} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Crear Nuevo Grupo
              </h3>
            </div>

            {/* Selector de Tipo de Grupo: Actividades o Recursos */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Tipo de Grupo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewGroupType('activity')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    newGroupType === 'activity'
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Para Actividades</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewGroupType('resource')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    newGroupType === 'resource'
                      ? 'bg-cyan-500 text-white border-cyan-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Para Recursos</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del grupo (ej. Salud, Alimentos)..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                  placeholder="Cód (ej. SAL)"
                  maxLength={5}
                  className="w-24 px-2 py-1.5 text-xs font-mono font-bold uppercase text-center bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg disabled:opacity-50 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Color swatches */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Color del grupo</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewGroupColor(c.hex)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newGroupColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Line with checkbox for activity group showBox */}
            {newGroupType === 'activity' && (
              <div className="pt-2 border-t border-slate-200/80 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newGroupShowBox}
                    onChange={(e) => setNewGroupShowBox(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Activar casilla (box) en los días de este grupo
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  {newGroupShowBox
                    ? '✓ Casilla activada: cada día mostrará una casilla para el grupo en la matriz.'
                    : '✕ Casilla desactivada: el grupo no mostrará casillas diarias, solo la etiqueta organizadora.'}
                </p>
              </div>
            )}
          </form>

          {/* Existing Groups List with Position Change Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Grupos Existentes ({groups.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                Usa las flechas ▲ ▼ para cambiar la posición
              </span>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Aún no has creado ningún grupo.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {groups.map((group, index) => {
                  const isEditing = editingGroupId === group.id;
                  const isConfirmingDelete = confirmDeleteId === group.id;
                  const isResourceGroup = group.type === 'resource';

                  if (isEditing) {
                    return (
                      <div key={group.id} className="p-3 bg-amber-50/40 border border-amber-300 rounded-lg space-y-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Nombre..."
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-amber-500"
                          />
                          <input
                            type="text"
                            value={editingCode}
                            onChange={(e) => setEditingCode(e.target.value.toUpperCase())}
                            placeholder="Cód..."
                            maxLength={5}
                            className="w-20 px-2 py-1 text-xs font-mono font-bold uppercase text-center bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(group)}
                            className="p-1.5 bg-amber-400 text-slate-950 rounded-md hover:bg-amber-500 cursor-pointer border border-amber-500/30"
                            title="Guardar"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGroupId(null)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit Type Toggle */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-600">Tipo:</span>
                          <button
                            type="button"
                            onClick={() => setEditingType('activity')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              editingType === 'activity'
                                ? 'bg-amber-400 text-slate-950 border-amber-500'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Actividades
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingType('resource')}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              editingType === 'resource'
                                ? 'bg-cyan-500 text-white border-cyan-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Recursos
                          </button>
                        </div>

                        {/* Edit Color swatches */}
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setEditingColor(c.hex)}
                              className={`w-4 h-4 rounded-full transition-transform ${
                                (editingColor || group.color).toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-offset-1 ring-slate-800 scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>

                        {/* Edit showBox toggle */}
                        {editingType === 'activity' && (
                          <div className="pt-1.5 border-t border-amber-200/80 space-y-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={editingShowBox}
                                onChange={(e) => setEditingShowBox(e.target.checked)}
                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                              />
                              <span className="text-[11px] font-semibold text-slate-800">
                                Activar casilla (box) en los días
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={group.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                    >
                      {/* Left: Position buttons + Color & Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Position controls (subir / bajar) */}
                        {onReorderGroups && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveGroup(index, 'up')}
                              className="p-0.5 text-slate-400 hover:text-amber-800 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                              title="Subir posición"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={index === groups.length - 1}
                              onClick={() => moveGroup(index, 'down')}
                              className="p-0.5 text-slate-400 hover:text-amber-800 disabled:opacity-20 disabled:hover:text-slate-400 cursor-pointer"
                              title="Bajar posición"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-xs font-bold font-mono text-amber-950 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
                          {group.code || group.name.slice(0, 3).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-slate-800 truncate block">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            {isResourceGroup ? (
                              <span className="text-cyan-700 font-semibold bg-cyan-50 px-1 rounded">Recursos</span>
                            ) : (
                              <span className="text-amber-800 font-semibold bg-amber-50 px-1 rounded">Actividades</span>
                            )}
                            <span>· Pos #{index + 1}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                            <button
                              type="button"
                              onClick={() => onDeleteGroup(group.id)}
                              className="px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded-md cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(group)}
                              className="p-1.5 text-slate-400 hover:text-amber-800 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Editar grupo"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(group.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
