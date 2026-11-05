import React, { useState, useMemo } from 'react';
import { Activity, ActivityGroup } from '../types';
import { getTodayDateString, formatFriendlyDate } from '../utils/dateUtils';
import { 
  Archive, 
  Search, 
  RotateCcw, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  SlidersHorizontal,
  CalendarCheck
} from 'lucide-react';

interface HistoryActivitiesBoxProps {
  activities: Activity[];
  groups: ActivityGroup[];
  onToggleActivityCompletion: (activityId: string, isCompleted: boolean) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
}

export const HistoryActivitiesBox: React.FC<HistoryActivitiesBoxProps> = ({
  activities,
  groups,
  onToggleActivityCompletion,
  onEditActivity,
  onDeleteActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [pageSize, setPageSize] = useState<number | 'all'>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // All completed activities finalized before today
  const pastActivities = useMemo(() => {
    return activities.filter((act) => {
      if (!act.isCompleted) return false;
      const compDate = act.completedDate || act.endDate || act.startDate;
      // Must be finished before today
      return !!(compDate && compDate < todayStr);
    });
  }, [activities, todayStr]);

  // Filtered list by search and group
  const filteredList = useMemo(() => {
    return pastActivities.filter((act) => {
      if (selectedGroupId && act.groupId !== selectedGroupId) return false;
      if (searchQuery.trim() && !act.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [pastActivities, selectedGroupId, searchQuery]);

  // Reset to page 1 if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGroupId, pageSize]);

  // Pagination calculations (Google Ads style)
  const totalItems = filteredList.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? Math.max(1, totalItems) : pageSize;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const paginatedItems = useMemo(() => {
    if (isAll) return filteredList;
    const startIndex = (currentPage - 1) * effectivePageSize;
    return filteredList.slice(startIndex, startIndex + effectivePageSize);
  }, [filteredList, currentPage, effectivePageSize, isAll]);

  const startIndexDisplay = totalItems === 0 ? 0 : (currentPage - 1) * (isAll ? totalItems : pageSize) + 1;
  const endIndexDisplay = isAll ? totalItems : Math.min(currentPage * (pageSize as number), totalItems);

  // Helper code
  const getActivityCode = (act: Activity) => {
    if (act.code && act.code.trim()) return act.code.trim().toUpperCase();
    const idx = activities.findIndex(a => a.id === act.id);
    return `A${String(idx >= 0 ? idx + 1 : 1).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Historial de actividades pasadas
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {pastActivities.length} realizadas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Actividades terminadas cuya fecha de finalización es anterior a hoy. Puedes reactivarlas a "En curso" para que vuelvan a la pestaña Guía.
            </p>
          </div>
        </div>

        {/* Search & Group Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en historial..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden xs:inline" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 truncate"
            >
              <option value="">Todos los grupos ({pastActivities.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code ? `[${g.code}] ` : ''}{g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content Area: Activities rendered like in DailyMissionsModal to save space */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        {totalItems === 0 ? (
          <div className="py-10 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">
              No hay actividades en el historial pasado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando marques una actividad como "Terminada" en Guía y pase su día de finalización, se archivará automáticamente en este historial.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedItems.map((act) => {
              const actCode = getActivityCode(act);
              const group = groups.find(g => g.id === act.groupId);
              const groupColor = group?.color || '#94a3b8';
              const groupCode = group?.code || (group ? group.name.slice(0, 3).toUpperCase() : 'GEN');
              const groupName = group ? group.name : 'General';
              const finishedDate = act.completedDate || act.endDate || act.startDate;

              return (
                <div
                  key={act.id}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                >
                  {/* Left Side: Code Badge + Name + Group below */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: act.color }}
                      title={`Código: ${actCode}`}
                    >
                      {actCode}
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={act.name}>
                        {act.name}
                      </span>

                      {/* Group and metadata under the name */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <div className="flex items-center gap-1">
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
                          <span className="font-medium text-slate-600 truncate max-w-[120px]">
                            {groupName}
                          </span>
                        </div>

                        <span aria-hidden="true" className="text-slate-300">·</span>

                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          Finalizada: {formatFriendlyDate(finishedDate)}
                        </span>

                        {act.subActivities && act.subActivities.length > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-slate-400">
                              {act.subActivities.length} sesiones
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quick Action to change back to "En curso" + Edit + Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleActivityCompletion(act.id, false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/40 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Volver a poner esta actividad en curso (regresa a la pestaña Guía)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
                      <span>Reactivar a En Curso</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditActivity(act)}
                      className="p-1.5 text-slate-400 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Editar actividad"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteId === act.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={() => onDeleteActivity(act.id)}
                          className="px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded cursor-pointer"
                        >
                          Borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1 py-0.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(act.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer: Google Ads Style with 5, 20, 50, Todos options & Page numbers */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Mostrar por página:</span>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            {([5, 20, 50, 'all'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setPageSize(sz)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  pageSize === sz
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sz === 'all' ? 'Todos' : sz}
              </button>
            ))}
          </div>
          <span className="text-slate-400 font-medium pl-1">
            ({startIndexDisplay} - {endIndexDisplay} de {totalItems})
          </span>
        </div>

        {/* Page Buttons: 1, 2, 3... (Google Ads style) */}
        {!isAll && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              // Show page numbers near current
              const isNear = Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages;
              if (!isNear) {
                if (p === 2 || p === totalPages - 1) {
                  return <span key={p} className="px-1 text-slate-400">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    currentPage === p
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-extrabold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
