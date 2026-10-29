import React, { useState, useEffect } from 'react';
import { Activity, ActivityGroup, ScheduleType, SubActivity } from '../types';
import { COLOR_PALETTE } from '../utils/colors';
import { getTodayDateString, getTomorrowDateString } from '../utils/dateUtils';
import { X, Plus, Trash2, Calendar, CheckSquare, Check } from 'lucide-react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  initialActivity?: Activity | null;
  groups: ActivityGroup[];
  onCreateGroup: (name: string, color: string, code?: string) => ActivityGroup;
  onDeleteGroup?: (groupId: string) => void;
  onUpdateGroup?: (group: ActivityGroup) => void;
}

const WEEKDAYS = [
  { day: 1, label: 'Lun', full: 'Lunes' },
  { day: 2, label: 'Mar', full: 'Martes' },
  { day: 3, label: 'Mié', full: 'Miércoles' },
  { day: 4, label: 'Jue', full: 'Jueves' },
  { day: 5, label: 'Vie', full: 'Viernes' },
  { day: 6, label: 'Sáb', full: 'Sábado' },
  { day: 0, label: 'Dom', full: 'Domingo' },
];

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onUpdateGroup,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);
  const [groupId, setGroupId] = useState<string>('');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [subActivities, setSubActivities] = useState<SubActivity[]>([]);
  const [notes, setNotes] = useState('');

  // Inline group creation toggle
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');

  // Group editing state inside modal
  const [isEditingCurrentGroup, setIsEditingCurrentGroup] = useState(false);
  const [editingCurrentGroupName, setEditingCurrentGroupName] = useState('');
  const [editingCurrentGroupCode, setEditingCurrentGroupCode] = useState('');
  const [editingCurrentGroupColor, setEditingCurrentGroupColor] = useState('');
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);

  useEffect(() => {
    if (initialActivity) {
      setName(initialActivity.name);
      setCode(initialActivity.code || '');
      setColor(initialActivity.color || COLOR_PALETTE[0].hex);
      setGroupId(initialActivity.groupId || '');
      setStartDate(initialActivity.startDate);
      setHasEndDate(initialActivity.hasEndDate);
      setEndDate(initialActivity.endDate || '');
      setScheduleType(initialActivity.scheduleType || 'daily');
      setActiveDays(initialActivity.activeDays?.length ? initialActivity.activeDays : [0, 1, 2, 3, 4, 5, 6]);
      setIsCompleted(initialActivity.isCompleted || false);
      setSubActivities(initialActivity.subActivities ? [...initialActivity.subActivities] : []);
      setNotes(initialActivity.notes || '');
    } else {
      // Default new activity
      setName('');
      setCode('');
      setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].hex);
      setGroupId(groups[0]?.id || '');
      setStartDate(getTodayDateString());
      setHasEndDate(false);
      setEndDate(getTomorrowDateString());
      setScheduleType('daily');
      setActiveDays([0, 1, 2, 3, 4, 5, 6]);
      setIsCompleted(false);
      setSubActivities([]);
      setNotes('');
    }
    setIsCreatingNewGroup(false);
    setNewGroupName('');
    setNewGroupCode('');
    setIsEditingCurrentGroup(false);
    setEditingCurrentGroupName('');
    setEditingCurrentGroupCode('');
    setEditingCurrentGroupColor('');
    setConfirmDeleteGroup(false);
  }, [initialActivity, isOpen, groups]);

  if (!isOpen) return null;

  // Change number of sub-activities/sessions dynamically
  const handleSessionsCountChange = (count: number) => {
    const targetCount = Math.max(0, Math.min(count, 12));
    const current = [...subActivities];

    if (targetCount === 0 || targetCount === 1) {
      // 0 or 1 means standard single box activity
      setSubActivities([]);
      return;
    }

    if (targetCount > current.length) {
      const toAdd = targetCount - current.length;
      for (let i = 0; i < toAdd; i++) {
        const orderIndex = current.length + 1;
        const subName = name.trim() ? `${name.trim()} - Sesión ${orderIndex}` : `Sesión ${orderIndex}`;
        const subCode = code ? `${code}.${orderIndex}` : `S${orderIndex}`;
        current.push({
          id: 'sub_' + Math.random().toString(36).substring(2, 9),
          code: subCode,
          name: subName,
          order: orderIndex,
        });
      }
    } else if (targetCount < current.length) {
      current.splice(targetCount);
    }
    setSubActivities(current);
  };

  const handleUpdateSubActivityName = (id: string, newName: string) => {
    setSubActivities(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, name: newName } : sub))
    );
  };

  const handleUpdateSubActivityCode = (id: string, newCode: string) => {
    setSubActivities(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, code: newCode.toUpperCase() } : sub))
    );
  };

  const handleAddSubActivity = () => {
    const nextOrder = subActivities.length + 1;
    const subName = name.trim() ? `${name.trim()} - Sesión ${nextOrder}` : `Sesión ${nextOrder}`;
    const subCode = code ? `${code}.${nextOrder}` : `S${nextOrder}`;
    setSubActivities([
      ...subActivities,
      {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        code: subCode,
        name: subName,
        order: nextOrder,
      },
    ]);
  };

  const handleRemoveSubActivity = (id: string) => {
    setSubActivities(prev => prev.filter(s => s.id !== id));
  };

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter(d => d !== day));
      }
    } else {
      setActiveDays([...activeDays, day].sort());
    }
  };

  const handleInlineGroupCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup = onCreateGroup(
      newGroupName.trim(), 
      color, 
      newGroupCode.trim().toUpperCase() || undefined
    );
    setGroupId(newGroup.id);
    setIsCreatingNewGroup(false);
    setNewGroupName('');
    setNewGroupCode('');
  };

  const selectedGroupObj = groups.find(g => g.id === groupId);

  const startEditSelectedGroup = () => {
    if (!selectedGroupObj) return;
    setEditingCurrentGroupName(selectedGroupObj.name);
    setEditingCurrentGroupCode(selectedGroupObj.code || '');
    setEditingCurrentGroupColor(selectedGroupObj.color);
    setIsEditingCurrentGroup(true);
  };

  const saveEditSelectedGroup = () => {
    if (!selectedGroupObj || !editingCurrentGroupName.trim() || !onUpdateGroup) return;
    onUpdateGroup({
      ...selectedGroupObj,
      name: editingCurrentGroupName.trim(),
      code: editingCurrentGroupCode.trim().toUpperCase() || undefined,
      color: editingCurrentGroupColor || selectedGroupObj.color,
    });
    setIsEditingCurrentGroup(false);
  };

  const handleDeleteSelectedGroup = () => {
    if (!groupId || !onDeleteGroup) return;
    onDeleteGroup(groupId);
    setGroupId('');
    setConfirmDeleteGroup(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const activityData: Activity = {
      id: initialActivity ? initialActivity.id : 'act_' + Math.random().toString(36).substring(2, 9),
      code: code.trim().toUpperCase() || undefined,
      groupId: groupId || null,
      name: name.trim(),
      color,
      startDate,
      hasEndDate,
      endDate: hasEndDate ? (endDate || startDate) : null,
      isCompleted,
      scheduleType,
      activeDays,
      subActivities,
      notes,
    };

    onSave(activityData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-base font-bold text-slate-900">
              {initialActivity ? 'Editar Actividad' : 'Nueva Actividad'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Row 1: Name, Code, and Color Selection */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nombre de la actividad *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Meditar, 10 Planchas, Videos..."
                  required
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Código Corto
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. MED"
                  maxLength={6}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold uppercase text-center text-slate-900"
                  title="Código identificador (se mostrará cuando la columna se comprima)"
                />
              </div>
            </div>

            {/* Color Palette (16 distinct colors) */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Color de la Actividad (16 colores)
                </label>
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: color }} />
                  {COLOR_PALETTE.find(c => c.hex.toLowerCase() === color.toLowerCase())?.name || color}
                </span>
              </div>
              <div className="grid grid-cols-8 gap-2 pt-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-transform cursor-pointer mx-auto ${
                      color.toLowerCase() === c.hex.toLowerCase()
                        ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-xs'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Group assignment with vertical flow requested */}
          <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            {/* Línea 1: Grupo de Actividades (Categoría) */}
            <label className="block text-xs font-semibold text-slate-700">
              Grupo de Actividades (Categoría)
            </label>

            {/* Formulario crear nuevo grupo inline */}
            {isCreatingNewGroup && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">Nuevo Grupo</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nombre del grupo (ej. Salud, Trabajo)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    placeholder="Cód (SAL)"
                    maxLength={5}
                    className="w-full sm:w-20 px-2 py-1.5 text-xs font-mono font-bold uppercase text-center bg-slate-50 border border-slate-200 rounded-md focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleInlineGroupCreate}
                    disabled={!newGroupName.trim()}
                    className="flex-1 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-md disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    Crear y Asignar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewGroup(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Formulario editar grupo inline */}
            {isEditingCurrentGroup && selectedGroupObj && (
              <div className="bg-white p-3 rounded-lg border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Editar Grupo: {selectedGroupObj.name}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingCurrentGroup(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editingCurrentGroupName}
                    onChange={(e) => setEditingCurrentGroupName(e.target.value)}
                    placeholder="Nombre..."
                    className="flex-1 px-3 py-1 text-xs border border-slate-200 rounded-md focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={editingCurrentGroupCode}
                    onChange={(e) => setEditingCurrentGroupCode(e.target.value.toUpperCase())}
                    placeholder="Código (ej. SAL)..."
                    maxLength={5}
                    className="w-full sm:w-24 px-2 py-1 text-xs font-mono font-bold uppercase text-center border border-slate-200 rounded-md focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveEditSelectedGroup}
                    className="flex-1 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-md cursor-pointer"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCurrentGroup(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Modo estándar con las 4 líneas requeridas */}
            {!isCreatingNewGroup && !isEditingCurrentGroup && (
              <div className="space-y-2">
                {/* Línea 2: Caja de grupos (Select desplegable) */}
                <select
                  value={groupId}
                  onChange={(e) => {
                    setGroupId(e.target.value);
                    setConfirmDeleteGroup(false);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
                >
                  <option value="">Sin grupo (General)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.code ? `[${g.code}] ` : ''}{g.name}
                    </option>
                  ))}
                </select>

                {/* Línea 3: Botones Editar y Borrar */}
                {selectedGroupObj && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startEditSelectedGroup}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
                      title="Renombrar o cambiar código del grupo"
                    >
                      Editar
                    </button>

                    {confirmDeleteGroup ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={handleDeleteSelectedGroup}
                          className="px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded-md cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteGroup(false)}
                          className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGroup(true)}
                        className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
                        title="Eliminar este grupo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Borrar</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Línea 4: + Crear nuevo grupo */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewGroup(true);
                      setIsEditingCurrentGroup(false);
                      setConfirmDeleteGroup(false);
                    }}
                    className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    + Crear nuevo grupo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Dates & Duration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            {/* Línea 1: Solo el texto "Vigencia y Rango de Fechas" */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Vigencia y Rango de Fechas</span>
            </div>

            {/* Cajas de Fecha de Inicio y Fecha de Finalización */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Fecha de Inicio</label>
                  <div className="flex gap-1.5 text-[11px] text-amber-800 font-bold">
                    <button type="button" onClick={() => setStartDate(getTodayDateString())} className="hover:underline cursor-pointer">Hoy</button>
                    <span>·</span>
                    <button type="button" onClick={() => setStartDate(getTomorrowDateString())} className="hover:underline cursor-pointer">Mañana</button>
                  </div>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-semibold ${hasEndDate ? 'text-slate-600' : 'text-slate-400'}`}>
                  Fecha de Finalización
                </label>
                <input
                  type="date"
                  value={endDate}
                  disabled={!hasEndDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    hasEndDate
                      ? 'bg-white border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            {/* Línea después de la caja de fecha de finalización: Sin fecha final */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!hasEndDate}
                  onChange={(e) => setHasEndDate(!e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  Sin fecha final (Se extiende indefinidamente)
                </span>
              </label>
            </div>
          </div>

          {/* Row 4: Schedule Patterns */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Patrón de Repetición / Días Activos
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduleType('daily');
                  setActiveDays([0, 1, 2, 3, 4, 5, 6]);
                }}
                className={`p-2.5 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                  scheduleType === 'daily'
                    ? 'border-amber-400 bg-amber-100 text-amber-950 font-bold ring-1 ring-amber-400/40 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">Diario (Todos los días)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">1 casilla por día (ej. Meditar)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScheduleType('specific_days');
                  setActiveDays([1, 2, 3, 4, 5, 6]);
                }}
                className={`p-2.5 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                  scheduleType === 'specific_days'
                    ? 'border-amber-400 bg-amber-100 text-amber-950 font-bold ring-1 ring-amber-400/40 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">Días Específicos</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Ej. Lun-Sáb sin domingos (ej. Videos)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScheduleType('finite');
                  setHasEndDate(true);
                  if (!endDate) setEndDate(startDate);
                }}
                className={`p-2.5 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                  scheduleType === 'finite'
                    ? 'border-amber-400 bg-amber-100 text-amber-950 font-bold ring-1 ring-amber-400/40 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">Evento Puntual / Finito</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Rango cerrado (ej. Compartir fotos)</div>
              </button>
            </div>

            {/* Weekday Selector */}
            {scheduleType === 'specific_days' && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Días de la semana habilitados:</span>
                  <div className="flex gap-2 text-[11px] font-bold text-amber-800">
                    <button
                      type="button"
                      onClick={() => setActiveDays([1, 2, 3, 4, 5, 6])}
                      className="hover:underline cursor-pointer"
                    >
                      Lun a Sáb (Sin domingos)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setActiveDays([1, 2, 3, 4, 5])}
                      className="hover:underline cursor-pointer"
                    >
                      Lun a Vie
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setActiveDays([0, 1, 2, 3, 4, 5, 6])}
                      className="hover:underline cursor-pointer"
                    >
                      Todos
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((w) => {
                    const isSelected = activeDays.includes(w.day);
                    return (
                      <button
                        key={w.day}
                        type="button"
                        onClick={() => toggleDay(w.day)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-500/40 shadow-2xs ring-1 ring-amber-400/40'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 5: Sub-activities & Multiple Sessions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            {/* Primera línea: Título */}
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Sesiones o Sub-Actividades con Código</span>
            </h4>

            {/* Siguientes líneas: Descripción */}
            <p className="text-xs text-slate-500 leading-relaxed">
              Cada sub-actividad tiene su código y casilla esférica. La casilla cuadrada principal se completa al marcar todas las sesiones.
            </p>

            {/* Siguiente línea: Botones 1 caja, 2 cajas, 3 cajas y nada más */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSessionsCountChange(0)}
                className={`flex-1 py-2 px-3 text-xs rounded-lg font-bold cursor-pointer transition-all border text-center ${
                  subActivities.length === 0 
                    ? 'bg-amber-400 text-slate-950 border-amber-500/40 shadow-2xs ring-1 ring-amber-400/40' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="1 sola casilla por día"
              >
                1 caja
              </button>
              <button
                type="button"
                onClick={() => handleSessionsCountChange(2)}
                className={`flex-1 py-2 px-3 text-xs rounded-lg font-bold cursor-pointer transition-all border text-center ${
                  subActivities.length === 2 
                    ? 'bg-amber-400 text-slate-950 border-amber-500/40 shadow-2xs ring-1 ring-amber-400/40' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                2 cajas
              </button>
              <button
                type="button"
                onClick={() => handleSessionsCountChange(3)}
                className={`flex-1 py-2 px-3 text-xs rounded-lg font-bold cursor-pointer transition-all border text-center ${
                  subActivities.length === 3 
                    ? 'bg-amber-400 text-slate-950 border-amber-500/40 shadow-2xs ring-1 ring-amber-400/40' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Ejemplo: 10 planchas en 3 sesiones"
              >
                3 cajas
              </button>
            </div>

            {/* Sub-activities List with code and custom names */}
            {subActivities.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Sub-actividades generadas ({subActivities.length}):</span>
                  <button
                    type="button"
                    onClick={handleAddSubActivity}
                    className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otra sesión</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subActivities.map((sub, index) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={sub.code || `S${index + 1}`}
                        onChange={(e) => handleUpdateSubActivityCode(sub.id, e.target.value)}
                        placeholder="Cód"
                        maxLength={5}
                        className="w-16 px-2 py-1.5 text-xs font-mono font-bold text-center uppercase bg-slate-100 border border-slate-200 rounded-md focus:outline-hidden focus:border-amber-500"
                        title="Código de la sub-actividad"
                      />
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => handleUpdateSubActivityName(sub.id, e.target.value)}
                        placeholder={`Nombre de sesión o paso ${index + 1}...`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubActivity(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Completion Status Toggle */}
          <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            {/* Primera línea: Título */}
            <span className="text-xs font-semibold text-slate-900">Estado de la Actividad</span>

            {/* Segunda línea: Descripción */}
            <p className="text-xs text-slate-500">
              {isCompleted ? 'Marcada como terminada / archivada.' : 'Activa en el seguimiento diario.'}
            </p>

            {/* Siguiente línea: Botón En Curso / ✓ Terminada (icono y texto en la misma línea) */}
            <div>
              <button
                type="button"
                onClick={() => setIsCompleted(!isCompleted)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isCompleted ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Terminada</span>
                  </>
                ) : (
                  <span>En Curso</span>
                )}
              </button>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg disabled:opacity-50 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {initialActivity ? 'Guardar Cambios' : 'Crear Actividad'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
