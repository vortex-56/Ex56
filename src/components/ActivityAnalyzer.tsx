import React, { useState } from 'react';
import { Activity, SubActivity } from '../types';
import { Activity as ActivityIcon, Plus, X, Check, Flag, Play, CheckCircle2 } from 'lucide-react';

interface ActivityAnalyzerProps {
  activities: Activity[];
  analyzedActivityIds: string[];
  onAddAnalyzedActivity: (activityId: string) => void;
  onRemoveAnalyzedActivity: (activityId: string) => void;
  onToggleActivityCompletion: (activityId: string, isCompleted: boolean) => void;
}

export const ActivityAnalyzer: React.FC<ActivityAnalyzerProps> = ({
  activities,
  analyzedActivityIds,
  onAddAnalyzedActivity,
  onRemoveAnalyzedActivity,
  onToggleActivityCompletion,
}) => {
  // Local state for tracking checked subactivities within the analyzer
  const [completedSubs, setCompletedSubs] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');
  // Local state for tracking collapsed subactivity boxes by activity ID
  const [collapsedSubBoxes, setCollapsedSubBoxes] = useState<Record<string, boolean>>({});

  const analyzedActivities = activities.filter(a => analyzedActivityIds.includes(a.id));
  const availableActivities = activities.filter(a => !analyzedActivityIds.includes(a.id));
  const isMaxReached = analyzedActivities.length >= 3;

  const toggleCollapseSubs = (activityId: string) => {
    setCollapsedSubBoxes(prev => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
  };

  const getActivityCode = (act: Activity) => {
    if (act.code && act.code.trim()) return act.code.trim().toUpperCase();
    const idx = activities.findIndex(a => a.id === act.id);
    return `A${String(idx >= 0 ? idx + 1 : 1).padStart(2, '0')}`;
  };

  const getSubCode = (sub: SubActivity, parentCode: string, idx: number) => {
    if (sub.code && sub.code.trim()) return sub.code.trim().toUpperCase();
    return `${parentCode}.${idx + 1}`;
  };

  const handleToggleSub = (act: Activity, subId: string) => {
    const actSubs = completedSubs[act.id] || {};
    const willBeChecked = !actSubs[subId];
    const nextSubs = { ...actSubs, [subId]: willBeChecked };

    setCompletedSubs(prev => ({
      ...prev,
      [act.id]: nextSubs,
    }));

    // If all subactivities are now checked, automatically mark the activity as completed ("Fin" turns ON)
    const totalSubs = act.subActivities.length;
    const allChecked = totalSubs > 0 && act.subActivities.every(s => s.id === subId ? willBeChecked : !!actSubs[s.id]);
    
    if (allChecked && !act.isCompleted) {
      onToggleActivityCompletion(act.id, true);
    } else if (!allChecked && act.isCompleted) {
      onToggleActivityCompletion(act.id, false);
    }
  };

  const handleToggleFin = (act: Activity) => {
    const nextStatus = !act.isCompleted;
    onToggleActivityCompletion(act.id, nextStatus);

    // If turned on and has subactivities, mark all subactivities checked
    if (nextStatus && act.subActivities.length > 0) {
      const allDone: Record<string, boolean> = {};
      act.subActivities.forEach(s => {
        allDone[s.id] = true;
      });
      setCompletedSubs(prev => ({
        ...prev,
        [act.id]: allDone,
      }));
    } else if (!nextStatus && act.subActivities.length > 0) {
      // If turned off, reset subactivities
      setCompletedSubs(prev => ({
        ...prev,
        [act.id]: {},
      }));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToAdd) return;
    onAddAnalyzedActivity(selectedToAdd);
    setSelectedToAdd('');
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 border-b-2 border-amber-400/40 p-3 sm:p-4 space-y-3.5 transition-all">
      {/* Header bar: Title & Add Activity Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 shadow-2xs">
            <ActivityIcon className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                Análisis de Actividades
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {analyzedActivities.length}/3 activas
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Monitorea el progreso con línea temporal de Inicio a Fin y seguimiento de sesiones.
            </p>
          </div>
        </div>

        {/* Add Activity Controls: Dropdown on first line, button on line below */}
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-1.5 w-full sm:w-72 shrink-0">
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            disabled={isMaxReached || availableActivities.length === 0}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 disabled:opacity-50 disabled:bg-slate-100 shadow-2xs"
          >
            <option value="">
              {isMaxReached 
                ? 'Máximo 3 actividades alcanzado' 
                : availableActivities.length === 0 
                  ? 'No hay más actividades disponibles' 
                  : '+ Seleccionar actividad para analizar...'}
            </option>
            {availableActivities.map(act => (
              <option key={act.id} value={act.id}>
                {getActivityCode(act)} - {act.name}
              </option>
            ))}
          </select>

          <div>
            <button
              type="submit"
              disabled={!selectedToAdd || isMaxReached}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Agregar actividad</span>
            </button>
          </div>
        </form>
      </div>

      {/* Empty State when no activities are selected in the analyzer */}
      {analyzedActivities.length === 0 && (
        <div className="py-4 text-center rounded-xl bg-white/70 border border-dashed border-amber-300/80 p-4">
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            No has seleccionado ninguna actividad para analizar.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Selecciona una actividad en el selector superior para desplegar su línea temporal de Inicio a Fin (hasta 3 simultáneas).
          </p>
        </div>
      )}

      {/* Analyzed Activities Cards */}
      <div className="space-y-3">
        {analyzedActivities.map((act) => {
          const actCode = getActivityCode(act);
          const actSubs = completedSubs[act.id] || {};
          const hasSubs = act.subActivities.length > 0;
          const isCollapsed = !!collapsedSubBoxes[act.id];
          const completedSubCount = act.subActivities.filter(s => !!actSubs[s.id]).length;
          const isFinActive = act.isCompleted || (hasSubs && completedSubCount === act.subActivities.length && act.subActivities.length > 0);

          return (
            <div
              key={act.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 sm:p-4 space-y-3 transition-all hover:border-amber-300"
            >
              {/* Row 1: Code, Name, Status, and Close button */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleCollapseSubs(act.id)}
                    title={
                      hasSubs
                        ? (isCollapsed
                            ? `Clic para mostrar sesiones (${actCode})`
                            : `Clic para ocultar sesiones (${actCode})`)
                        : `Código ${actCode}`
                    }
                    className="inline-flex items-center justify-center font-mono font-bold text-xs text-white px-2 py-0.5 rounded-md shadow-2xs shrink-0 cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all ring-1 ring-black/15"
                    style={{ backgroundColor: act.color }}
                  >
                    {actCode}
                  </button>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {act.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                      isFinActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isFinActive ? 'Terminada' : 'En proceso'}
                  </span>
                  <button
                    onClick={() => onRemoveAnalyzedActivity(act.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Quitar del panel de análisis"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Sub-activities with checkboxes (hidden when collapsed via clicking the code) */}
              {hasSubs && !isCollapsed && (
                <div className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200/80 transition-all animate-fadeIn">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Sesiones / Sub-actividades a marcar:
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCollapseSubs(act.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      ocultar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {act.subActivities.map((sub, sIdx) => {
                      const isSubChecked = !!actSubs[sub.id];
                      const subCode = getSubCode(sub, actCode, sIdx);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                            isSubChecked
                              ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSubChecked}
                            onChange={() => handleToggleSub(act, sub.id)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                          />
                          <span
                            className="font-mono text-[10px] px-1 py-0.2 rounded font-bold text-white shrink-0"
                            style={{ backgroundColor: act.color }}
                          >
                            {subCode}
                          </span>
                          <span className="truncate">{sub.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Row 3: Horizontal Timeline with Inicio, intermediate nodes, and Fin */}
              <div className="pt-2 pb-1">
                <div className="relative flex items-center justify-between px-3 sm:px-6">
                  {/* Connecting Background Line */}
                  <div 
                    className="absolute left-6 right-6 sm:left-9 sm:right-9 top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                    style={{ backgroundColor: `${act.color}35` }}
                  />
                  {/* Progress Filled Line */}
                  <div
                    className="absolute left-6 sm:left-9 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: act.color,
                      width: !hasSubs
                        ? isFinActive ? 'calc(100% - 3rem)' : '0%'
                        : `${(completedSubCount / Math.max(1, act.subActivities.length)) * 100}%`,
                      maxWidth: 'calc(100% - 3rem)',
                    }}
                  />

                  {/* Node 1: INICIO (always turned ON / illuminated) */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white shadow-md ring-4 transition-all"
                      style={{ 
                        backgroundColor: act.color,
                        boxShadow: `0 0 12px ${act.color}88`,
                        // @ts-expect-error Tailwind ring color inline override
                        '--tw-ring-color': `${act.color}33`,
                      }}
                      title="Inicio de la actividad (activo)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 mt-1 uppercase tracking-wider">
                      Inicio
                    </span>
                  </div>

                  {/* Intermediate Nodes for each Sub-activity */}
                  {hasSubs && act.subActivities.map((sub, sIdx) => {
                    const isSubChecked = !!actSubs[sub.id];
                    return (
                      <div
                        key={sub.id}
                        className="relative z-10 flex flex-col items-center cursor-pointer group"
                        onClick={() => handleToggleSub(act, sub.id)}
                        title={`Sesión ${sIdx + 1}: ${sub.name} (${isSubChecked ? 'Completada' : 'Pendiente'})`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                            isSubChecked
                              ? 'text-white shadow-sm ring-2'
                              : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-slate-400'
                          }`}
                          style={
                            isSubChecked
                              ? {
                                  backgroundColor: act.color,
                                  borderColor: act.color,
                                  // @ts-expect-error Tailwind ring color inline override
                                  '--tw-ring-color': `${act.color}33`,
                                }
                              : undefined
                          }
                        >
                          {isSubChecked ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-bold">{sIdx + 1}</span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 mt-1 max-w-[50px] truncate text-center hidden xs:block">
                          P.{sIdx + 1}
                        </span>
                      </div>
                    );
                  })}

                  {/* Node Last: FIN (Clickable, turns on when completed) */}
                  <div 
                    className="relative z-10 flex flex-col items-center cursor-pointer group"
                    onClick={() => handleToggleFin(act)}
                    title={isFinActive ? 'Fin alcanzado (clic para reabrir)' : 'Clic para marcar la actividad como Terminada'}
                  >
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                        isFinActive
                          ? 'text-white shadow-md ring-4 animate-in zoom-in-75 duration-200'
                          : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-amber-500 group-hover:text-amber-600 shadow-2xs'
                      }`}
                      style={
                        isFinActive
                          ? {
                              backgroundColor: act.color,
                              boxShadow: `0 0 12px ${act.color}88`,
                              // @ts-expect-error Tailwind ring color inline override
                              '--tw-ring-color': `${act.color}33`,
                            }
                          : undefined
                      }
                    >
                      {isFinActive ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                      ) : (
                        <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                      )}
                    </div>
                    <span 
                      className={`text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-wider transition-colors ${
                        isFinActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 group-hover:text-slate-800'
                      }`}
                    >
                      Fin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
