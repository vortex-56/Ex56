import React, { useState, useMemo, useEffect } from 'react';
import { Activity, ActivityGroup, Project, SubActivity } from '../types';
import { isActivityActiveOnDate, getTodayDateString, formatFriendlyDate } from '../utils/dateUtils';
import {
  Calendar,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  Sparkles,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project | null;
  onToggleCell: (activityId: string, subActivityId: string | null, dateStr: string) => void;
  onToggleParentDay: (activity: Activity, dateStr: string) => void;
  onUpdateProjectMissionsVisibility: (visibleActivityIds: string[]) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onToggleCell,
  onToggleParentDay,
  onUpdateProjectMissionsVisibility,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  // Collapsed state for sub-activities per activity (clicking code toggles this)
  const [collapsedSubBoxes, setCollapsedSubBoxes] = useState<Record<string, boolean>>({});

  const todayStr = getTodayDateString();

  const activities = currentProject?.activities || [];
  const groups = currentProject?.groups || [];
  const completionLogs = currentProject?.completionLogs || {};

  // Stored visible activity IDs from project (or fallback to localStorage)
  const savedOrderedIds: string[] = useMemo(() => {
    if (currentProject?.dailyMissionsCustomIds && currentProject.dailyMissionsCustomIds.length > 0) {
      return currentProject.dailyMissionsCustomIds;
    }
    // Check localStorage fallback
    if (currentProject?.id) {
      try {
        const stored = localStorage.getItem(`planmatrix_daily_missions_${currentProject.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    // Default: all activities that are active today
    const activeToday = activities
      .filter(act => isActivityActiveOnDate(act, todayStr))
      .map(act => act.id);

    return activeToday.length > 0 ? activeToday : activities.map(a => a.id);
  }, [currentProject?.dailyMissionsCustomIds, currentProject?.id, activities, todayStr]);

  // Draft state during edit mode (maintains both selection and custom order)
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [draftSelectedSet, setDraftSelectedSet] = useState<Set<string>>(new Set());

  // Initialize draft when modal opens or edit mode starts
  useEffect(() => {
    if (isOpen) {
      // Build an initial draft order: activities in savedOrderedIds first, then remaining activities
      const orderedExisting = savedOrderedIds.filter(id => activities.some(a => a.id === id));
      const remainingIds = activities.map(a => a.id).filter(id => !orderedExisting.includes(id));
      const fullOrder = [...orderedExisting, ...remainingIds];

      setDraftOrder(fullOrder);
      setDraftSelectedSet(new Set(savedOrderedIds));
      setIsEditMode(false);
      setSearchFilter('');
    }
  }, [isOpen, savedOrderedIds, activities]);

  if (!isOpen) return null;

  // Toggle hiding sub-activity boxes for a specific activity (clicking its code)
  const toggleCollapseSubBoxes = (actId: string) => {
    setCollapsedSubBoxes(prev => ({
      ...prev,
      [actId]: !prev[actId],
    }));
  };

  // Helper code generator
  const getActivityCode = (act: Activity, idx: number) => {
    if (act.code && act.code.trim()) return act.code.trim().toUpperCase();
    return `A${String(idx + 1).padStart(2, '0')}`;
  };

  const getSubCode = (sub: SubActivity, parentCode: string, idx: number) => {
    if (sub.code && sub.code.trim()) return sub.code.trim().toUpperCase();
    return `${parentCode}.${idx + 1}`;
  };

  // Check parent status for an activity today
  const getActivityTodayStatus = (act: Activity) => {
    if (act.subActivities.length === 0) {
      const isDone = !!completionLogs[`${act.id}_main_${todayStr}`];
      return { isDone, completedSubs: isDone ? 1 : 0, totalSubs: 1 };
    }
    const totalSubs = act.subActivities.length;
    let completedSubs = 0;
    for (const sub of act.subActivities) {
      if (completionLogs[`${act.id}_${sub.id}_${todayStr}`]) {
        completedSubs++;
      }
    }
    return {
      isDone: completedSubs === totalSubs && totalSubs > 0,
      completedSubs,
      totalSubs,
    };
  };

  const isSubDoneToday = (actId: string, subId: string) => {
    return !!completionLogs[`${actId}_${subId}_${todayStr}`];
  };

  // List of activities to show in Normal View Mode (preserving custom order)
  const visibleActivities = savedOrderedIds
    .map(id => activities.find(a => a.id === id))
    .filter((a): a is Activity => a !== undefined);

  // Today's summary progress
  const progressStats = (() => {
    if (visibleActivities.length === 0) return { total: 0, completed: 0, percentage: 0 };
    let completed = 0;
    for (const act of visibleActivities) {
      const status = getActivityTodayStatus(act);
      if (status.isDone) completed++;
    }
    const total = visibleActivities.length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, percentage };
  })();

  // Edit Mode: Reordering actions (Subir / Bajar / Al Top)
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setDraftOrder(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= draftOrder.length - 1) return;
    setDraftOrder(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleMoveToTop = (index: number) => {
    if (index <= 0) return;
    setDraftOrder(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Edit Mode: Toggle selection of an activity
  const handleToggleSelectDraft = (id: string) => {
    setDraftSelectedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Edit Mode presets
  const handleSelectAllDraft = () => {
    setDraftSelectedSet(new Set(activities.map(a => a.id)));
  };

  const handleDeselectAllDraft = () => {
    setDraftSelectedSet(new Set());
  };

  const handleSelectTodayDraft = () => {
    const todayIds = activities
      .filter(act => isActivityActiveOnDate(act, todayStr))
      .map(act => act.id);
    setDraftSelectedSet(new Set(todayIds));
  };

  // Save selection and ordering
  const handleSaveEdit = () => {
    // Only keep IDs that are currently selected, in the order defined by draftOrder
    const finalOrderedSelected = draftOrder.filter(id => draftSelectedSet.has(id));
    onUpdateProjectMissionsVisibility(finalOrderedSelected);
    if (currentProject?.id) {
      try {
        localStorage.setItem(
          `planmatrix_daily_missions_${currentProject.id}`,
          JSON.stringify(finalOrderedSelected)
        );
      } catch {
        // ignore
      }
    }
    setIsEditMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex font-sans overflow-hidden">
      {/* Click-outside backdrop without blur to keep page clearly legible */}
      <div 
        className="fixed inset-0 bg-slate-900/20 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Drawer Container: Attached flush to the left edge */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-xl bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col animate-in slide-in-from-left duration-250 ease-out">
        
        {/* Header: White header with amber/yellow icon & Pencil button */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Yellow icon with black calendar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-400 to-yellow-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-xs shrink-0 select-none">
              <Calendar className="w-4.5 h-4.5 stroke-[2.5] text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Misiones Diarias
                </h2>
                {/* Pencil Button directly beside title */}
                <button
                  type="button"
                  onClick={() => setIsEditMode(prev => !prev)}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-bold ring-1 ring-amber-500/30'
                      : 'text-slate-500 hover:text-amber-800 hover:bg-amber-50 border border-slate-200'
                  }`}
                  title={isEditMode ? 'Volver a ver misiones' : 'Editar qué misiones ver y ordenarlas'}
                >
                  <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span className="text-[11px] font-semibold">{isEditMode ? 'Ver misiones' : 'Editar'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Escoge las misiones a mostrar y ordénalas para poner las prioritarias al top.'
                  : `Guía rápida para tu jornada (${formatFriendlyDate(todayStr)}).`}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress & Quick stats bar */}
        {!isEditMode && (
          <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Progreso de hoy:</span>
              <span className="font-bold text-slate-900">
                {progressStats.completed} de {progressStats.total} completadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressStats.percentage}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                {progressStats.percentage}%
              </span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 matrix-scroll">
          
          {/* TAB A: Normal View Mode (Only Activity Boxes, No bulky group containers) */}
          {!isEditMode && (
            <>
              {visibleActivities.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      No hay misiones seleccionadas para hoy
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Haz clic en el botón de lápiz arriba para escoger qué actividades ver y ordenarlas según tu prioridad.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg shadow-xs cursor-pointer active:scale-95"
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Configurar Misiones Diarias</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleActivities.map((act, idx) => {
                    const actCode = getActivityCode(act, idx);
                    const group = groups.find(g => g.id === act.groupId);
                    const status = getActivityTodayStatus(act);
                    const hasSubs = act.subActivities.length > 0;
                    const isSubsCollapsed = !!collapsedSubBoxes[act.id];

                    // Group details to display below activity name
                    const groupColor = group?.color || '#94a3b8';
                    const groupCode = group?.code || (group ? group.name.slice(0, 3).toUpperCase() : 'GEN');
                    const groupName = group ? group.name : 'General';

                    return (
                      <div
                        key={act.id}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          status.isDone
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        {/* Left Side: Code Badge + Activity Name + Group Details below */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Activity Code Badge: Clicking toggles saving/collapsing its sub-activity boxes! */}
                          <button
                            type="button"
                            onClick={() => {
                              if (hasSubs) {
                                toggleCollapseSubBoxes(act.id);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold text-white shadow-2xs shrink-0 transition-transform ${
                              hasSubs
                                ? 'cursor-pointer hover:scale-105 active:scale-95'
                                : 'cursor-default'
                            }`}
                            style={{ backgroundColor: act.color }}
                            title={
                              hasSubs
                                ? (isSubsCollapsed
                                    ? `Sesiones plegadas. Clic para desplegar las ${act.subActivities.length} sesiones.`
                                    : `Sesiones visibles. Clic para guardar/plegar las sesiones y optimizar espacio.`)
                                : `Código: ${actCode}`
                            }
                          >
                            <span>{actCode}</span>
                            {hasSubs && (
                              <span className="ml-1 text-[9px] opacity-90">
                                {isSubsCollapsed ? '▶' : '▼'}
                              </span>
                            )}
                          </button>

                          {/* Name and Group Info line below (NO text like "0/3 completadas") */}
                          <div className="min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-bold block truncate ${
                                status.isDone ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}
                              title={act.name}
                            >
                              {act.name}
                            </span>

                            {/* Line below: Color dot, group code, and group name */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: groupColor }}
                              />
                              <span
                                className="font-mono font-bold text-[10px] px-1 py-0.2 rounded"
                                style={{
                                  backgroundColor: `${groupColor}1f`,
                                  color: groupColor,
                                }}
                              >
                                {groupCode}
                              </span>
                              <span className="truncate font-medium text-slate-600">
                                {groupName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Smaller subactivity boxes in a row to the left + Main Box */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Sub-activity boxes in horizontal row TO THE LEFT of the main box */}
                          {hasSubs && !isSubsCollapsed && (
                            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                              {act.subActivities.map((sub, sIdx) => {
                                const subDone = isSubDoneToday(act.id, sub.id);
                                const subCode = getSubCode(sub, actCode, sIdx);

                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => onToggleCell(act.id, sub.id, todayStr)}
                                    className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                                      subDone
                                        ? 'text-white border-transparent'
                                        : 'border-slate-300 bg-white hover:border-slate-400'
                                    }`}
                                    style={
                                      subDone
                                        ? { backgroundColor: act.color, borderColor: act.color }
                                        : undefined
                                    }
                                    title={`${subCode} (${sub.name}): ${subDone ? 'Completada' : 'Pendiente'}`}
                                  >
                                    {subDone ? (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    ) : (
                                      <span className="text-[9px] font-bold text-slate-400">
                                        {sIdx + 1}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Main Activity Box (Square) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (hasSubs) {
                                onToggleParentDay(act, todayStr);
                              } else {
                                onToggleCell(act.id, null, todayStr);
                              }
                            }}
                            className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                              status.isDone
                                ? 'text-white border-transparent'
                                : hasSubs && status.completedSubs > 0
                                ? 'border-amber-400 bg-amber-100 text-amber-950 text-xs font-bold'
                                : 'border-slate-300 bg-white hover:border-amber-400'
                            }`}
                            style={
                              status.isDone
                                ? { backgroundColor: act.color, borderColor: act.color }
                                : undefined
                            }
                            title={
                              hasSubs
                                ? status.isDone
                                  ? 'Todas las sesiones completadas hoy. Clic para desmarcar.'
                                  : `${status.completedSubs}/${status.totalSubs} sesiones hechas. Clic para marcar todas.`
                                : status.isDone
                                ? 'Completada hoy. Clic para desmarcar.'
                                : 'Pendiente hoy. Clic para completar.'
                            }
                          >
                            {status.isDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : hasSubs && status.completedSubs > 0 ? (
                              <span className="font-mono text-[10px] font-bold">
                                {status.completedSubs}
                              </span>
                            ) : null}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB B: Edit Mode (Select which activities to display & reorder position with Up/Down) */}
          {isEditMode && (
            <div className="space-y-3">
              {/* Filter & Presets bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                    <span>Selección y Prioridad ({draftSelectedSet.size} visibles)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={handleSelectAllDraft}
                      className="text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                    >
                      Todas
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleSelectTodayDraft}
                      className="text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                      title="Seleccionar solo las que tocan hoy según su calendario"
                    >
                      Solo de hoy
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllDraft}
                      className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Ninguna
                    </button>
                  </div>
                </div>

                {/* Search input */}
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar actividad para ordenar..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Orderable and selectable activity cards */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 matrix-scroll">
                {draftOrder
                  .map((id, index) => {
                    const act = activities.find(a => a.id === id);
                    if (!act) return null;
                    if (searchFilter && !act.name.toLowerCase().includes(searchFilter.toLowerCase())) {
                      return null;
                    }
                    const isSelected = draftSelectedSet.has(act.id);
                    const actCode = getActivityCode(act, index);
                    const group = groups.find(g => g.id === act.groupId);
                    const groupColor = group?.color || '#94a3b8';
                    const groupCode = group?.code || (group ? group.name.slice(0, 3).toUpperCase() : 'GEN');
                    const groupName = group ? group.name : 'General';
                    const isScheduledToday = isActivityActiveOnDate(act, todayStr);

                    return (
                      <div
                        key={act.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                            : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* Left: Reorder buttons (Move to Top, Move Up, Move Down) */}
                        <div className="flex items-center gap-0.5 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleMoveToTop(index)}
                            disabled={index === 0}
                            className="p-1 text-slate-500 hover:text-amber-800 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
                            title="Mover al top (primera posición)"
                          >
                            <ChevronsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 text-slate-500 hover:text-amber-800 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
                            title="Subir un puesto"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === draftOrder.length - 1}
                            className="p-1 text-slate-500 hover:text-amber-800 disabled:opacity-20 disabled:cursor-not-allowed rounded hover:bg-white transition-colors cursor-pointer"
                            title="Bajar un puesto"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Middle: Checkbox + Code + Name + Group below */}
                        <div
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                          onClick={() => handleToggleSelectDraft(act.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectDraft(act.id)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: act.color }}
                          >
                            {actCode}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {act.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: groupColor }}
                              />
                              <span className="font-mono font-bold" style={{ color: groupColor }}>
                                {groupCode}
                              </span>
                              <span>{groupName}</span>
                              {isScheduledToday ? (
                                <span className="text-emerald-600 font-semibold">• Toca hoy</span>
                              ) : (
                                <span className="text-slate-400">• Otro día</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Subactivities count badge */}
                        {act.subActivities.length > 0 && (
                          <span className="text-[10px] font-mono font-semibold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                            {act.subActivities.length} ses.
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Edit Mode Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Guardar Orden y Misiones ({draftSelectedSet.size})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Matching GroupModal footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isEditMode
              ? 'Usa las flechas para subir al top tus misiones prioritarias.'
              : 'Haz clic en el código de una actividad para plegar o mostrar sus sesiones.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
