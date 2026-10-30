import React, { useState, useMemo } from 'react';
import { Activity, ActivityGroup, DayInfo, SubActivity, GroupViewState } from '../types';
import { isActivityActiveOnDate, getClusterDatesForDate } from '../utils/dateUtils';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronUp,
  ChevronLeft, 
  Edit2, 
  Trash2, 
  Check, 
  SlidersHorizontal,
  CalendarDays,
  Maximize2,
  Minimize2,
  Activity as ActivityIcon
} from 'lucide-react';
import { ActivityAnalyzer } from './ActivityAnalyzer';

interface MatrixGridProps {
  days: DayInfo[];
  activities: Activity[];
  groups: ActivityGroup[];
  completionLogs: Record<string, boolean>;
  onToggleCell: (activityId: string, subActivityId: string | null, dateStr: string) => void;
  onToggleParentDay: (activity: Activity, dateStr: string) => void;
  onToggleGroupDay?: (group: ActivityGroup, dateStr: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddSubActivityQuick: (activity: Activity) => void;
  onEditGroup?: (group: ActivityGroup) => void;
  onDeleteGroup?: (groupId: string) => void;
  selectedActivityIds: string[];
  onToggleSelectActivity: (activityId: string) => void;
  onToggleSelectAll: () => void;
  selectedGroupIds: string[];
  onToggleSelectGroup: (groupId: string) => void;
  onPrevDateWindow: () => void;
  onNextDateWindow: () => void;
  onTodayWindow: () => void;
  onOpenTimeSettings: () => void;
  activeFilterGroup: string | null;
  onSetFilterGroup: (groupId: string | null) => void;
  onToggleActivityCompletion?: (activityId: string, isCompleted: boolean) => void;
  onCompleteActiveSlot?: (activityId: string, markDone: boolean) => void;
  onToggleSubInActiveSlot?: (activityId: string, subId: string, markDone: boolean) => void;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  days,
  activities,
  groups,
  completionLogs,
  onToggleCell,
  onToggleParentDay,
  onToggleGroupDay,
  onEditActivity,
  onDeleteActivity,
  onAddSubActivityQuick,
  onEditGroup,
  onDeleteGroup,
  selectedActivityIds,
  onToggleSelectActivity,
  onToggleSelectAll,
  selectedGroupIds,
  onToggleSelectGroup,
  onPrevDateWindow,
  onNextDateWindow,
  onTodayWindow,
  onOpenTimeSettings,
  activeFilterGroup,
  onSetFilterGroup,
  onToggleActivityCompletion,
  onCompleteActiveSlot,
  onToggleSubInActiveSlot,
}) => {
  // Activity Analyzer state (up to 3 activities)
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [analyzedActivityIds, setAnalyzedActivityIds] = useState<string[]>([]);

  const handleAddAnalyzedActivity = (activityId: string) => {
    if (analyzedActivityIds.includes(activityId) || analyzedActivityIds.length >= 3) return;
    setAnalyzedActivityIds(prev => [...prev, activityId]);
  };

  const handleRemoveAnalyzedActivity = (activityId: string) => {
    setAnalyzedActivityIds(prev => prev.filter(id => id !== activityId));
  };

  // 3-state posture for groups:
  // 'expanded_all': flecha abajo, grupo y todas sus subactividades desplegadas
  // 'collapsed_subactivities': flecha arriba, actividades visibles pero subactividades plegadas
  // 'collapsed_group': flecha derecha, grupo totalmente plegado (actividades ocultas)
  const [groupPostures, setGroupPostures] = useState<Record<string, GroupViewState>>({});

  // Individual subactivity expand toggle for fine-tuning
  const [individualExpandedSubs, setIndividualExpandedSubs] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Column width mode: true = Solo Códigos; false = Extendido con nombres
  const [isCompactWidth, setIsCompactWidth] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // User-resizable column width in expanded mode
  const [expandedWidth, setExpandedWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 165;
    }
    return 330;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Drag resizer handlers
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = expandedWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const minW = window.innerWidth < 640 ? 110 : 190;
      const maxW = window.innerWidth < 640 ? Math.min(320, window.innerWidth - 30) : 750;
      const nextW = Math.round(Math.min(Math.max(minW, startWidth + delta), maxW));
      setExpandedWidth(nextW);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStartResize = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.touches[0].clientX;
    const startWidth = expandedWidth;

    const onTouchMove = (moveEvent: TouchEvent) => {
      const delta = moveEvent.touches[0].clientX - startX;
      const minW = 110;
      const maxW = Math.min(320, window.innerWidth - 30);
      const nextW = Math.round(Math.min(Math.max(minW, startWidth + delta), maxW));
      setExpandedWidth(nextW);
    };

    const onTouchEnd = () => {
      setIsResizing(false);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  };

  const leftColStyle = useMemo(() => {
    if (isCompactWidth) return undefined;
    return {
      width: `${expandedWidth}px`,
      minWidth: `${expandedWidth}px`,
      maxWidth: `${expandedWidth}px`,
    };
  }, [isCompactWidth, expandedWidth]);

  const leftColClass = isCompactWidth
    ? 'w-[48px] min-w-[48px] max-w-[48px] sm:w-[80px] sm:min-w-[80px] sm:max-w-[80px]'
    : '';

  // 3-state posture cycle:
  // Estado 1 (derecha): 'collapsed_group' -> oculta todas las actividades
  // Estado 2 (abajo): 'collapsed_subactivities' -> muestra actividades con subactividades ocultas
  // Estado 3 (arriba): 'expanded_all' -> muestra actividades y todas sus subactividades
  const cycleGroupPosture = (groupId: string, groupActivityIds: string[]) => {
    setGroupPostures(prev => {
      const current = prev[groupId] || 'expanded_all';
      let next: GroupViewState = 'expanded_all';
      if (current === 'collapsed_group') {
        next = 'collapsed_subactivities'; // derecha -> abajo
      } else if (current === 'collapsed_subactivities') {
        next = 'expanded_all'; // abajo -> arriba
      } else {
        next = 'collapsed_group'; // arriba -> derecha
      }
      return { ...prev, [groupId]: next };
    });

    // Reset individual activity overrides for this group so the group posture batch state takes effect cleanly
    setIndividualExpandedSubs(prev => {
      const updated = { ...prev };
      for (const id of groupActivityIds) {
        delete updated[id];
      }
      return updated;
    });
  };

  const toggleSubActivityExpand = (activityId: string, groupPosture: GroupViewState) => {
    setIndividualExpandedSubs(prev => {
      const currentExpanded = prev[activityId] !== undefined
        ? prev[activityId]
        : (groupPosture === 'expanded_all');
      return {
        ...prev,
        [activityId]: !currentExpanded,
      };
    });
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activeFilterGroup && act.groupId !== activeFilterGroup) return false;
      if (searchQuery.trim() && !act.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [activities, activeFilterGroup, searchQuery]);

  // Group activities into categories
  const groupedData = useMemo(() => {
    const map = new Map<string, { group: ActivityGroup | null; items: Activity[] }>();

    for (const g of groups) {
      map.set(g.id, { group: g, items: [] });
    }
    map.set('__ungrouped__', { group: null, items: [] });

    for (const act of filteredActivities) {
      if (act.groupId && map.has(act.groupId)) {
        map.get(act.groupId)!.items.push(act);
      } else {
        map.get('__ungrouped__')!.items.push(act);
      }
    }

    return Array.from(map.values()).filter(entry => entry.items.length > 0 || (entry.group && !activeFilterGroup));
  }, [filteredActivities, groups, activeFilterGroup]);

  // Helper codes
  const getActivityCode = (act: Activity, idx: number) => {
    if (act.code && act.code.trim()) return act.code.trim().toUpperCase();
    return `A${String(idx + 1).padStart(2, '0')}`;
  };

  const getSubCode = (sub: SubActivity, parentCode: string, idx: number) => {
    if (sub.code && sub.code.trim()) return sub.code.trim().toUpperCase();
    return `${parentCode}.${idx + 1}`;
  };

  const getGroupCode = (group: ActivityGroup, idx: number) => {
    if (group.code && group.code.trim()) return group.code.trim().toUpperCase();
    return `G${String(idx + 1).padStart(2, '0')}`;
  };

  // Check parent day status (considering cluster grouping if scheduleType === 'day_clusters')
  const getParentDayStatus = (activity: Activity, dateStr: string) => {
    if (activity.scheduleType === 'day_clusters') {
      const clusterDates = getClusterDatesForDate(activity, dateStr);
      if (activity.subActivities.length === 0) {
        const isClusterChecked = clusterDates.some(d => !!completionLogs[`${activity.id}_main_${d}`]);
        return {
          hasSub: false,
          isCompleted: isClusterChecked,
          completedCount: isClusterChecked ? 1 : 0,
          totalCount: 1,
          clusterDates,
        };
      }
      const total = activity.subActivities.length;
      let completedSubCount = 0;
      for (const sub of activity.subActivities) {
        const isDoneInCluster = clusterDates.some(d => !!completionLogs[`${activity.id}_${sub.id}_${d}`]);
        if (isDoneInCluster) completedSubCount++;
      }
      return {
        hasSub: true,
        isCompleted: completedSubCount === total && total > 0,
        completedCount: completedSubCount,
        totalCount: total,
        clusterDates,
      };
    }

    if (activity.subActivities.length === 0) {
      const key = `${activity.id}_main_${dateStr}`;
      return {
        hasSub: false,
        isCompleted: !!completionLogs[key],
        completedCount: completionLogs[key] ? 1 : 0,
        totalCount: 1,
        clusterDates: [dateStr],
      };
    }

    const total = activity.subActivities.length;
    let completed = 0;
    for (const sub of activity.subActivities) {
      const key = `${activity.id}_${sub.id}_${dateStr}`;
      if (completionLogs[key]) completed++;
    }

    return {
      hasSub: true,
      isCompleted: completed === total && total > 0,
      completedCount: completed,
      totalCount: total,
      clusterDates: [dateStr],
    };
  };

  // Helper to check subactivity status
  const isSubCompletedOnDate = (activity: Activity, subId: string, dateStr: string) => {
    if (activity.scheduleType === 'day_clusters') {
      const clusterDates = getClusterDatesForDate(activity, dateStr);
      return clusterDates.some(d => !!completionLogs[`${activity.id}_${subId}_${d}`]);
    }
    return !!completionLogs[`${activity.id}_${subId}_${dateStr}`];
  };

  // Check group day status for group box
  const getGroupDayStatus = (groupActivities: Activity[], dateStr: string) => {
    const activeActs = groupActivities.filter(a => isActivityActiveOnDate(a, dateStr));
    if (activeActs.length === 0) return { hasActs: false, isCompleted: false, count: 0, total: 0 };
    let completed = 0;
    for (const act of activeActs) {
      const status = getParentDayStatus(act, dateStr);
      if (status.isCompleted) completed++;
    }
    return {
      hasActs: true,
      isCompleted: completed === activeActs.length && activeActs.length > 0,
      count: completed,
      total: activeActs.length,
    };
  };

  // Helper to compute total activities (A) and total completed executions for a group
  const getGroupStats = (items: Activity[]) => {
    const totalActivities = items.length;
    let totalCompletions = 0;

    for (const act of items) {
      if (act.scheduleType === 'day_clusters') {
        const completedClusters = new Set<string>();
        for (const logKey of Object.keys(completionLogs)) {
          if (!completionLogs[logKey] || !logKey.startsWith(`${act.id}_`)) continue;
          const parts = logKey.split('_');
          const dateStr = parts[parts.length - 1];
          const clusterDates = getClusterDatesForDate(act, dateStr);
          if (clusterDates.length === 0) continue;
          const clusterKey = clusterDates.slice().sort().join('|');
          if (completedClusters.has(clusterKey)) continue;

          if (act.subActivities.length === 0) {
            const isDone = clusterDates.some(d => !!completionLogs[`${act.id}_main_${d}`]);
            if (isDone) completedClusters.add(clusterKey);
          } else {
            const allSubsDone = act.subActivities.every(sub =>
              clusterDates.some(d => !!completionLogs[`${act.id}_${sub.id}_${d}`])
            );
            if (allSubsDone) completedClusters.add(clusterKey);
          }
        }
        totalCompletions += completedClusters.size;
      } else {
        const completedDates = new Set<string>();
        for (const logKey of Object.keys(completionLogs)) {
          if (!completionLogs[logKey] || !logKey.startsWith(`${act.id}_`)) continue;
          const parts = logKey.split('_');
          const dateStr = parts[parts.length - 1];
          if (completedDates.has(dateStr)) continue;

          if (act.subActivities.length === 0) {
            if (completionLogs[`${act.id}_main_${dateStr}`]) {
              completedDates.add(dateStr);
            }
          } else {
            const allSubsDone = act.subActivities.every(
              sub => !!completionLogs[`${act.id}_${sub.id}_${dateStr}`]
            );
            if (allSubsDone) {
              completedDates.add(dateStr);
            }
          }
        }
        totalCompletions += completedDates.size;
      }

      if (act.isCompleted && totalCompletions === 0 && items.length === 1) {
        totalCompletions += 1;
      }
    }

    return { totalActivities, totalCompletions };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Matrix Controls Header with larger, legible typography */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
        
        {/* Left: Search & Group Filter */}
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar actividad..."
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-1/2 sm:w-48 font-medium"
          />

          <div className="flex items-center gap-1.5 flex-1 sm:flex-none min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden xs:inline" />
            <select
              value={activeFilterGroup || ''}
              onChange={(e) => onSetFilterGroup(e.target.value === '' ? null : e.target.value)}
              className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-full sm:w-auto truncate font-medium"
            >
              <option value="">Todos los grupos ({activities.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code ? `[${g.code}] ` : ''}{g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Opción Analizar actividades situada entre la caja de grupos y el botón Hoy */}
          <button
            type="button"
            onClick={() => setIsAnalyzerOpen(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
              isAnalyzerOpen
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-400/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 shadow-2xs'
            }`}
            title="Analizar actividades: abre la línea temporal con inicio y fin"
          >
            <ActivityIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Analizar actividades</span>
            {analyzedActivityIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-slate-900 text-amber-400">
                {analyzedActivityIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Date navigation window */}
        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto flex-wrap">
          <button
            onClick={onTodayWindow}
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors border border-amber-300 shadow-2xs cursor-pointer whitespace-nowrap active:scale-95"
          >
            Hoy
          </button>

          <button
            onClick={onOpenTimeSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-amber-50/70 hover:text-amber-900 hover:border-amber-200 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Elegir fechas de inicio y fin o marcar 7, 14 o 30 días"
          >
            <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden xs:inline">Establecer Tiempos</span>
            <span className="xs:hidden">Tiempos</span>
          </button>
          
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shrink-0 shadow-2xs">
            <button
              onClick={onPrevDateWindow}
              className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-700 px-1.5 sm:px-2.5 select-none whitespace-nowrap">
              {days[0]?.dayNumber} {days[0]?.monthName?.slice(0, 3)} - {days[days.length - 1]?.dayNumber} {days[days.length - 1]?.monthName?.slice(0, 3)}
            </span>
            <button
              onClick={onNextDateWindow}
              className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Activity Analyzer Panel (rendered above the days and dates header line) */}
      {isAnalyzerOpen && (
        <ActivityAnalyzer
          activities={activities}
          analyzedActivityIds={analyzedActivityIds}
          completionLogs={completionLogs}
          onAddAnalyzedActivity={handleAddAnalyzedActivity}
          onRemoveAnalyzedActivity={handleRemoveAnalyzedActivity}
          onCompleteActiveSlot={onCompleteActiveSlot || (() => {})}
          onToggleSubInActiveSlot={onToggleSubInActiveSlot || (() => {})}
        />
      )}

      {/* Matrix Table with sticky left column and sticky dates header */}
      <div className="overflow-x-auto matrix-scroll w-full">
        <table className="border-collapse text-left w-max min-w-full">
          <thead>
            <tr className="bg-slate-100/95 border-b border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 sticky top-0 z-20">
              
              {/* Sticky Left Column Header */}
              <th
                className={`sticky left-0 z-25 bg-slate-100 p-2 sm:p-2.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] select-none ${leftColClass}`}
                style={leftColStyle}
              >
                {isCompactWidth ? (
                  <div 
                    onClick={() => setIsCompactWidth(false)}
                    className="flex items-center justify-between px-0.5 cursor-pointer hover:text-amber-800"
                    title="Modo Solo Códigos activado. Clic para expandir y ver nombres completos."
                  >
                    <span className="font-mono font-bold text-amber-900 text-xs">CÓD</span>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-amber-800" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1 px-1 relative">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedActivityIds.length === activities.length && activities.length > 0}
                        disabled={selectedGroupIds.length > 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelectAll();
                        }}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
                        title={selectedGroupIds.length > 0 ? "Deselecciona los grupos primero para seleccionar actividades" : "Seleccionar todas"}
                      />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {selectedGroupIds.length > 0 ? 'Grupos (selección)' : 'Actividades'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCompactWidth(true)}
                      className="flex items-center gap-1 shrink-0 text-slate-500 hover:text-amber-800 text-[11px] sm:text-xs p-1 rounded hover:bg-amber-50 cursor-pointer"
                      title="Comprimir a solo códigos"
                    >
                      <span className="hidden sm:inline">Comprimir</span>
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Drag Resize Handle on right border */}
                {!isCompactWidth && (
                  <div
                    onMouseDown={handleMouseDownResize}
                    onTouchStart={handleTouchStartResize}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-0 right-0 bottom-0 w-3.5 cursor-col-resize hover:bg-amber-400/25 active:bg-amber-500/40 z-30 flex items-center justify-center transition-colors select-none ${
                      isResizing ? 'bg-amber-400/30' : ''
                    }`}
                    title="Arrastra para cambiar el ancho de la columna"
                  >
                    <div className="w-1 h-5 bg-slate-300 hover:bg-amber-500 rounded-full" />
                  </div>
                )}
              </th>

              {/* Day Columns Headers with larger typography and prominent today shading */}
              {days.map((day) => {
                return (
                  <th
                    key={day.dateStr}
                    className={`w-[42px] min-w-[42px] max-w-[42px] sm:w-[54px] sm:min-w-[54px] sm:max-w-[54px] py-2 px-1 text-center transition-colors ${
                      day.isToday 
                        ? 'bg-amber-200/95 font-black text-amber-950 border-x-2 border-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]' 
                        : 'border-r border-slate-200'
                    } ${day.isWeekend && !day.isToday ? 'bg-slate-100/70' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] sm:text-xs uppercase tracking-wider ${day.isToday ? 'text-amber-900 font-black' : 'text-slate-500 font-bold'}`}>
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span
                        className={`text-xs sm:text-sm tabular-nums mt-0.5 inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black ${
                          day.isToday
                            ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/50 border border-amber-600/30'
                            : 'text-slate-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                    </div>
                  </th>
                );
              })}

              <th className="p-0 border-none bg-transparent w-auto min-w-0" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {groupedData.map((entry, groupIdx) => {
              const group = entry.group;
              const groupId = group ? group.id : '__ungrouped__';
              const posture = groupPostures[groupId] || 'expanded_all';
              const isGroupFullyCollapsed = posture === 'collapsed_group';
              const isSubActivitiesCollapsed = posture === 'collapsed_subactivities';
              const groupCode = group ? getGroupCode(group, groupIdx) : 'GEN';
              const isGroupSelected = group ? selectedGroupIds.includes(group.id) : false;

              // Background tint:
              // Group row has group.color at ~15% opacity
              // Activities have group.color at ~5% opacity (softer and more transparent)
              const groupRowBg = group ? `${group.color}22` : '#f8fafc';
              const activityRowBg = group ? `${group.color}0a` : undefined;
              const groupStats = getGroupStats(entry.items);

              return (
                <React.Fragment key={groupId}>
                  {/* Group Header Row */}
                  {group && (
                    <tr 
                      className="border-t border-b border-slate-200 transition-colors"
                      style={{ backgroundColor: groupRowBg }}
                    >
                      <td
                        colSpan={1}
                        className={`sticky left-0 z-10 p-2 sm:p-2.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] ${leftColClass}`}
                        style={{ ...leftColStyle, backgroundColor: groupRowBg }}
                      >
                        {isCompactWidth ? (
                          <div 
                            className="flex items-center justify-center cursor-pointer"
                            onClick={() => cycleGroupPosture(groupId, entry.items.map(a => a.id))}
                            title={`Grupo: ${group.name} (${groupCode}) - Clic para alternar postura`}
                          >
                            <span 
                              className="text-[10px] sm:text-xs font-mono font-bold text-white px-1.5 py-0.5 rounded shadow-2xs truncate max-w-[42px] sm:max-w-[70px]"
                              style={{ backgroundColor: group.color }}
                            >
                              {groupCode}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            {/* Group Selection Checkbox (mutually exclusive with activity selection) */}
                            <input
                              type="checkbox"
                              checked={isGroupSelected}
                              disabled={selectedActivityIds.length > 0}
                              onChange={() => onToggleSelectGroup(group.id)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
                              title={selectedActivityIds.length > 0 ? "Deselecciona las actividades primero para seleccionar grupos" : "Seleccionar grupo"}
                            />

                            {/* 3-State Posture Button */}
                            <button
                              onClick={() => cycleGroupPosture(groupId, entry.items.map(a => a.id))}
                              className="flex items-center gap-1 text-left font-bold text-slate-900 hover:text-amber-900 transition-colors min-w-0 flex-1 cursor-pointer"
                              title={
                                posture === 'collapsed_group'
                                  ? 'Postura actual: Grupo plegado (clic para mostrar actividades con sesiones ocultas)'
                                  : posture === 'collapsed_subactivities'
                                  ? 'Postura actual: Actividades visibles, sesiones ocultas (clic para desplegar todas las sesiones)'
                                  : 'Postura actual: Desplegado total de actividades y sesiones (clic para plegar grupo)'
                              }
                            >
                              {posture === 'collapsed_group' && (
                                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              {posture === 'collapsed_subactivities' && (
                                <ChevronDown className="w-4 h-4 text-slate-700 shrink-0 stroke-[2.5]" />
                              )}
                              {posture === 'expanded_all' && (
                                <ChevronUp className="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
                              )}

                              <span 
                                className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: group.color }}
                              >
                                {groupCode}
                              </span>
                              <span className="text-xs sm:text-sm uppercase tracking-wider truncate font-bold text-slate-900 flex-1 min-w-0">
                                {group.name}
                              </span>
                              <span className="text-xs font-bold text-slate-700 shrink-0">
                                ({groupStats.totalActivities}A)
                              </span>
                              <span 
                                className="text-xs font-bold text-amber-950 bg-amber-200/90 border border-amber-300/80 px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                                title={`Total de actividades realizadas en este grupo: ${groupStats.totalCompletions}`}
                              >
                                ({groupStats.totalCompletions})
                              </span>
                            </button>

                            {/* Group Action Buttons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {confirmDeleteGroupId === group.id ? (
                                <div className="flex items-center gap-0.5 bg-red-50 p-0.5 rounded border border-red-200">
                                  <button
                                    onClick={() => onDeleteGroup && onDeleteGroup(group.id)}
                                    className="px-1.5 py-0.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded cursor-pointer"
                                  >
                                    Borrar
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteGroupId(null)}
                                    className="px-1 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {onEditGroup && (
                                    <button
                                      onClick={() => onEditGroup(group)}
                                      className="p-1 text-slate-500 hover:text-amber-800 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Editar grupo"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {onDeleteGroup && (
                                    <button
                                      onClick={() => setConfirmDeleteGroupId(group.id)}
                                      className="p-1 text-slate-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Eliminar grupo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Group Day Cells (showBox determines if box is displayed) */}
                      {days.map((day) => {
                        const dayStatus = getGroupDayStatus(entry.items, day.dateStr);

                        return (
                          <td
                            key={day.dateStr}
                            className={`w-[42px] min-w-[42px] max-w-[42px] sm:w-[54px] sm:min-w-[54px] sm:max-w-[54px] p-1 text-center transition-colors ${
                              day.isToday 
                                ? 'bg-amber-200/50 border-x-2 border-amber-400/80 shadow-[inset_0_0_8px_rgba(245,158,11,0.12)]' 
                                : 'border-r border-slate-200'
                            }`}
                            style={{ backgroundColor: day.isToday ? '#fde68a70' : groupRowBg }}
                          >
                            {/* If group has showBox activated: render checkbox */}
                            {group.showBox && dayStatus.hasActs ? (
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onToggleGroupDay && onToggleGroupDay(group, day.dateStr)}
                                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
                                    dayStatus.isCompleted
                                      ? 'text-white border-transparent shadow-xs'
                                      : dayStatus.count > 0
                                      ? 'border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold'
                                      : 'border-slate-300 bg-white hover:border-slate-400'
                                  }`}
                                  style={
                                    dayStatus.isCompleted
                                      ? { backgroundColor: group.color, borderColor: group.color }
                                      : undefined
                                  }
                                  title={`Grupo ${group.name} en ${day.dateStr}: ${dayStatus.count}/${dayStatus.total} completadas. Clic para alternar todas.`}
                                >
                                  {dayStatus.isCompleted ? (
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : dayStatus.count > 0 ? (
                                    <span className="font-bold text-[10px] sm:text-xs tabular-nums">
                                      {dayStatus.count}
                                    </span>
                                  ) : null}
                                </button>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="p-0 border-none bg-transparent w-auto min-w-0" />
                    </tr>
                  )}

                  {/* Activity Rows (hidden if group posture is collapsed_group) */}
                  {!isGroupFullyCollapsed &&
                    entry.items.map((activity, actIdx) => {
                      const isSelected = selectedActivityIds.includes(activity.id);
                      const hasSubActivities = activity.subActivities.length > 0;
                      // Subactivities visibility:
                      // Independent per-activity toggle is NEVER blocked by group posture!
                      // If user individually toggled, use that value.
                      // If not individually toggled:
                      // In 'expanded_all' posture (flecha arriba), defaults to true (visible).
                      // In 'collapsed_subactivities' posture (flecha abajo), defaults to false (hidden).
                      const isExpanded = individualExpandedSubs[activity.id] !== undefined
                        ? individualExpandedSubs[activity.id]
                        : posture === 'expanded_all';
                      const actCode = getActivityCode(activity, actIdx);
                      const isDayCluster = activity.scheduleType === 'day_clusters';

                      return (
                        <React.Fragment key={activity.id}>
                          {/* Main Activity Row */}
                          <tr
                            className={`group transition-colors ${
                              isSelected ? 'bg-amber-100/40' : 'hover:bg-slate-50/70'
                            }`}
                            style={!isSelected && activityRowBg ? { backgroundColor: activityRowBg } : undefined}
                          >
                            {/* Sticky Left Column */}
                            <td 
                              className={`sticky left-0 z-10 p-2 sm:p-2.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-all ${leftColClass}`}
                              style={{ 
                                ...leftColStyle, 
                                backgroundColor: isSelected ? '#fef3c7' : (activityRowBg || '#ffffff') 
                              }}
                            >
                              {isCompactWidth ? (
                                <div 
                                  className="flex items-center justify-center cursor-pointer"
                                  onClick={() => onEditActivity(activity)}
                                  title={`${actCode}: ${activity.name} (${activity.scheduleType})`}
                                >
                                  <span
                                    className="text-xs font-mono font-bold text-white px-1.5 py-0.5 rounded shadow-2xs truncate max-w-[42px] sm:max-w-[72px] block text-center"
                                    style={{ backgroundColor: activity.color }}
                                  >
                                    {actCode}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-1.5 min-w-0">
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                                    {/* Selection Checkbox (disabled if groups are selected) */}
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={selectedGroupIds.length > 0}
                                      onChange={() => onToggleSelectActivity(activity.id)}
                                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
                                      title={selectedGroupIds.length > 0 ? "Deselecciona los grupos primero para seleccionar actividades" : "Seleccionar actividad"}
                                    />

                                    {/* Subtasks expand toggle */}
                                    {hasSubActivities ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleSubActivityExpand(activity.id, posture)}
                                        className="p-0.5 text-slate-500 hover:text-amber-800 transition-colors shrink-0 cursor-pointer"
                                        title={isExpanded ? 'Ocultar sesiones' : 'Mostrar sesiones'}
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="w-3 sm:w-4 shrink-0" />
                                    )}

                                    {/* Code Badge */}
                                    <span 
                                      className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0 shadow-2xs"
                                      title={`Código: ${actCode}`}
                                    >
                                      {actCode}
                                    </span>

                                    {/* Color indicator */}
                                    <div
                                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                                      style={{ backgroundColor: activity.color }}
                                    />

                                    {/* Activity Name with larger typography */}
                                    <div className="flex-1 min-w-0">
                                      <span
                                        className={`text-xs sm:text-sm font-bold block truncate ${
                                          activity.isCompleted
                                            ? 'line-through text-slate-400'
                                            : 'text-slate-900'
                                        }`}
                                        title={activity.name}
                                      >
                                        {activity.name}
                                      </span>
                                      
                                      {/* Muted Metadata */}
                                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                                        {activity.scheduleType === 'daily' && <span>Diario</span>}
                                        {activity.scheduleType === 'finite' && <span>Finito</span>}
                                        {activity.scheduleType === 'specific_days' && <span>Días Espec.</span>}
                                        {isDayCluster && (
                                          <span className="text-amber-800 font-bold bg-amber-100/80 px-1 rounded">
                                            Conjunto ({activity.clusterSize || 2} días)
                                          </span>
                                        )}
                                        {hasSubActivities && (
                                          <>
                                            <span aria-hidden="true">·</span>
                                            <span className="text-amber-800 font-bold shrink-0">
                                              {activity.subActivities.length} ses.
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      onClick={() => onEditActivity(activity)}
                                      className="p-1 text-slate-400 hover:text-amber-800 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Editar actividad"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteActivity(activity.id)}
                                      className="hidden sm:inline-flex p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Eliminar actividad"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Matrix Day Cells for Parent Activity */}
                            {days.map((day) => {
                              const isActive = isActivityActiveOnDate(activity, day.dateStr);
                              const status = getParentDayStatus(activity, day.dateStr);

                              // Cluster bounding box style if day_clusters has multiple days
                              const clusterDates = status.clusterDates || [];
                              const isCluster = isDayCluster && clusterDates.length > 1;
                              const clusterIndex = isCluster ? clusterDates.indexOf(day.dateStr) : -1;
                              const isClusterStart = isCluster && (clusterIndex === 0 || !days.some(d => d.dateStr === clusterDates[clusterIndex - 1]));
                              const isClusterEnd = isCluster && (clusterIndex === clusterDates.length - 1 || !days.some(d => d.dateStr === clusterDates[clusterIndex + 1]));
                              const isClusterMiddle = isCluster && !isClusterStart && !isClusterEnd;

                              let clusterBoxStyle: React.CSSProperties = {};
                              if (isCluster && isActive) {
                                const borderCol = activity.color;
                                const bgCol = `${activity.color}15`;
                                if (isClusterStart && isClusterEnd) {
                                  clusterBoxStyle = {
                                    border: `2px solid ${borderCol}`,
                                    borderRadius: '10px',
                                    backgroundColor: bgCol,
                                  };
                                } else if (isClusterStart) {
                                  clusterBoxStyle = {
                                    borderTop: `2px solid ${borderCol}`,
                                    borderBottom: `2px solid ${borderCol}`,
                                    borderLeft: `2px solid ${borderCol}`,
                                    borderRight: 'none',
                                    borderTopLeftRadius: '10px',
                                    borderBottomLeftRadius: '10px',
                                    backgroundColor: bgCol,
                                    marginRight: '-5px',
                                    paddingRight: '5px',
                                  };
                                } else if (isClusterEnd) {
                                  clusterBoxStyle = {
                                    borderTop: `2px solid ${borderCol}`,
                                    borderBottom: `2px solid ${borderCol}`,
                                    borderRight: `2px solid ${borderCol}`,
                                    borderLeft: 'none',
                                    borderTopRightRadius: '10px',
                                    borderBottomRightRadius: '10px',
                                    backgroundColor: bgCol,
                                    marginLeft: '-5px',
                                    paddingLeft: '5px',
                                  };
                                } else if (isClusterMiddle) {
                                  clusterBoxStyle = {
                                    borderTop: `2px solid ${borderCol}`,
                                    borderBottom: `2px solid ${borderCol}`,
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    borderRadius: '0',
                                    backgroundColor: bgCol,
                                    marginLeft: '-5px',
                                    marginRight: '-5px',
                                    paddingLeft: '5px',
                                    paddingRight: '5px',
                                  };
                                }
                              }

                               return (
                                <td
                                  key={day.dateStr}
                                  className={`w-[42px] min-w-[42px] max-w-[42px] sm:w-[54px] sm:min-w-[54px] sm:max-w-[54px] p-1 text-center transition-colors ${
                                    day.isToday 
                                      ? 'bg-amber-100/80 border-x-2 border-amber-400/80 shadow-[inset_0_0_6px_rgba(245,158,11,0.15)] font-semibold' 
                                      : 'border-r border-slate-200'
                                  }`}
                                  style={{ backgroundColor: day.isToday ? '#fef3c7' : (activityRowBg || undefined) }}
                                >
                                  {isActive ? (
                                    <div 
                                      className={`relative flex items-center justify-center py-1.5 h-8 overflow-visible ${isCluster ? 'z-1' : ''}`}
                                      style={clusterBoxStyle}
                                    >
                                      {/* Horizontal connecting track line across cluster */}
                                      {isCluster && (
                                        <div 
                                          className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 pointer-events-none -z-0"
                                          style={{ backgroundColor: `${activity.color}40` }}
                                        />
                                      )}

                                      {/* Main Activity Square Box */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (status.hasSub) {
                                            onToggleParentDay(activity, day.dateStr);
                                          } else {
                                            onToggleCell(activity.id, null, day.dateStr);
                                          }
                                        }}
                                        className={`relative z-1 w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
                                          status.isCompleted
                                            ? 'text-white border-transparent shadow-xs'
                                            : status.hasSub && status.completedCount > 0
                                            ? 'border-amber-400 bg-amber-100 text-amber-950 text-xs font-bold'
                                            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                        style={
                                          status.isCompleted
                                            ? { backgroundColor: activity.color, borderColor: activity.color }
                                            : undefined
                                        }
                                        title={
                                          isDayCluster
                                            ? status.isCompleted
                                              ? `Conjunto de ${clusterDates.length} días completado (Valor: ${activity.dayValue || clusterDates.length})`
                                              : `${status.completedCount}/${status.totalCount} sesiones del conjunto completadas.`
                                            : status.hasSub
                                            ? status.isCompleted
                                              ? `Todas las ${status.totalCount} sesiones completadas.`
                                              : `${status.completedCount}/${status.totalCount} sesiones completadas.`
                                            : status.isCompleted
                                            ? 'Completado. Haz clic para desmarcar.'
                                            : 'Pendiente. Haz clic para marcar.'
                                        }
                                      >
                                        {status.isCompleted ? (
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        ) : status.hasSub && status.completedCount > 0 ? (
                                          <span className="tabular-nums font-bold leading-none text-xs">
                                            {status.completedCount}
                                          </span>
                                        ) : null}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center h-8">
                                      <span className="text-slate-300 select-none text-xs">-</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            <td className="p-0 border-none bg-transparent w-auto min-w-0" />
                          </tr>

                          {/* Sub-Activities Rows */}
                          {hasSubActivities &&
                            isExpanded &&
                            activity.subActivities.map((sub, subIdx) => {
                              const subCode = getSubCode(sub, actCode, subIdx);

                              return (
                                <tr
                                  key={sub.id}
                                  className="bg-slate-50/50 hover:bg-slate-100/70 transition-colors border-t border-slate-100"
                                  style={activityRowBg ? { backgroundColor: activityRowBg } : undefined}
                                >
                                  {/* Subactivity Left Column */}
                                  <td 
                                    className={`sticky left-0 z-10 p-1.5 sm:p-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-all pl-4 sm:pl-8 ${leftColClass}`}
                                    style={{ 
                                      ...leftColStyle, 
                                      backgroundColor: activityRowBg ? `${activityRowBg}` : '#f8fafc' 
                                    }}
                                  >
                                    {isCompactWidth ? (
                                      <div 
                                        className="flex items-center justify-center cursor-pointer"
                                        title={`${subCode}: ${sub.name}`}
                                      >
                                        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 bg-slate-200 px-1 py-0.5 rounded truncate max-w-[38px] sm:max-w-[62px]">
                                          {subCode}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                                          {subCode}
                                        </span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                        <span 
                                          className="text-xs sm:text-sm font-medium text-slate-700 block truncate flex-1 min-w-0"
                                          title={sub.name}
                                        >
                                          {sub.name}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* Subactivity Matrix Cells: Spherical Round Checkboxes */}
                                  {days.map((day) => {
                                    const isActive = isActivityActiveOnDate(activity, day.dateStr);
                                    const checked = isSubCompletedOnDate(activity, sub.id, day.dateStr);

                                    const clusterDates = isDayCluster ? getClusterDatesForDate(activity, day.dateStr) : [];
                                    const isCluster = isDayCluster && clusterDates.length > 1;
                                    const clusterIndex = isCluster ? clusterDates.indexOf(day.dateStr) : -1;
                                    const isClusterStart = isCluster && (clusterIndex === 0 || !days.some(d => d.dateStr === clusterDates[clusterIndex - 1]));
                                    const isClusterEnd = isCluster && (clusterIndex === clusterDates.length - 1 || !days.some(d => d.dateStr === clusterDates[clusterIndex + 1]));
                                    const isClusterMiddle = isCluster && !isClusterStart && !isClusterEnd;

                                    let subClusterBoxStyle: React.CSSProperties = {};
                                    if (isCluster && isActive) {
                                      const borderCol = `${activity.color}70`;
                                      const bgCol = `${activity.color}0a`;
                                      if (isClusterStart && isClusterEnd) {
                                        subClusterBoxStyle = {
                                          border: `1.5px dashed ${borderCol}`,
                                          borderRadius: '8px',
                                          backgroundColor: bgCol,
                                        };
                                      } else if (isClusterStart) {
                                        subClusterBoxStyle = {
                                          borderTop: `1.5px dashed ${borderCol}`,
                                          borderBottom: `1.5px dashed ${borderCol}`,
                                          borderLeft: `1.5px dashed ${borderCol}`,
                                          borderRight: 'none',
                                          borderTopLeftRadius: '8px',
                                          borderBottomLeftRadius: '8px',
                                          backgroundColor: bgCol,
                                          marginRight: '-5px',
                                          paddingRight: '5px',
                                        };
                                      } else if (isClusterEnd) {
                                        subClusterBoxStyle = {
                                          borderTop: `1.5px dashed ${borderCol}`,
                                          borderBottom: `1.5px dashed ${borderCol}`,
                                          borderRight: `1.5px dashed ${borderCol}`,
                                          borderLeft: 'none',
                                          borderTopRightRadius: '8px',
                                          borderBottomRightRadius: '8px',
                                          backgroundColor: bgCol,
                                          marginLeft: '-5px',
                                          paddingLeft: '5px',
                                        };
                                      } else if (isClusterMiddle) {
                                        subClusterBoxStyle = {
                                          borderTop: `1.5px dashed ${borderCol}`,
                                          borderBottom: `1.5px dashed ${borderCol}`,
                                          borderLeft: 'none',
                                          borderRight: 'none',
                                          borderRadius: '0',
                                          backgroundColor: bgCol,
                                          marginLeft: '-5px',
                                          marginRight: '-5px',
                                          paddingLeft: '5px',
                                          paddingRight: '5px',
                                        };
                                      }
                                    }

                                    return (
                                      <td
                                        key={day.dateStr}
                                        className={`w-[42px] min-w-[42px] max-w-[42px] sm:w-[54px] sm:min-w-[54px] sm:max-w-[54px] p-1 text-center transition-colors ${
                                          day.isToday 
                                            ? 'bg-amber-100/70 border-x-2 border-amber-400/80 shadow-[inset_0_0_6px_rgba(245,158,11,0.12)]' 
                                            : 'border-r border-slate-200'
                                        }`}
                                        style={{ backgroundColor: day.isToday ? '#fef3c7' : (activityRowBg || undefined) }}
                                      >
                                        {isActive ? (
                                          <div 
                                            className={`relative flex items-center justify-center py-1 h-7 overflow-visible ${isCluster ? 'z-1' : ''}`}
                                            style={subClusterBoxStyle}
                                          >
                                            {isCluster && (
                                              <div 
                                                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 pointer-events-none -z-0"
                                                style={{ backgroundColor: `${activity.color}30` }}
                                              />
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => onToggleCell(activity.id, sub.id, day.dateStr)}
                                              className={`relative z-1 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                                                checked
                                                  ? 'text-white border-transparent shadow-xs'
                                                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-100'
                                              }`}
                                              style={
                                                checked
                                                  ? { backgroundColor: activity.color, borderColor: activity.color }
                                                  : undefined
                                              }
                                              title={`${subCode} (${sub.name}): ${checked ? 'Completada' : 'Pendiente'}`}
                                            >
                                              {checked && <Check className="w-3 h-3 stroke-[3]" />}
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center h-7">
                                            <span className="text-slate-300 select-none text-[10px]">-</span>
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}

                                  <td className="p-0 border-none bg-transparent w-auto min-w-0" />
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
