import React, { useState, useMemo } from 'react';
import { Activity, ActivityGroup, DayInfo, SubActivity } from '../types';
import { isActivityActiveOnDate } from '../utils/dateUtils';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  SlidersHorizontal,
  CalendarDays,
  ChevronsLeftRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MatrixGridProps {
  days: DayInfo[];
  activities: Activity[];
  groups: ActivityGroup[];
  completionLogs: Record<string, boolean>;
  onToggleCell: (activityId: string, subActivityId: string | null, dateStr: string) => void;
  onToggleParentDay: (activity: Activity, dateStr: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddSubActivityQuick: (activity: Activity) => void;
  onEditGroup?: (group: ActivityGroup) => void;
  onDeleteGroup?: (groupId: string) => void;
  selectedActivityIds: string[];
  onToggleSelectActivity: (activityId: string) => void;
  onToggleSelectAll: () => void;
  onPrevDateWindow: () => void;
  onNextDateWindow: () => void;
  onTodayWindow: () => void;
  onOpenTimeSettings: () => void;
  activeFilterGroup: string | null;
  onSetFilterGroup: (groupId: string | null) => void;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  days,
  activities,
  groups,
  completionLogs,
  onToggleCell,
  onToggleParentDay,
  onEditActivity,
  onDeleteActivity,
  onAddSubActivityQuick,
  onEditGroup,
  onDeleteGroup,
  selectedActivityIds,
  onToggleSelectActivity,
  onToggleSelectAll,
  onPrevDateWindow,
  onNextDateWindow,
  onTodayWindow,
  onOpenTimeSettings,
  activeFilterGroup,
  onSetFilterGroup,
}) => {
  // Collapsed state for groups & subactivities
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedSubActivities, setExpandedSubActivities] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Column width mode: true = Solo Códigos (ultra-compact); false = Extendido con nombres
  const [isCompactWidth, setIsCompactWidth] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // User-resizable column width in expanded mode (in pixels)
  const [expandedWidth, setExpandedWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 150;
    }
    return 320;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // Drag resizer handlers for Mouse and Touch
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = expandedWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const minW = window.innerWidth < 640 ? 100 : 180;
      const maxW = window.innerWidth < 640 ? Math.min(320, window.innerWidth - 40) : 750;
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
      const minW = 100;
      const maxW = Math.min(320, window.innerWidth - 40);
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

  // Dynamic style and class for left column
  const leftColStyle = useMemo(() => {
    if (isCompactWidth) return undefined;
    return {
      width: `${expandedWidth}px`,
      minWidth: `${expandedWidth}px`,
      maxWidth: `${expandedWidth}px`,
    };
  }, [isCompactWidth, expandedWidth]);

  const leftColClass = isCompactWidth
    ? 'w-[44px] min-w-[44px] max-w-[44px] sm:w-[76px] sm:min-w-[76px] sm:max-w-[76px]'
    : '';

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleSubActivityExpand = (activityId: string) => {
    setExpandedSubActivities(prev => ({
      ...prev,
      [activityId]: prev[activityId] === undefined ? false : !prev[activityId],
    }));
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

  // Helper to get fallback codes
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

  // Check parent day status
  const getParentDayStatus = (activity: Activity, dateStr: string) => {
    if (activity.subActivities.length === 0) {
      const key = `${activity.id}_main_${dateStr}`;
      return {
        hasSub: false,
        isCompleted: !!completionLogs[key],
        completedCount: completionLogs[key] ? 1 : 0,
        totalCount: 1,
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
    };
  };

  const isSubCompleted = (activityId: string, subId: string, dateStr: string) => {
    return !!completionLogs[`${activityId}_${subId}_${dateStr}`];
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Matrix Controls Header */}
      <div className="p-2.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 bg-slate-50/70">
        
        {/* Left: Search & Group Filter */}
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar actividad..."
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-1/2 sm:w-44 font-medium"
          />

          <div className="flex items-center gap-1 flex-1 sm:flex-none min-w-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden xs:inline" />
            <select
              value={activeFilterGroup || ''}
              onChange={(e) => onSetFilterGroup(e.target.value === '' ? null : e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full sm:w-auto truncate"
            >
              <option value="">Todos ({activities.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code ? `[${g.code}] ` : ''}{g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Date navigation window with Establecer Tiempos button */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end w-full sm:w-auto">
          {/* Ir a Hoy */}
          <button
            onClick={onTodayWindow}
            className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300 shadow-2xs cursor-pointer whitespace-nowrap active:scale-95"
          >
            Hoy
          </button>

          {/* Establecer Tiempos (Date range picker & presets) */}
          <button
            onClick={onOpenTimeSettings}
            className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50/60 hover:text-amber-900 hover:border-amber-200 border border-slate-200 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Elegir fechas de inicio y fin o marcar 7, 14 o 30 días"
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden xs:inline">Establecer Tiempos</span>
            <span className="xs:hidden">Tiempos</span>
          </button>
          
          {/* Next / Prev day stepper */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shrink-0">
            <button
              onClick={onPrevDateWindow}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-700 px-1 sm:px-2 select-none whitespace-nowrap">
              {days[0]?.dayNumber} {days[0]?.monthName?.slice(0, 3)} - {days[days.length - 1]?.dayNumber} {days[days.length - 1]?.monthName?.slice(0, 3)}
            </span>
            <button
              onClick={onNextDateWindow}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Matrix Table with sticky left column and sticky dates header */}
      <div className="overflow-x-auto matrix-scroll w-full">
        <table className="border-collapse text-left w-max min-w-full">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-xs font-semibold text-slate-700 sticky top-0 z-20">
              
              {/* Sticky Left Column Header: Toggles between Solo Códigos and Extendido */}
              <th
                className={`sticky left-0 z-25 bg-slate-100 p-1.5 sm:p-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] select-none ${leftColClass}`}
                style={leftColStyle}
              >
                {isCompactWidth ? (
                  /* Compact Header: Shows CÓD and Expand Icon (clicking expands) */
                  <div 
                    onClick={() => setIsCompactWidth(false)}
                    className="flex items-center justify-between px-0.5 cursor-pointer hover:text-amber-800"
                    title="Modo Solo Códigos activado. Clic para expandir y ver nombres completos."
                  >
                    <span className="font-mono font-bold text-amber-900 text-[10px] sm:text-[11px]">CÓD</span>
                    <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-amber-800" />
                  </div>
                ) : (
                  /* Extended Header: Shows Select All, Title, and Minimize Icon */
                  <div className="flex items-center justify-between gap-1 px-0.5 sm:px-1 relative">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedActivityIds.length === activities.length && activities.length > 0}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelectAll();
                        }}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3 h-3 sm:w-3.5 sm:h-3.5 cursor-pointer shrink-0"
                        title="Seleccionar todas"
                      />
                      <span className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">Actividades</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCompactWidth(true)}
                      className="flex items-center gap-0.5 shrink-0 text-slate-500 hover:text-amber-800 text-[9px] sm:text-[10px] p-0.5 rounded hover:bg-amber-50 cursor-pointer"
                      title="Comprimir a solo códigos"
                    >
                      <span className="hidden sm:inline">Comprimir</span>
                      <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}

                {/* Drag Resize Handle on right border (when expanded) */}
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

              {/* Day Columns Headers: Strict non-stretching width */}
              {days.map((day) => {
                return (
                  <th
                    key={day.dateStr}
                    className={`w-[38px] min-w-[38px] max-w-[38px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] py-1.5 px-0.5 sm:py-2 sm:px-1 text-center border-r border-slate-200 transition-colors ${
                      day.isToday ? 'bg-amber-50/80 font-bold text-amber-950' : ''
                    } ${day.isWeekend && !day.isToday ? 'bg-slate-100/60' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[8px] sm:text-[10px] uppercase font-bold tracking-wider ${day.isToday ? 'text-amber-800' : 'text-slate-500'}`}>
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs tabular-nums mt-0.5 inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full font-bold ${
                          day.isToday
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs border border-amber-500/30'
                            : 'text-slate-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Elastic Trailing Spacer Column (absorbs any extra horizontal desktop width) */}
              <th className="p-0 border-none bg-transparent w-auto min-w-0" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {groupedData.map((entry, groupIdx) => {
              const group = entry.group;
              const groupId = group ? group.id : '__ungrouped__';
              const isGroupCollapsed = !!collapsedGroups[groupId];
              const groupCode = group ? getGroupCode(group, groupIdx) : 'GEN';

              return (
                <React.Fragment key={groupId}>
                  {/* Group Header Row */}
                  {group && (
                    <tr className="bg-slate-50/80 border-t border-b border-slate-200">
                      <td
                        colSpan={1}
                        className={`sticky left-0 z-10 bg-slate-50 p-1.5 sm:p-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] ${leftColClass}`}
                        style={leftColStyle}
                      >
                        {isCompactWidth ? (
                          /* Compact Mode Group: Only Code Badge */
                          <div 
                            className="flex items-center justify-center cursor-pointer"
                            onClick={() => toggleGroupCollapse(groupId)}
                            title={`Grupo: ${group.name} (${groupCode})`}
                          >
                            <span 
                              className="text-[9px] sm:text-[10px] font-mono font-bold text-white px-1 py-0.5 rounded-xs shadow-2xs truncate max-w-[38px] sm:max-w-[64px]"
                              style={{ backgroundColor: group.color }}
                            >
                              {groupCode}
                            </span>
                          </div>
                        ) : (
                          /* Extended Mode Group: Code + Name + Edit/Delete */
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <button
                              onClick={() => toggleGroupCollapse(groupId)}
                              className="flex items-center gap-1 text-left font-bold text-slate-800 hover:text-amber-800 transition-colors min-w-0 flex-1 cursor-pointer"
                            >
                              {isGroupCollapsed ? (
                                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span 
                                className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.5 rounded text-white shrink-0"
                                style={{ backgroundColor: group.color }}
                              >
                                {groupCode}
                              </span>
                              <span className="text-[10px] sm:text-xs uppercase tracking-wider truncate font-bold text-slate-800 flex-1 min-w-0">
                                {group.name}
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-normal text-slate-500 shrink-0">
                                ({entry.items.length})
                              </span>
                            </button>

                            {/* Group Edit / Delete Action Buttons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {confirmDeleteGroupId === group.id ? (
                                <div className="flex items-center gap-0.5 bg-red-50 p-0.5 rounded border border-red-200">
                                  <button
                                    onClick={() => onDeleteGroup && onDeleteGroup(group.id)}
                                    className="px-1 py-0.5 text-[9px] sm:text-[10px] font-bold text-red-700 hover:bg-red-100 rounded cursor-pointer"
                                  >
                                    Borrar
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteGroupId(null)}
                                    className="px-0.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-700 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {onEditGroup && (
                                    <button
                                      onClick={() => onEditGroup(group)}
                                      className="p-0.5 sm:p-1 text-slate-400 hover:text-amber-800 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Editar grupo"
                                    >
                                      <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    </button>
                                  )}
                                  {onDeleteGroup && (
                                    <button
                                      onClick={() => setConfirmDeleteGroupId(group.id)}
                                      className="p-0.5 sm:p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Eliminar grupo"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      {days.map((day) => (
                        <td
                          key={day.dateStr}
                          className={`w-[38px] min-w-[38px] max-w-[38px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] bg-slate-50/40 border-r border-slate-200 ${
                            day.isToday ? 'bg-amber-50/40' : ''
                          }`}
                        />
                      ))}
                      <td className="p-0 border-none bg-transparent w-auto min-w-0" />
                    </tr>
                  )}

                  {/* Activity Rows */}
                  {!isGroupCollapsed &&
                    entry.items.map((activity, actIdx) => {
                      const isSelected = selectedActivityIds.includes(activity.id);
                      const hasSubActivities = activity.subActivities.length > 0;
                      const isExpanded = expandedSubActivities[activity.id] !== false;
                      const actCode = getActivityCode(activity, actIdx);

                      return (
                        <React.Fragment key={activity.id}>
                          {/* Main Activity Row */}
                          <tr
                            className={`group transition-colors ${
                              isSelected ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* Sticky Left Column: Activity Info or Solo Código */}
                            <td 
                              className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50/60 p-1.5 sm:p-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-all ${leftColClass}`}
                              style={leftColStyle}
                            >
                              {isCompactWidth ? (
                                /* Compact Mode: SOLO EL CÓDIGO de la actividad */
                                <div 
                                  className="flex items-center justify-center cursor-pointer"
                                  onClick={() => onEditActivity(activity)}
                                  title={`${actCode}: ${activity.name} (${activity.scheduleType})`}
                                >
                                  <span
                                    className="text-[10px] sm:text-[11px] font-mono font-bold text-white px-1 py-0.5 rounded-xs shadow-2xs truncate max-w-[38px] sm:max-w-[66px] block text-center"
                                    style={{ backgroundColor: activity.color }}
                                  >
                                    {actCode}
                                  </span>
                                </div>
                              ) : (
                                /* Extended Mode: Checkbox + Código + Nombre + Botones */
                                <div className="flex items-center justify-between gap-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                    {/* Selection Checkbox */}
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => onToggleSelectActivity(activity.id)}
                                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3 h-3 sm:w-3.5 sm:h-3.5 cursor-pointer shrink-0"
                                    />

                                    {/* Subtasks expand toggle */}
                                    {hasSubActivities ? (
                                      <button
                                        type="button"
                                        onClick={() => toggleSubActivityExpand(activity.id)}
                                        className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                                        title={isExpanded ? 'Ocultar sesiones' : 'Mostrar sesiones'}
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="w-2.5 sm:w-3.5 shrink-0" />
                                    )}

                                    {/* Code Badge */}
                                    <span 
                                      className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0 shadow-2xs"
                                      title={`Código: ${actCode}`}
                                    >
                                      {actCode}
                                    </span>

                                    {/* Color indicator */}
                                    <div
                                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs shrink-0"
                                      style={{ backgroundColor: activity.color }}
                                    />

                                    {/* Activity Name: flex-1 min-w-0 expands as column is widened */}
                                    <div className="flex-1 min-w-0">
                                      <span
                                        className={`text-[11px] sm:text-xs font-bold block truncate ${
                                          activity.isCompleted
                                            ? 'line-through text-slate-400'
                                            : 'text-slate-900'
                                        }`}
                                        title={activity.name}
                                      >
                                        {activity.name}
                                      </span>
                                      
                                      {/* Muted Metadata */}
                                      <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
                                        {activity.scheduleType === 'daily' && <span>Diario</span>}
                                        {activity.scheduleType === 'finite' && <span>Finito</span>}
                                        {activity.scheduleType === 'specific_days' && <span>Lun-Sáb</span>}
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
                                      className="p-0.5 sm:p-1 text-slate-400 hover:text-amber-800 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                                      title="Editar actividad"
                                    >
                                      <Edit2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteActivity(activity.id)}
                                      className="hidden sm:inline-flex p-0.5 sm:p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Eliminar actividad"
                                    >
                                      <Trash2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Matrix Day Cells for Parent Activity: Strict non-stretching width */}
                            {days.map((day) => {
                              const isActive = isActivityActiveOnDate(activity, day.dateStr);
                              const status = getParentDayStatus(activity, day.dateStr);

                              return (
                                <td
                                  key={day.dateStr}
                                  className={`w-[38px] min-w-[38px] max-w-[38px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] p-0.5 sm:p-1 text-center border-r border-slate-200 transition-colors ${
                                    day.isToday ? 'bg-amber-50/25' : ''
                                  } ${day.isWeekend && !day.isToday ? 'bg-slate-50/40' : ''}`}
                                >
                                  {isActive ? (
                                    <div className="flex items-center justify-center">
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
                                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-xs sm:rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
                                          status.isCompleted
                                            ? 'text-white border-transparent shadow-2xs'
                                            : status.hasSub && status.completedCount > 0
                                            ? 'border-amber-400 bg-amber-100 text-amber-950 text-[9px] sm:text-[10px] font-bold'
                                            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                        style={
                                          status.isCompleted
                                            ? { backgroundColor: activity.color, borderColor: activity.color }
                                            : undefined
                                        }
                                        title={
                                          status.hasSub
                                            ? status.isCompleted
                                              ? `Todas las ${status.totalCount} sesiones completadas en este día.`
                                              : `${status.completedCount}/${status.totalCount} sesiones completadas. Haz clic para alternar todas.`
                                            : status.isCompleted
                                            ? 'Completado. Haz clic para desmarcar.'
                                            : 'Pendiente. Haz clic para marcar.'
                                        }
                                      >
                                        {status.isCompleted ? (
                                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                                        ) : status.hasSub && status.completedCount > 0 ? (
                                          <span className="tabular-nums font-bold leading-none">
                                            {status.completedCount}
                                          </span>
                                        ) : null}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center">
                                      <span className="text-slate-300 select-none text-[10px] sm:text-xs">-</span>
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
                                  className="bg-slate-50/40 hover:bg-slate-50/80 transition-colors border-t border-slate-100"
                                >
                                  {/* Subactivity Left Column: Solo Código o Nombre */}
                                  <td 
                                    className={`sticky left-0 z-10 bg-slate-50/60 p-1.5 sm:p-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-all pl-3 sm:pl-7 ${leftColClass}`}
                                    style={leftColStyle}
                                  >
                                    {isCompactWidth ? (
                                      /* Compact Mode: SOLO EL CÓDIGO de la subactividad */
                                      <div 
                                        className="flex items-center justify-center cursor-pointer"
                                        title={`${subCode}: ${sub.name}`}
                                      >
                                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-1 py-0.5 rounded-xs truncate max-w-[38px] sm:max-w-[62px]">
                                          {subCode}
                                        </span>
                                      </div>
                                    ) : (
                                      /* Extended Mode: Code + Name: flex-1 min-w-0 expands as column is dragged */
                                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                                        <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                                          {subCode}
                                        </span>
                                        <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                        <span 
                                          className="text-[10px] sm:text-[11px] font-medium text-slate-600 block truncate flex-1 min-w-0"
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
                                    const checked = isSubCompleted(activity.id, sub.id, day.dateStr);

                                    return (
                                      <td
                                        key={day.dateStr}
                                        className={`w-[38px] min-w-[38px] max-w-[38px] sm:w-[50px] sm:min-w-[50px] sm:max-w-[50px] p-0.5 sm:p-1 text-center border-r border-slate-200 ${
                                          day.isToday ? 'bg-indigo-50/20' : ''
                                        }`}
                                      >
                                        {isActive ? (
                                          <div className="flex items-center justify-center">
                                            {/* Spherical (Circular) Box */}
                                            <button
                                              type="button"
                                              onClick={() => onToggleCell(activity.id, sub.id, day.dateStr)}
                                              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                                                checked
                                                  ? 'text-white border-transparent shadow-2xs'
                                                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-100'
                                              }`}
                                              style={
                                                checked
                                                  ? { backgroundColor: activity.color, borderColor: activity.color }
                                                  : undefined
                                              }
                                              title={`${subCode} (${sub.name}): ${checked ? 'Completada' : 'Pendiente'}`}
                                            >
                                              {checked && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center">
                                            <span className="text-slate-300 select-none text-[9px] sm:text-[10px]">-</span>
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
