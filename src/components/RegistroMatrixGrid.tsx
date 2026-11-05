import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Resource, ActivityGroup, DayInfo, DailyResourceLog, ResourceAvailability, DayResourceState } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Edit2, 
  Trash2, 
  Check, 
  Plus, 
  Coins, 
  SlidersHorizontal,
  CalendarDays,
  DollarSign,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  X,
  Clock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface RegistroMatrixGridProps {
  days: DayInfo[];
  resources: Resource[];
  groups: ActivityGroup[];
  resourceLogs?: Record<string, DailyResourceLog>;
  onToggleResourceBought: (resourceId: string, dateStr: string) => void;
  onUpdateResourceDayCost: (resourceId: string, dateStr: string, cost: number) => void;
  onUpdateResourceStatus?: (resourceId: string, newAvailability: ResourceAvailability) => void;
  onRenewResource?: (resourceId: string, dateStr: string, renewalCost?: number) => void;
  onSetDayResourceState?: (resourceId: string, dateStr: string, state: DayResourceState, cost?: number) => void;
  onMoveResource?: (resourceId: string, direction: 'up' | 'down') => void;
  onAddResource: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
  onPrevDateWindow: () => void;
  onNextDateWindow: () => void;
  onTodayWindow: () => void;
  onOpenTimeSettings: () => void;
  activeFilterGroup?: string | null;
  onSetFilterGroup?: (groupId: string | null) => void;
}

export const RegistroMatrixGrid: React.FC<RegistroMatrixGridProps> = ({
  days,
  resources,
  groups,
  resourceLogs = {},
  onToggleResourceBought,
  onUpdateResourceDayCost,
  onUpdateResourceStatus,
  onRenewResource,
  onSetDayResourceState,
  onMoveResource,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onPrevDateWindow,
  onNextDateWindow,
  onTodayWindow,
  onOpenTimeSettings,
  activeFilterGroup,
  onSetFilterGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCostCell, setEditingCostCell] = useState<{ id: string; date: string } | null>(null);
  const [tempCostValue, setTempCostValue] = useState<string>('');
  const [isCompactWidth, setIsCompactWidth] = useState(false);
  const [confirmDeleteResId, setConfirmDeleteResId] = useState<string | null>(null);

  // Duration action popover state
  const [activeDurationPopover, setActiveDurationPopover] = useState<{
    resId: string;
    dateStr: string;
    dayNumber: number;
    dayName: string;
    currentState: DayResourceState;
    currentCost: number;
  } | null>(null);

  const [renewalInputCost, setRenewalInputCost] = useState<string>('');

  // Drag to scroll for calendar without scrollbars
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileIsDown = useRef(false);
  const mobileStartX = useRef(0);
  const mobileScrollLeft = useRef(0);
  const mobileIsDragging = useRef(false);

  const handleMobileMouseDown = (e: React.MouseEvent) => {
    const el = mobileScrollRef.current;
    if (!el) return;
    mobileIsDown.current = true;
    mobileIsDragging.current = false;
    mobileStartX.current = e.pageX - el.offsetLeft;
    mobileScrollLeft.current = el.scrollLeft;
  };

  const handleMobileMouseMove = (e: React.MouseEvent) => {
    if (!mobileIsDown.current) return;
    const el = mobileScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - mobileStartX.current) * 1.25;
    if (Math.abs(walk) > 4) {
      mobileIsDragging.current = true;
    }
    el.scrollLeft = mobileScrollLeft.current - walk;
  };

  const handleMobileMouseUp = () => {
    mobileIsDown.current = false;
    setTimeout(() => {
      mobileIsDragging.current = false;
    }, 60);
  };

  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const desktopIsDown = useRef(false);
  const desktopStartX = useRef(0);
  const desktopScrollLeft = useRef(0);
  const desktopIsDragging = useRef(false);

  const handleDesktopMouseDown = (e: React.MouseEvent) => {
    const el = desktopScrollRef.current;
    if (!el) return;
    desktopIsDown.current = true;
    desktopIsDragging.current = false;
    desktopStartX.current = e.pageX - el.offsetLeft;
    desktopScrollLeft.current = el.scrollLeft;
  };

  const handleDesktopMouseMove = (e: React.MouseEvent) => {
    if (!desktopIsDown.current) return;
    const el = desktopScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - desktopStartX.current) * 1.25;
    if (Math.abs(walk) > 4) {
      desktopIsDragging.current = true;
    }
    el.scrollLeft = desktopScrollLeft.current - walk;
  };

  const handleDesktopMouseUp = () => {
    desktopIsDown.current = false;
    setTimeout(() => {
      desktopIsDragging.current = false;
    }, 60);
  };

  // Strictly filter to resource groups only
  const resourceGroups = useMemo(() => {
    return groups.filter(g => g.type === 'resource');
  }, [groups]);

  // Filter resources with custom position ordering
  const filteredResources = useMemo(() => {
    const list = resources.filter(res => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = res.name.toLowerCase().includes(q);
        const matchesCode = res.code ? res.code.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode) return false;
      }
      if (activeFilterGroup) {
        if (activeFilterGroup === '__ungrouped__') {
          return !res.groupId;
        }
        return res.groupId === activeFilterGroup;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return 0;
    });
  }, [resources, searchQuery, activeFilterGroup]);

  // Today day reference
  const todayDay = useMemo(() => days.find(d => d.isToday), [days]);

  // Current month determination (from days or today)
  const currentMonthInfo = useMemo(() => {
    const ref = todayDay || days[Math.floor(days.length / 2)] || days[0];
    if (!ref) return { prefix: '2026-11', name: 'este mes' };
    const prefix = ref.dateStr.slice(0, 7); // "YYYY-MM"
    const name = ref.monthName.toLowerCase();
    return { prefix, name };
  }, [todayDay, days]);

  // Helper code for resources
  const getResourceCode = (res: Resource, idx: number) => {
    if (res.code && res.code.trim()) return res.code.trim().toUpperCase();
    return `R${String(idx + 1).padStart(2, '0')}`;
  };

  /**
   * TIMELINE STATE PROPAGATION ALGORITHM
   * For resources with hasDurationStatus:
   * 1. Finds explicit milestones (conseguido/renovado, disponible, por_terminar/por_agotar, ninguno/agotado).
   * 2. After a 'conseguido' day, subsequent days automatically become 'disponible' (verde).
   * 3. After 'por_terminar', subsequent days continue as 'por_terminar' (rojo).
   * 4. After 'ninguno', subsequent days continue as 'ninguno' (caja se mantiene igual / no se tenía).
   */
  const resourceTimelines = useMemo(() => {
    const map: Record<string, Record<string, { state: DayResourceState; isMilestone: boolean; cost?: number }>> = {};

    for (const res of filteredResources) {
      if (!res.hasDurationStatus) continue;

      const milestonesMap: Record<string, { state: DayResourceState; cost?: number }> = {};

      if (res.lastRenewedDate) {
        milestonesMap[res.lastRenewedDate] = { 
          state: 'conseguido', 
          cost: res.hasCost ? res.cost : 0 
        };
      }

      const prefix = `${res.id}_`;
      for (const [key, log] of Object.entries(resourceLogs)) {
        if (!key.startsWith(prefix)) continue;
        const dStr = key.slice(prefix.length);
        if (log.renewed || log.state === 'renovado' || log.state === 'conseguido') {
          milestonesMap[dStr] = { state: 'conseguido', cost: log.cost };
        } else if (log.state) {
          let normalized: DayResourceState = log.state;
          if (normalized === 'por_agotar') normalized = 'por_terminar';
          if (normalized === 'agotado') normalized = 'ninguno';
          milestonesMap[dStr] = { state: normalized, cost: log.cost };
        }
      }

      const sortedDates = Object.keys(milestonesMap).sort();
      const dayMap: Record<string, { state: DayResourceState; isMilestone: boolean; cost?: number }> = {};

      for (const day of days) {
        const d = day.dateStr;
        if (milestonesMap[d]) {
          dayMap[d] = { 
            state: milestonesMap[d].state, 
            isMilestone: true, 
            cost: milestonesMap[d].cost 
          };
          continue;
        }

        const prior = sortedDates.filter(m => m <= d);
        if (prior.length > 0) {
          const lastDate = prior[prior.length - 1];
          const lastInfo = milestonesMap[lastDate];
          if (lastInfo.state === 'conseguido' || lastInfo.state === 'renovado') {
            // Day after 'conseguido' continues as 'disponible' (verde)!
            dayMap[d] = { state: 'disponible', isMilestone: false };
          } else if (lastInfo.state === 'disponible') {
            dayMap[d] = { state: 'disponible', isMilestone: false };
          } else if (lastInfo.state === 'por_terminar' || lastInfo.state === 'por_agotar') {
            dayMap[d] = { state: 'por_terminar', isMilestone: false };
          } else {
            // ninguno / agotado continues as ninguno (caja igual / no se tenía)
            dayMap[d] = { state: 'ninguno', isMilestone: false };
          }
        } else {
          // No prior milestone
          const base = res.availabilityStatus === 'disponible' ? 'disponible' : 'ninguno';
          dayMap[d] = { state: base as DayResourceState, isMilestone: false };
        }
      }

      map[res.id] = dayMap;
    }

    return map;
  }, [filteredResources, days, resourceLogs]);

  // Comprehensive stats per resource (separating Expense and Income)
  const resourceMonthlyStats = useMemo(() => {
    const stats: Record<string, { 
      renewalsCount: number; 
      monthSpent: number; 
      allTimeRenewals: number; 
      allTimeSpent: number;
      boughtCount: number;
      monthEarned: number;
      allTimeEarned: number;
      monthPendingEarned: number;
      allTimePendingEarned: number;
      earnedCount: number;
    }> = {};

    for (const res of filteredResources) {
      const isIncome = res.resourceNature === 'income';
      let mRenewals = 0;
      let mSpent = 0;
      let aRenewals = 0;
      let aSpent = 0;
      let bCount = 0;

      let mEarned = 0;
      let aEarned = 0;
      let mPendingEarned = 0;
      let aPendingEarned = 0;
      let eCount = 0;

      const prefixMonth = `${res.id}_${currentMonthInfo.prefix}`;
      const prefixAll = `${res.id}_`;

      for (const [key, log] of Object.entries(resourceLogs)) {
        if (!key.startsWith(prefixAll)) continue;

        const isConseguido = log.renewed || log.state === 'conseguido' || log.state === 'renovado';
        const isBoughtOrEarned = log.bought || isConseguido;
        const costVal = (log.cost !== undefined && log.cost > 0) ? log.cost : 0;

        if (isConseguido) {
          aRenewals++;
          if (key.startsWith(prefixMonth)) {
            mRenewals++;
          }
        }

        if (isIncome) {
          if (isBoughtOrEarned) {
            eCount++;
            if (res.hasCost && costVal > 0) {
              aEarned += costVal;
              if (key.startsWith(prefixMonth)) {
                mEarned += costVal;
              }
            }
          } else if (costVal > 0) {
            // Recompensa pendiente por cobrar
            aPendingEarned += costVal;
            if (key.startsWith(prefixMonth)) {
              mPendingEarned += costVal;
            }
          }
        } else {
          // Regular expense
          if (isBoughtOrEarned) {
            bCount++;
            if (res.hasCost && costVal > 0) {
              aSpent += costVal;
              if (key.startsWith(prefixMonth)) {
                mSpent += costVal;
              }
            }
          }
        }
      }

      stats[res.id] = {
        renewalsCount: mRenewals,
        monthSpent: Math.round(mSpent * 100) / 100,
        allTimeRenewals: aRenewals,
        allTimeSpent: Math.round(aSpent * 100) / 100,
        boughtCount: bCount,
        monthEarned: Math.round(mEarned * 100) / 100,
        allTimeEarned: Math.round(aEarned * 100) / 100,
        monthPendingEarned: Math.round(mPendingEarned * 100) / 100,
        allTimePendingEarned: Math.round(aPendingEarned * 100) / 100,
        earnedCount: eCount,
      };
    }

    return stats;
  }, [filteredResources, currentMonthInfo, resourceLogs]);

  // Read log for a resource and date
  const getResourceDayData = (resId: string, dateStr: string) => {
    const key = `${resId}_${dateStr}`;
    const log = resourceLogs[key];
    const isBought = log?.bought || log?.state === 'conseguido' || log?.state === 'renovado';
    const costNum = (log?.cost !== undefined && log.cost > 0) ? log.cost : 0;
    return { isBought: !!isBought, costNum, hasCostEntered: costNum > 0 };
  };

  // Daily totals calculations: strictly separating Expenses vs Incomes / Activos
  const dailyTotals = useMemo(() => {
    const totals: Record<string, { 
      expenseTotal: number;
      expensePaid: number;
      expensePending: number;
      incomeTotal: number;
      incomeEarned: number;
      incomePending: number;
      netBalance: number;
    }> = {};

    for (const day of days) {
      let expTotal = 0;
      let expPaid = 0;
      let incTotal = 0;
      let incEarned = 0;

      for (const res of resources) {
        if (!res.hasCost) continue;
        const key = `${res.id}_${day.dateStr}`;
        const log = resourceLogs[key];
        const costVal = (log?.cost !== undefined && log.cost > 0) ? log.cost : 0;
        const isCompleted = log?.bought || log?.state === 'conseguido' || log?.state === 'renovado';

        if (costVal > 0) {
          if (res.resourceNature === 'income') {
            incTotal += costVal;
            if (isCompleted) {
              incEarned += costVal;
            }
          } else {
            expTotal += costVal;
            if (isCompleted) {
              expPaid += costVal;
            }
          }
        }
      }

      const expPending = Math.max(0, expTotal - expPaid);
      const incPending = Math.max(0, incTotal - incEarned);
      const net = incEarned - expPaid;

      totals[day.dateStr] = {
        expenseTotal: Math.round(expTotal * 100) / 100,
        expensePaid: Math.round(expPaid * 100) / 100,
        expensePending: Math.round(expPending * 100) / 100,
        incomeTotal: Math.round(incTotal * 100) / 100,
        incomeEarned: Math.round(incEarned * 100) / 100,
        incomePending: Math.round(incPending * 100) / 100,
        netBalance: Math.round(net * 100) / 100,
      };
    }
    return totals;
  }, [days, resources, resourceLogs]);

  // Today totals
  const todayStats = useMemo(() => {
    if (!todayDay) return { 
      expenseTotal: 0, 
      expensePaid: 0, 
      expensePending: 0,
      incomeTotal: 0,
      incomeEarned: 0,
      incomePending: 0,
      netBalance: 0
    };
    return dailyTotals[todayDay.dateStr] || { 
      expenseTotal: 0, 
      expensePaid: 0, 
      expensePending: 0,
      incomeTotal: 0,
      incomeEarned: 0,
      incomePending: 0,
      netBalance: 0
    };
  }, [todayDay, dailyTotals]);

  // Inline editing handlers
  const handleStartEditCost = (resId: string, dateStr: string, currentCost: number) => {
    setEditingCostCell({ id: resId, date: dateStr });
    setTempCostValue(currentCost > 0 ? currentCost.toString() : '');
  };

  const handleSaveCost = (resId: string, dateStr: string) => {
    const val = parseFloat(tempCostValue);
    if (!isNaN(val) && val > 0) {
      onUpdateResourceDayCost(resId, dateStr, Math.round(val * 100) / 100);
    } else {
      onUpdateResourceDayCost(resId, dateStr, 0);
    }
    setEditingCostCell(null);
  };

  // Open popover for duration status day cell
  const handleOpenDurationPopover = (
    res: Resource, 
    day: DayInfo, 
    currentState: DayResourceState, 
    currentCost: number
  ) => {
    setActiveDurationPopover({
      resId: res.id,
      dateStr: day.dateStr,
      dayNumber: day.dayNumber,
      dayName: day.dayName,
      currentState,
      currentCost,
    });
    setRenewalInputCost(currentCost > 0 ? currentCost.toString() : (res.cost > 0 ? res.cost.toString() : ''));
  };

  // Apply state from popover
  const handleApplyStateFromPopover = (newState: DayResourceState) => {
    if (!activeDurationPopover || !onSetDayResourceState) return;
    const { resId, dateStr } = activeDurationPopover;
    const targetResource = resources.find(r => r.id === resId);

    if (newState === 'conseguido' || newState === 'renovado') {
      const parsedCost = parseFloat(renewalInputCost);
      const defaultCost = targetResource?.cost || 0;
      const finalCost = (!isNaN(parsedCost) && parsedCost >= 0) ? Math.round(parsedCost * 100) / 100 : defaultCost;
      if (onRenewResource) {
        onRenewResource(resId, dateStr, finalCost);
      } else {
        onSetDayResourceState(resId, dateStr, 'conseguido', finalCost);
      }
    } else {
      onSetDayResourceState(resId, dateStr, newState, 0);
    }
    setActiveDurationPopover(null);
  };

  // Quick cycle state on double-click or quick-action: ninguno -> disponible -> por_terminar -> conseguido -> ninguno
  const handleQuickCycleState = (res: Resource, day: DayInfo, currentState: DayResourceState, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onSetDayResourceState) return;

    let nextState: DayResourceState = 'disponible';
    if (currentState === 'ninguno' || currentState === 'agotado') {
      nextState = 'disponible';
    } else if (currentState === 'disponible') {
      nextState = 'por_terminar';
    } else if (currentState === 'por_terminar' || currentState === 'por_agotar') {
      nextState = 'conseguido';
    } else {
      nextState = 'ninguno';
    }

    if (nextState === 'conseguido') {
      const costToUse = res.hasCost ? res.cost : 0;
      if (onRenewResource) {
        onRenewResource(res.id, day.dateStr, costToUse);
      } else {
        onSetDayResourceState(res.id, day.dateStr, 'conseguido', costToUse);
      }
    } else {
      onSetDayResourceState(res.id, day.dateStr, nextState, 0);
    }
  };

  // Reusable day cell renderer for both mobile layout and desktop table
  const renderDayCellContent = (res: Resource, day: DayInfo, isMobile: boolean = false) => {
    const hasDuration = !!res.hasDurationStatus;
    const timeline = resourceTimelines[res.id] || {};
    const dayTimeline = timeline[day.dateStr] || { state: 'ninguno', isMilestone: false };
    const dayState = dayTimeline.state;
    const { isBought, costNum, hasCostEntered } = getResourceDayData(res.id, day.dateStr);
    const isEditingThisCell = editingCostCell?.id === res.id && editingCostCell?.date === day.dateStr;

    if (hasDuration) {
      return (
        <div 
          onClick={() => handleOpenDurationPopover(res, day, dayState, costNum)}
          onDoubleClick={(e) => handleQuickCycleState(res, day, dayState, e)}
          className={`w-full ${isMobile ? 'h-[46px] min-h-[46px]' : 'w-[98px] h-[52px] min-h-[52px] max-h-[52px]'} mx-auto py-0.5 px-1 rounded-xl transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs select-none ${
            dayState === 'conseguido' || dayState === 'renovado'
              ? 'bg-cyan-500 text-white border-cyan-600 font-black shadow-xs hover:bg-cyan-600'
              : dayState === 'disponible'
                ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs hover:bg-emerald-600'
                : dayState === 'por_terminar' || dayState === 'por_agotar'
                  ? 'bg-rose-500 text-white border-rose-600 font-bold shadow-xs hover:bg-rose-600'
                  : 'bg-white text-slate-400 border-slate-200 font-normal hover:bg-slate-50 hover:border-slate-300'
          }`}
          title={`Estado: ${
            dayState === 'conseguido' || dayState === 'renovado'
              ? 'Conseguido (Se compró de nuevo)'
              : dayState === 'disponible'
                ? 'Disponible (Verde - Se compró y aún se tiene)'
                : dayState === 'por_terminar' || dayState === 'por_agotar'
                  ? 'Por terminar (Rojo - Se tiene pero está por terminar)'
                  : 'Ninguno (No se tenía / Agotado)'
          }. Clic para cambiar estado.`}
        >
          <div className="flex items-center gap-1 leading-none text-center">
            {dayState === 'conseguido' || dayState === 'renovado' ? (
              <>
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-100 shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight">Conseguido</span>
              </>
            ) : dayState === 'disponible' ? (
              <>
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-100 stroke-[3] shrink-0" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight">Disponible</span>
              </>
            ) : dayState === 'por_terminar' || dayState === 'por_agotar' ? (
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-tight">Por terminar</span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">Ninguno</span>
            )}
          </div>

          <div className="leading-none text-center">
            {dayState === 'conseguido' || dayState === 'renovado' ? (
              res.hasCost ? (
                costNum > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-mono font-black text-cyan-50">
                    S/. {costNum.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[8px] sm:text-[9px] text-cyan-100 underline font-semibold">
                    + precio
                  </span>
                )
              ) : (
                <span className="text-[8px] sm:text-[9px] text-cyan-100 font-semibold">
                  ✓ nuevo
                </span>
              )
            ) : dayState === 'disponible' ? (
              <span className="text-[8px] sm:text-[9px] text-emerald-100 font-medium">
                en uso
              </span>
            ) : dayState === 'por_terminar' || dayState === 'por_agotar' ? (
              <span className="text-[8px] sm:text-[9px] text-rose-100 font-medium">
                por agotar
              </span>
            ) : (
              <span className="text-[8px] sm:text-[9px] text-slate-300">
                —
              </span>
            )}
          </div>
        </div>
      );
    }

    if (res.hasCost) {
      return (
        <div className={`w-full ${isMobile ? 'h-[46px] min-h-[46px]' : 'w-[98px] h-[52px] min-h-[52px] max-h-[52px]'} mx-auto py-0.5 px-1 rounded-xl transition-all border flex flex-col items-center justify-center gap-0.5 ${
          hasCostEntered && isBought
            ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 shadow-2xs'
            : hasCostEntered
              ? (res.resourceNature === 'income' ? 'bg-amber-50/90 border-amber-300 shadow-2xs' : 'bg-white border-amber-300 shadow-2xs')
              : 'bg-white border-slate-200 hover:border-slate-300'
        }`}>
          {isEditingThisCell ? (
            <div className="flex items-center justify-center gap-0.5 w-full">
              <span className="text-[10px] font-bold text-slate-500 shrink-0">S/.</span>
              <input
                type="number"
                step="0.10"
                min="0"
                autoFocus
                placeholder="0.00"
                value={tempCostValue}
                onChange={(e) => setTempCostValue(e.target.value)}
                onBlur={() => handleSaveCost(res.id, day.dateStr)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCost(res.id, day.dateStr);
                  if (e.key === 'Escape') setEditingCostCell(null);
                }}
                className="w-12 text-center text-[11px] font-mono font-bold bg-white border border-amber-400 rounded px-0.5 py-0.5 focus:outline-hidden"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleStartEditCost(res.id, day.dateStr, costNum)}
              className={`text-[10px] sm:text-xs font-mono font-bold px-1 py-0.2 rounded cursor-pointer transition-colors w-full truncate text-center leading-tight ${
                hasCostEntered && isBought 
                  ? 'text-emerald-950 font-black hover:bg-emerald-200/60' 
                  : hasCostEntered
                    ? (res.resourceNature === 'income' ? 'text-amber-950 font-bold hover:bg-amber-100' : 'text-slate-900 font-bold hover:bg-slate-100')
                    : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title={hasCostEntered ? 'Haz clic para modificar el valor de este día' : 'Haz clic para ingresar valor a este día'}
            >
              {hasCostEntered ? (
                <span>
                  {res.resourceNature === 'income' && isBought ? '+ ' : ''}S/. {costNum.toFixed(2)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-300 font-normal">0.00</span>
              )}
            </button>
          )}

          {hasCostEntered ? (
            <button
              type="button"
              onClick={() => onToggleResourceBought(res.id, day.dateStr)}
              className={`w-full py-0.5 px-0.5 rounded text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 leading-none ${
                isBought
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  : res.resourceNature === 'income'
                  ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
              }`}
              title={
                res.resourceNature === 'income'
                  ? (isBought ? 'Ganancia cobrada hoy. Clic para cambiar a Recompensa por cobrar.' : 'Recompensa pendiente de cobrar. Clic para marcar como Ganado / Cobrado.')
                  : (isBought ? 'Comprado hoy. Clic para cambiar a falta.' : 'Marcar como comprado este día.')
              }
            >
              {isBought ? (
                <>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>{res.resourceNature === 'income' ? 'Ganado' : 'Comprado'}</span>
                </>
              ) : (
                <span>{res.resourceNature === 'income' ? 'Recompensa' : 'Falta'}</span>
              )}
            </button>
          ) : (
            <div 
              onClick={() => handleStartEditCost(res.id, day.dateStr, res.cost > 0 ? res.cost : 0)}
              className="w-full py-0.5 text-[8px] sm:text-[9px] text-slate-300 hover:text-slate-500 cursor-pointer text-center select-none"
              title="Haz clic para establecer costo"
            >
              {res.resourceNature === 'income' ? '+ ganancia' : '+ costo'}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onToggleResourceBought(res.id, day.dateStr)}
        className={`w-full ${isMobile ? 'h-[46px] min-h-[46px]' : 'w-[98px] h-[52px] min-h-[52px] max-h-[52px]'} mx-auto py-1 px-1 rounded-xl transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer ${
          isBought 
            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
            : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'
        }`}
        title={isBought ? 'Marcado como usado/comprado hoy' : 'Marcar para este día'}
      >
        {isBought ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span className="text-[9px] font-bold">Hecho</span>
          </>
        ) : (
          <span className="text-[10px] text-slate-300 font-bold">—</span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Registro Controls Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
        
        {/* Left: Search & Filter (Only resource groups) */}
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar registro..."
            className="px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-1/2 sm:w-48 font-medium"
          />

          <div className="flex items-center gap-1.5 flex-1 sm:flex-none min-w-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden xs:inline" />
            <select
              value={activeFilterGroup || ''}
              onChange={(e) => onSetFilterGroup && onSetFilterGroup(e.target.value === '' ? null : e.target.value)}
              className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-full sm:w-auto truncate font-medium"
            >
              <option value="">Todos los registros ({filteredResources.length})</option>
              {resourceGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code ? `[${g.code}] ` : ''}{g.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onAddResource}
            className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all border border-amber-400 bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-2xs cursor-pointer whitespace-nowrap active:scale-95"
            title="Crear un nuevo recurso o registro de gasto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Nuevo Registro</span>
            <span className="sm:hidden">Nuevo</span>
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

      {/* Today Financial Summary Strip: Gastos, Falta Pagar, Ganancias y Recompensas por Cobrar */}
      {todayDay && (
        <div className="bg-gradient-to-r from-amber-50/90 via-slate-50 to-emerald-50/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-amber-600" />
              Finanzas de Hoy ({todayDay.dayName} {todayDay.dayNumber} {todayDay.monthName}):
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap font-semibold text-[11px] sm:text-xs">
            {/* Gastos Pagados */}
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500">Gastado:</span>
              <span className="font-mono font-bold text-slate-900">
                S/. {todayStats.expensePaid.toFixed(2)}
              </span>
            </div>

            {/* Gastos Faltantes por pagar */}
            {todayStats.expensePending > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                <span className="text-amber-800">Falta pagar:</span>
                <span className="font-mono font-bold text-amber-950">
                  S/. {todayStats.expensePending.toFixed(2)}
                </span>
              </div>
            )}

            {/* Ganancias Cobradas */}
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
                Ganado:
              </span>
              <span className="font-mono font-black text-emerald-800">
                + S/. {todayStats.incomeEarned.toFixed(2)}
              </span>
            </div>

            {/* Recompensas / Servicios por cobrar */}
            {todayStats.incomePending > 0 && (
              <div className="flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-300 shadow-2xs">
                <span className="text-cyan-800 font-bold flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  Por cobrar:
                </span>
                <span className="font-mono font-bold text-cyan-900">
                  S/. {todayStats.incomePending.toFixed(2)}
                </span>
              </div>
            )}

            {/* Balance Neto */}
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border shadow-2xs ${
              todayStats.netBalance > 0
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black'
                : todayStats.netBalance < 0
                ? 'bg-rose-100 text-rose-950 border-rose-300 font-black'
                : 'bg-white text-slate-700 border-slate-200'
            }`}>
              <span>Balance:</span>
              <span className="font-mono font-bold">
                {todayStats.netBalance > 0 ? `+ S/. ${todayStats.netBalance.toFixed(2)}` : `S/. ${todayStats.netBalance.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE RESPONSIVE STRUCTURE: Interleaved Resources & Contained Days Scrolling */}
      <div className="block sm:hidden w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-2">
        {/* LÍNEA 1: Recursos Header Bar */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-slate-900 text-sm">
              Recursos
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({filteredResources.length})
            </span>
          </div>

          {/* Controls: Plegar a códigos toggle and add resource */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCompactWidth(!isCompactWidth)}
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                isCompactWidth
                  ? 'bg-amber-100 text-amber-950 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={isCompactWidth ? 'Mostrar nombres completos' : 'Plegar a solo códigos'}
            >
              {isCompactWidth ? (
                <>
                  <Maximize2 className="w-3 h-3 text-amber-800" />
                  <span>Nombres</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-slate-500" />
                  <span>Códigos</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onAddResource}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Crear recurso"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Contained Horizontal Scroll Area for Days (No external horizontal scroll on mobile!) */}
        <div 
          ref={mobileScrollRef}
          onMouseDown={handleMobileMouseDown}
          onMouseMove={handleMobileMouseMove}
          onMouseUp={handleMobileMouseUp}
          onMouseLeave={handleMobileMouseUp}
          className="overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full select-none cursor-grab active:cursor-grabbing"
        >
          <div className="min-w-max">
            
            {/* LÍNEA 2: Días Header (e.g. Lun 2 Nov, Mar 3 Nov...) */}
            <div className="flex bg-slate-100/95 border-b border-slate-200 sticky top-0 z-20">
              {days.map((day) => (
                <div
                  key={day.dateStr}
                  className={`w-[78px] min-w-[78px] max-w-[78px] py-2 px-1 text-center border-r border-slate-200 shrink-0 ${
                    day.isToday ? 'bg-amber-200/90 font-black text-amber-950 border-x-2 border-amber-400' : ''
                  } ${day.isWeekend && !day.isToday ? 'bg-slate-100/80' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] uppercase tracking-wider ${
                      day.isToday ? 'text-amber-950 font-black' : 'text-slate-500 font-semibold'
                    }`}>
                      {day.dayName}
                    </span>
                    <span className={`text-xs my-0.5 leading-none ${
                      day.isToday 
                        ? 'w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-xs text-[11px]' 
                        : 'font-bold text-slate-800'
                    }`}>
                      {day.dayNumber}
                    </span>
                    <span className={`text-[9px] font-medium leading-none ${
                      day.isToday ? 'text-amber-900 font-bold' : 'text-slate-400'
                    }`}>
                      {day.monthName.slice(0, 3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* RECURSOS: Por cada recurso se renderiza Línea de Nombre y luego Línea de Cajas de Días */}
            {filteredResources.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay recursos creados todavía.
              </div>
            ) : (
              filteredResources.map((res, rIdx) => {
                const resCode = getResourceCode(res, rIdx);
                const assignedGroup = groups.find(g => g.id === res.groupId);
                const groupColor = assignedGroup?.color || '#06b6d4';
                const groupCode = assignedGroup?.code || 'REC';

                return (
                  <div key={res.id} className="border-b border-slate-200 last:border-b-0">
                    
                    {/* LÍNEA DE RECURSO (Sticky a la izquierda dentro del scroll horizontal para que siempre se lea al arrastrar días!) */}
                    <div 
                      className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-slate-50/95 border-b border-slate-200/80 pl-2 pr-1.5 py-1.5 flex items-center justify-between gap-1 z-10"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Code pill */}
                        <span className="font-mono text-[10px] font-black text-slate-700 px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0 shadow-2xs">
                          {resCode}
                        </span>

                        {/* Resource Name or Code toggle */}
                        <span 
                          className="font-bold text-slate-900 text-xs truncate min-w-0 max-w-[90px] xs:max-w-[130px] cursor-pointer hover:text-amber-800"
                          onClick={() => onEditResource(res)}
                          title={res.name}
                        >
                          {isCompactWidth ? resCode : res.name}
                        </span>

                        {/* ETIQUETA A LA DERECHA DEL NOMBRE: ACTIVO O GASTO */}
                        {res.resourceNature === 'income' ? (
                          <span 
                            className="font-mono text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5" 
                            title="Activo / Servicio (Genera ganancia)"
                          >
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>ACTIVO</span>
                          </span>
                        ) : (
                          <span 
                            className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0" 
                            title="Gasto / Insumo"
                          >
                            GASTO
                          </span>
                        )}

                        {/* Group indicator */}
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-xs ml-0.5"
                          style={{ backgroundColor: groupColor }}
                          title={`Grupo: ${groupCode}`}
                        />
                      </div>

                      {/* Right controls: Move Up/Down, Edit, Delete */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {onMoveResource && (
                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={rIdx === 0}
                              onClick={() => onMoveResource(res.id, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Subir de posición"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={rIdx === filteredResources.length - 1}
                              onClick={() => onMoveResource(res.id, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Bajar de posición"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditResource(res)}
                          className="p-1 text-slate-400 hover:text-amber-800 rounded hover:bg-slate-200/50 cursor-pointer shrink-0"
                          title="Editar recurso"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteResId === res.id ? (
                          <div className="flex items-center gap-0.5 bg-red-50 p-0.5 rounded border border-red-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteResource(res.id);
                                setConfirmDeleteResId(null);
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-100 rounded cursor-pointer"
                            >
                              Borrar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteResId(null)}
                              className="px-1 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteResId(res.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                            title="Eliminar recurso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LÍNEA DE CAJAS DE DÍAS DEL RECURSO (tantas cajas como días que entran en la línea 2) */}
                    <div className="flex bg-white h-[54px]">
                      {days.map((day) => (
                        <div
                          key={day.dateStr}
                          className={`w-[78px] min-w-[78px] max-w-[78px] h-[54px] p-1 border-r border-slate-100 flex items-center justify-center shrink-0 ${
                            day.isToday ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          {renderDayCellContent(res, day, true)}
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })
            )}

            {/* RESUMEN FINANCIERO EN MOBILE (5 filas alineadas con los días) */}
            {filteredResources.length > 0 && (
              <div className="border-t-2 border-slate-200 divide-y divide-slate-100">
                
                {/* Fila 1: Gastos pagados */}
                <div>
                  <div className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-slate-100/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1"><Receipt className="w-3 h-3 text-slate-500" /> Gastos pagados</span>
                    <span className="text-[10px] text-slate-500 font-mono">Comprado</span>
                  </div>
                  <div className="flex bg-slate-50/70 h-9">
                    {days.map((day) => {
                      const paid = dailyTotals[day.dateStr]?.expensePaid || 0;
                      return (
                        <div key={day.dateStr} className={`w-[78px] min-w-[78px] max-w-[78px] h-9 p-1 border-r border-slate-200 flex items-center justify-center font-mono text-xs font-bold text-slate-800 shrink-0 ${day.isToday ? 'bg-amber-100/50' : ''}`}>
                          {paid > 0 ? `S/. ${paid.toFixed(2)}` : '—'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fila 2: Falta pagar */}
                <div>
                  <div className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-amber-50/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-700" /> Falta pagar</span>
                    <span className="text-[10px] text-amber-700 font-mono">Pendiente</span>
                  </div>
                  <div className="flex bg-amber-50/40 h-9">
                    {days.map((day) => {
                      const pending = dailyTotals[day.dateStr]?.expensePending || 0;
                      return (
                        <div key={day.dateStr} className={`w-[78px] min-w-[78px] max-w-[78px] h-9 p-1 border-r border-slate-200 flex items-center justify-center font-mono text-xs font-bold text-amber-900 shrink-0 ${day.isToday ? 'bg-amber-100/60' : ''}`}>
                          {pending > 0 ? `S/. ${pending.toFixed(2)}` : '—'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fila 3: Ganancias cobradas */}
                <div>
                  <div className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-emerald-50/95 px-2.5 py-1 text-[11px] font-bold text-emerald-950 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-700" /> Ganancias cobradas</span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">Ganado</span>
                  </div>
                  <div className="flex bg-emerald-50/40 h-9">
                    {days.map((day) => {
                      const earned = dailyTotals[day.dateStr]?.incomeEarned || 0;
                      return (
                        <div key={day.dateStr} className={`w-[78px] min-w-[78px] max-w-[78px] h-9 p-1 border-r border-emerald-200 flex items-center justify-center font-mono text-xs font-black text-emerald-800 shrink-0 ${day.isToday ? 'bg-emerald-100/60' : ''}`}>
                          {earned > 0 ? `+ S/. ${earned.toFixed(2)}` : '—'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fila 4: Servicios por cobrar */}
                <div>
                  <div className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-cyan-50/95 px-2.5 py-1 text-[11px] font-bold text-cyan-950 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-cyan-700" /> Por cobrar</span>
                    <span className="text-[10px] text-cyan-700 font-mono">Recompensa</span>
                  </div>
                  <div className="flex bg-cyan-50/30 h-9">
                    {days.map((day) => {
                      const incPending = dailyTotals[day.dateStr]?.incomePending || 0;
                      return (
                        <div key={day.dateStr} className={`w-[78px] min-w-[78px] max-w-[78px] h-9 p-1 border-r border-cyan-200 flex items-center justify-center font-mono text-xs font-bold text-cyan-900 shrink-0 ${day.isToday ? 'bg-cyan-100/60' : ''}`}>
                          {incPending > 0 ? `S/. ${incPending.toFixed(2)}` : '—'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fila 5: Balance neto */}
                <div>
                  <div className="sticky left-0 w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] bg-slate-200/95 px-2.5 py-1 text-[11px] font-black text-slate-900 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-slate-700" /> Balance neto</span>
                    <span className="text-[10px] text-slate-600 font-bold">Ganado - Gastado</span>
                  </div>
                  <div className="flex bg-slate-100/70 h-10">
                    {days.map((day) => {
                      const net = dailyTotals[day.dateStr]?.netBalance || 0;
                      return (
                        <div key={day.dateStr} className={`w-[78px] min-w-[78px] max-w-[78px] h-10 p-1 border-r border-slate-300 flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                          net > 0 ? 'text-emerald-700 bg-emerald-50/60' : net < 0 ? 'text-rose-700 bg-rose-50/60' : 'text-slate-600'
                        } ${day.isToday ? 'ring-1 ring-amber-400' : ''}`}>
                          {net > 0 ? `+ S/. ${net.toFixed(2)}` : net < 0 ? `- S/. ${Math.abs(net).toFixed(2)}` : 'S/. 0.00'}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on mobile, visible on sm and up) */}
      <div 
        ref={desktopScrollRef}
        onMouseDown={handleDesktopMouseDown}
        onMouseMove={handleDesktopMouseMove}
        onMouseUp={handleDesktopMouseUp}
        onMouseLeave={handleDesktopMouseUp}
        className="hidden sm:block overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden matrix-scroll w-full relative select-none cursor-grab active:cursor-grabbing"
      >
        <table className="border-collapse text-left w-max min-w-full">
          <thead>
            <tr className="bg-slate-100/95 border-b border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 sticky top-0 z-20 h-14">
              
              {/* Sticky Left Column Header (Recursos) */}
              <th
                className={`sticky left-0 z-25 bg-slate-100 p-2 sm:p-2.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] select-none transition-all ${
                  isCompactWidth ? 'w-[88px] min-w-[88px] max-w-[88px]' : 'w-[280px] min-w-[280px] max-w-[280px]'
                }`}
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
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      Recursos
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400 font-normal">
                        ({filteredResources.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCompactWidth(true)}
                        className="flex items-center gap-1 shrink-0 text-slate-500 hover:text-amber-800 text-[11px] p-1 rounded hover:bg-amber-50 cursor-pointer"
                        title="Comprimir a solo códigos"
                      >
                        <span className="hidden sm:inline text-[10px]">Cód</span>
                        <Minimize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </th>

              {/* Day Columns Headers with strictly fixed width w-[110px] */}
              {days.map((day) => {
                return (
                  <th
                    key={day.dateStr}
                    className={`w-[110px] min-w-[110px] max-w-[110px] py-2 px-1 text-center transition-colors ${
                      day.isToday 
                        ? 'bg-amber-200/95 font-black text-amber-950 border-x-2 border-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]' 
                        : 'border-r border-slate-200'
                    } ${day.isWeekend && !day.isToday ? 'bg-slate-100/70' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] sm:text-xs uppercase tracking-wider ${
                        day.isToday ? 'text-amber-950 font-black' : 'text-slate-500 font-semibold'
                      }`}>
                        {day.dayName}
                      </span>
                      <span className={`text-xs sm:text-sm my-0.5 leading-none ${
                        day.isToday 
                          ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold shadow-xs' 
                          : 'font-bold text-slate-700'
                      }`}>
                        {day.dayNumber}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-medium leading-none ${
                        day.isToday ? 'text-amber-900 font-bold' : 'text-slate-400'
                      }`}>
                        {day.monthName.slice(0, 3)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={days.length + 1} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                  <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No hay registros creados todavía.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={onAddResource}
                      className="px-3 py-1.5 bg-amber-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-500 cursor-pointer"
                    >
                      + Crear primer registro
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              /* NO GROUP HEADERS: Render resources directly with group info underneath, identical to Daily Missions */
              filteredResources.map((res, rIdx) => {
                const resCode = getResourceCode(res, rIdx);
                const assignedGroup = groups.find(g => g.id === res.groupId);
                const groupColor = assignedGroup?.color || '#06b6d4';
                const groupCode = assignedGroup?.code || 'REC';
                const groupName = assignedGroup?.name || 'General';

                const hasDuration = !!res.hasDurationStatus;
                const timeline = resourceTimelines[res.id] || {};
                const mStats = resourceMonthlyStats[res.id] || { renewalsCount: 0, monthSpent: 0 };

                return (
                  <tr key={res.id} className="hover:bg-amber-50/20 transition-colors group h-[68px] min-h-[68px] max-h-[68px]">
                    
                    {/* Sticky Left Resource Card (with Name on top, Group details underneath + Monthly metrics) */}
                    <td
                      className="sticky left-0 z-10 bg-white group-hover:bg-amber-50/30 p-2 sm:p-2.5 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] w-[280px] min-w-[280px] max-w-[280px] h-[68px] min-h-[68px] max-h-[68px] align-middle"
                    >
                      <div className="flex flex-col justify-center h-full gap-1 min-w-0">
                        {/* Top Line: Code pill, Nature Badge, Name, and Actions */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[10px] font-black text-slate-700 px-1 py-0.5 rounded bg-slate-100 border border-slate-200 shrink-0">
                              {resCode}
                            </span>
                            {res.resourceNature === 'income' && (
                              <span 
                                className="font-mono text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5" 
                                title="Activo / Servicio (Genera ganancia)"
                              >
                                <TrendingUp className="w-2.5 h-2.5" />
                                <span>ACTIVO</span>
                              </span>
                            )}
                            <span 
                              className="font-bold text-slate-900 text-xs sm:text-sm truncate cursor-pointer hover:text-amber-800"
                              onClick={() => onEditResource(res)}
                              title={res.name}
                            >
                              {res.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {onMoveResource && (
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  disabled={rIdx === 0}
                                  onClick={() => onMoveResource(res.id, 'up')}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Subir de posición"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={rIdx === filteredResources.length - 1}
                                  onClick={() => onMoveResource(res.id, 'down')}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Bajar de posición"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditResource(res)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-700 p-1 rounded hover:bg-slate-100 transition-opacity cursor-pointer"
                              title="Configurar registro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteResource(res.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-opacity cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Line: Group Info (Color Dot, Group Code, Group Name) + Monthly Metrics */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          {/* Group identity line identical to daily missions */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
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

                          {/* Monthly & Total metrics (Renovaciones / conseguido & Gasto / Ganado) */}
                          <div className="flex items-center gap-1 shrink-0 flex-wrap">
                            {res.resourceNature === 'income' ? (
                              <>
                                <span 
                                  className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                  title={`Ganancias cobradas en ${currentMonthInfo.name}: S/. ${mStats.monthEarned.toFixed(2)} (${mStats.earnedCount} cobros)`}
                                >
                                  {mStats.monthEarned > 0 ? `+ S/. ${mStats.monthEarned.toFixed(2)} mes` : `${mStats.earnedCount} cobros`}
                                </span>
                                {mStats.monthPendingEarned > 0 && (
                                  <span 
                                    className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1 py-0.5 rounded border border-cyan-200"
                                    title={`Recompensas pendientes: S/. ${mStats.monthPendingEarned.toFixed(2)}`}
                                  >
                                    S/. {mStats.monthPendingEarned.toFixed(2)} por cobrar
                                  </span>
                                )}
                              </>
                            ) : hasDuration ? (
                              <>
                                <span 
                                  className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200"
                                  title={`Conseguido ${mStats.renewalsCount} veces en ${currentMonthInfo.name} (${mStats.allTimeRenewals}x en total)`}
                                >
                                  {mStats.renewalsCount}x conseguido
                                </span>

                                {res.hasCost && (
                                  <span 
                                    className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                    title={`Total gastado en ${currentMonthInfo.name}: S/. ${mStats.monthSpent.toFixed(2)} (Histórico: S/. ${mStats.allTimeSpent.toFixed(2)})`}
                                  >
                                    {mStats.monthSpent > 0 ? `S/. ${mStats.monthSpent.toFixed(2)} mes` : `Total S/. ${mStats.allTimeSpent.toFixed(2)}`}
                                  </span>
                                )}

                                {!res.hasCost && (
                                  <span className="text-[9px] text-slate-400 italic">
                                    Sin costo
                                  </span>
                                )}
                              </>
                            ) : (
                              res.hasCost && (
                                <span 
                                  className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                  title={`Total gastado en ${currentMonthInfo.name}: S/. ${mStats.monthSpent.toFixed(2)} (${mStats.boughtCount} compras)`}
                                >
                                  {mStats.monthSpent > 0 ? `S/. ${mStats.monthSpent.toFixed(2)} mes` : `${mStats.boughtCount} compras`}
                                </span>
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    </td>

                    {/* Day Columns for this Resource: STRICT FIXED WIDTH w-[110px] and STRICT FIXED HEIGHT h-[68px] */}
                    {days.map((day) => {
                      const { isBought, costNum, hasCostEntered } = getResourceDayData(res.id, day.dateStr);
                      const isEditingThisCell = editingCostCell?.id === res.id && editingCostCell?.date === day.dateStr;

                      // State for duration resources
                      const dayTimeline = timeline[day.dateStr] || { state: 'ninguno', isMilestone: false };
                      const dayState = dayTimeline.state;

                      return (
                        <td
                          key={day.dateStr}
                          className={`p-1.5 border-r border-slate-200 transition-colors align-middle text-center w-[110px] min-w-[110px] max-w-[110px] h-[68px] min-h-[68px] max-h-[68px] ${
                            day.isToday ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          {/* CASE 1: RESOURCE WITH DURATION STATUS */}
                          {hasDuration ? (
                            <div 
                              onClick={() => handleOpenDurationPopover(res, day, dayState, costNum)}
                              onDoubleClick={(e) => handleQuickCycleState(res, day, dayState, e)}
                              className={`w-[98px] h-[52px] min-h-[52px] max-h-[52px] mx-auto py-1 px-1 rounded-xl transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs select-none group/dcell ${
                                dayState === 'conseguido' || dayState === 'renovado'
                                  ? 'bg-cyan-500 text-white border-cyan-600 font-black shadow-xs hover:bg-cyan-600'
                                  : dayState === 'disponible'
                                    ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs hover:bg-emerald-600'
                                    : dayState === 'por_terminar' || dayState === 'por_agotar'
                                      ? 'bg-rose-500 text-white border-rose-600 font-bold shadow-xs hover:bg-rose-600'
                                      : 'bg-white text-slate-400 border-slate-200 font-normal hover:bg-slate-50 hover:border-slate-300'
                              }`}
                              title={`Estado: ${
                                dayState === 'conseguido' || dayState === 'renovado'
                                  ? 'Conseguido (Se compró de nuevo)'
                                  : dayState === 'disponible'
                                    ? 'Disponible (Verde - Se compró y aún se tiene)'
                                    : dayState === 'por_terminar' || dayState === 'por_agotar'
                                      ? 'Por terminar (Rojo - Se tiene pero está por terminar)'
                                      : 'Ninguno (No se tenía / Agotado)'
                              }. Clic para cambiar estado (Doble clic para avanzar).`}
                            >
                              {/* Top: Status Pill */}
                              <div className="flex items-center gap-1 leading-none text-center">
                                {dayState === 'conseguido' || dayState === 'renovado' ? (
                                  <>
                                    <Sparkles className="w-3 h-3 text-cyan-100 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-tight">Conseguido</span>
                                  </>
                                ) : dayState === 'disponible' ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-100 stroke-[3] shrink-0" />
                                    <span className="text-[10px] font-extrabold uppercase tracking-tight">Disponible</span>
                                  </>
                                ) : dayState === 'por_terminar' || dayState === 'por_agotar' ? (
                                  <span className="text-[10px] font-extrabold uppercase tracking-tight">Por terminar</span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-400">Ninguno</span>
                                )}
                              </div>

                              {/* Bottom: Price if conseguido & has cost, or status sub-text */}
                              <div className="leading-none text-center">
                                {dayState === 'conseguido' || dayState === 'renovado' ? (
                                  res.hasCost ? (
                                    costNum > 0 ? (
                                      <span className="text-[11px] font-mono font-black text-cyan-50">
                                        S/. {costNum.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-cyan-100 underline font-semibold">
                                        + precio
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[9px] text-cyan-100 font-semibold">
                                      ✓ nuevo
                                    </span>
                                  )
                                ) : dayState === 'disponible' ? (
                                  <span className="text-[9px] text-emerald-100 font-medium">
                                    en uso
                                  </span>
                                ) : dayState === 'por_terminar' || dayState === 'por_agotar' ? (
                                  <span className="text-[9px] text-rose-100 font-medium">
                                    por agotar
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-300">
                                    —
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : res.hasCost ? (
                            /* CASE 2: REGULAR RECURRING RESOURCE OR INCOME / ACTIVO */
                            <div className={`w-[98px] h-[52px] min-h-[52px] max-h-[52px] mx-auto py-1 px-1 rounded-xl transition-all border flex flex-col items-center justify-center gap-1 ${
                              hasCostEntered && isBought
                                ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 shadow-2xs'
                                : hasCostEntered
                                  ? (res.resourceNature === 'income' ? 'bg-amber-50/90 border-amber-300 shadow-2xs' : 'bg-white border-amber-300 shadow-2xs')
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}>
                              
                              {/* Price Row: Fits S/. and number in ONE line */}
                              {isEditingThisCell ? (
                                <div className="flex items-center justify-center gap-0.5 w-full">
                                  <span className="text-[11px] font-bold text-slate-500 shrink-0">S/.</span>
                                  <input
                                    type="number"
                                    step="0.10"
                                    min="0"
                                    autoFocus
                                    placeholder="0.00"
                                    value={tempCostValue}
                                    onChange={(e) => setTempCostValue(e.target.value)}
                                    onBlur={() => handleSaveCost(res.id, day.dateStr)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveCost(res.id, day.dateStr);
                                      if (e.key === 'Escape') setEditingCostCell(null);
                                    }}
                                    className="w-14 text-center text-xs font-mono font-bold bg-white border border-amber-400 rounded px-1 py-0.5 focus:outline-hidden"
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCost(res.id, day.dateStr, costNum)}
                                  className={`text-xs font-mono font-bold px-1 py-0.2 rounded cursor-pointer transition-colors w-full truncate text-center ${
                                    hasCostEntered && isBought 
                                      ? 'text-emerald-950 font-black hover:bg-emerald-200/60' 
                                      : hasCostEntered
                                        ? (res.resourceNature === 'income' ? 'text-amber-950 font-bold hover:bg-amber-100' : 'text-slate-900 font-bold hover:bg-slate-100')
                                        : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'
                                  }`}
                                  title={hasCostEntered ? 'Haz clic para modificar el valor de este día' : 'Haz clic para ingresar valor a este día'}
                                >
                                  {hasCostEntered ? (
                                    <span>
                                      {res.resourceNature === 'income' && isBought ? '+ ' : ''}S/. {costNum.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-300 font-normal">0.00</span>
                                  )}
                                </button>
                              )}

                              {/* Comprado / Falta (Gasto) vs Ganado / Recompensa (Activo / Servicio) */}
                              {hasCostEntered ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleResourceBought(res.id, day.dateStr)}
                                  className={`w-full py-0.5 px-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                                    isBought
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                      : res.resourceNature === 'income'
                                      ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                                      : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900 border border-slate-200'
                                  }`}
                                  title={
                                    res.resourceNature === 'income'
                                      ? (isBought ? 'Ganancia cobrada hoy. Clic para cambiar a Recompensa por cobrar.' : 'Recompensa pendiente de cobrar. Clic para marcar como Ganado / Cobrado.')
                                      : (isBought ? 'Comprado hoy. Clic para cambiar a falta.' : 'Marcar como comprado este día.')
                                  }
                                >
                                  {isBought ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>{res.resourceNature === 'income' ? 'Ganado' : 'Comprado'}</span>
                                    </>
                                  ) : (
                                    <span>{res.resourceNature === 'income' ? 'Recompensa' : 'Falta'}</span>
                                  )}
                                </button>
                              ) : (
                                <div 
                                  onClick={() => handleStartEditCost(res.id, day.dateStr, res.cost > 0 ? res.cost : 0)}
                                  className="w-full py-0.5 text-[9px] text-slate-300 hover:text-slate-500 cursor-pointer text-center select-none"
                                >
                                  {res.resourceNature === 'income' ? '+ ganancia' : '+ precio'}
                                </div>
                              )}

                            </div>
                          ) : (
                            /* CASE 3: NO COST & NO DURATION */
                            <div className="w-[98px] h-[52px] min-h-[52px] max-h-[52px] mx-auto flex items-center justify-center text-slate-300 select-none text-xs">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}

                  </tr>
                );
              })
            )}

            {/* SUMMARY ROW 1: GASTOS REALIZADOS (PAGADO / COMPRADO) */}
            <tr className="bg-slate-50 font-bold text-xs text-slate-900 border-t-2 border-slate-300 h-11 min-h-11 max-h-11">
              <td
                className="sticky left-0 z-10 bg-slate-50 p-2 sm:p-2.5 border-r border-slate-300 shadow-[1px_0_0_0_#cbd5e1] w-[280px] min-w-[280px] max-w-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-slate-600" />
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Gastos pagados
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                    Comprado
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const paid = dailyTotals[day.dateStr]?.expensePaid || 0;
                return (
                  <td
                    key={day.dateStr}
                    className={`p-2 text-center border-r border-slate-200/80 font-mono text-xs sm:text-sm font-bold text-slate-900 w-[110px] min-w-[110px] max-w-[110px] ${
                      day.isToday ? 'bg-amber-100/50 text-amber-950 font-black' : ''
                    }`}
                  >
                    S/. {paid.toFixed(2)}
                  </td>
                );
              })}
            </tr>

            {/* SUMMARY ROW 2: GASTOS POR PAGAR (FALTA) */}
            <tr className="bg-amber-50/40 font-bold text-xs text-amber-950 border-t border-amber-200/60 h-11 min-h-11 max-h-11">
              <td
                className="sticky left-0 z-10 bg-amber-50/60 p-2 sm:p-2.5 border-r border-amber-300 shadow-[1px_0_0_0_#fde68a] w-[280px] min-w-[280px] max-w-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                      Falta pagar
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    Por comprar
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const pending = dailyTotals[day.dateStr]?.expensePending || 0;
                return (
                  <td
                    key={day.dateStr}
                    className={`p-2 text-center border-r border-slate-200/80 font-mono text-xs sm:text-sm font-bold text-amber-900 w-[110px] min-w-[110px] max-w-[110px] ${
                      day.isToday ? 'bg-amber-100/70 font-black' : ''
                    }`}
                  >
                    {pending > 0 ? `S/. ${pending.toFixed(2)}` : '—'}
                  </td>
                );
              })}
            </tr>

            {/* SUMMARY ROW 3: GANANCIAS COBRADAS (GANADO) */}
            <tr className="bg-emerald-50/90 font-bold text-xs text-emerald-950 border-t border-emerald-200 h-11 min-h-11 max-h-11">
              <td
                className="sticky left-0 z-10 bg-emerald-50 p-2 sm:p-2.5 border-r border-emerald-300 shadow-[1px_0_0_0_#a7f3d0] w-[280px] min-w-[280px] max-w-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                    <span className="font-extrabold text-emerald-950 text-xs sm:text-sm">
                      Ganancias cobradas
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Ganado
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const earned = dailyTotals[day.dateStr]?.incomeEarned || 0;
                return (
                  <td
                    key={day.dateStr}
                    className={`p-2 text-center border-r border-emerald-200 font-mono text-xs sm:text-sm font-black text-emerald-800 w-[110px] min-w-[110px] max-w-[110px] ${
                      day.isToday ? 'bg-emerald-200/70 text-emerald-950 font-black' : ''
                    }`}
                  >
                    {earned > 0 ? `+ S/. ${earned.toFixed(2)}` : '—'}
                  </td>
                );
              })}
            </tr>

            {/* SUMMARY ROW 4: SERVICIOS POR COBRAR (RECOMPENSA) */}
            <tr className="bg-cyan-50/50 font-bold text-xs text-cyan-950 border-t border-cyan-200/70 h-11 min-h-11 max-h-11">
              <td
                className="sticky left-0 z-10 bg-cyan-50/70 p-2 sm:p-2.5 border-r border-cyan-300 shadow-[1px_0_0_0_#a5f3fc] w-[280px] min-w-[280px] max-w-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-cyan-700" />
                    <span className="font-extrabold text-cyan-950 text-xs sm:text-sm">
                      Servicios por cobrar
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded">
                    Recompensa
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const incPending = dailyTotals[day.dateStr]?.incomePending || 0;
                return (
                  <td
                    key={day.dateStr}
                    className={`p-2 text-center border-r border-cyan-200/70 font-mono text-xs sm:text-sm font-bold text-cyan-900 w-[110px] min-w-[110px] max-w-[110px] ${
                      day.isToday ? 'bg-cyan-100/70 font-black' : ''
                    }`}
                  >
                    {incPending > 0 ? `S/. ${incPending.toFixed(2)}` : '—'}
                  </td>
                );
              })}
            </tr>

            {/* SUMMARY ROW 5: BALANCE NETO DEL DÍA (Ganado - Pagado) */}
            <tr className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300 h-12 min-h-12 max-h-12">
              <td
                className="sticky left-0 z-10 bg-slate-100 p-2 sm:p-2.5 border-r border-slate-300 shadow-[1px_0_0_0_#94a3b8] w-[280px] min-w-[280px] max-w-[280px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-700" />
                    <span className="font-black text-slate-950 text-xs sm:text-sm">
                      Balance neto
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">
                    Ganado - Gastado
                  </span>
                </div>
              </td>

              {days.map((day) => {
                const net = dailyTotals[day.dateStr]?.netBalance || 0;
                return (
                  <td
                    key={day.dateStr}
                    className={`p-2 text-center border-r border-slate-300 font-mono text-xs sm:text-sm font-black w-[110px] min-w-[110px] max-w-[110px] ${
                      net > 0 
                        ? 'text-emerald-700 bg-emerald-50/50' 
                        : net < 0 
                        ? 'text-rose-700 bg-rose-50/50' 
                        : 'text-slate-500'
                    } ${day.isToday ? 'ring-2 ring-amber-400 inset-0' : ''}`}
                  >
                    {net > 0 ? `+ S/. ${net.toFixed(2)}` : net < 0 ? `- S/. ${Math.abs(net).toFixed(2)}` : 'S/. 0.00'}
                  </td>
                );
              })}
            </tr>

          </tbody>
        </table>
      </div>

      {/* DURATION STATE MODAL / POPOVER */}
      {activeDurationPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/30">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-4 space-y-3.5 animate-in fade-in zoom-in-95">
            
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {resources.find(r => r.id === activeDurationPopover.resId)?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {activeDurationPopover.dayName} {activeDurationPopover.dayNumber} ({activeDurationPopover.dateStr})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDurationPopover(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2.5 text-xs">
              
              {/* Option 1: Ninguno (Caja se mantiene igual / no se tenía) */}
              <button
                type="button"
                onClick={() => handleApplyStateFromPopover('ninguno')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                  activeDurationPopover.currentState === 'ninguno'
                    ? 'border-slate-400 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-slate-200 inline-block" />
                    <span>Ninguno</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    No se tenía o se agotó · La caja se mantiene neutral sin color
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Marcar
                </span>
              </button>

              {/* Option 2: Disponible (Se pone verde) */}
              <button
                type="button"
                onClick={() => handleApplyStateFromPopover('disponible')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                  activeDurationPopover.currentState === 'disponible'
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Disponible</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Se pone verde · Se compró y aún se tiene disponible
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded border border-emerald-400">
                  Verde
                </span>
              </button>

              {/* Option 3: Por terminar (Se pone rojo) */}
              <button
                type="button"
                onClick={() => handleApplyStateFromPopover('por_terminar')}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                  activeDurationPopover.currentState === 'por_terminar' || activeDurationPopover.currentState === 'por_agotar'
                    ? 'border-rose-500 bg-rose-100 text-rose-950 ring-2 ring-rose-500/20'
                    : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-950'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span>Por terminar</span>
                  </div>
                  <p className="text-[10px] text-rose-700 mt-0.5">
                    Se pone rojo · Se tiene pero está por terminar / agotarse
                  </p>
                </div>
                <span className="text-[10px] font-bold text-rose-900 bg-rose-200 px-2 py-0.5 rounded border border-rose-400">
                  Rojo
                </span>
              </button>

              {/* Option 4: Conseguido (Comprado ese día / Se ha conseguido de nuevo) */}
              <div className={`p-2.5 rounded-xl border space-y-2 ${
                activeDurationPopover.currentState === 'conseguido' || activeDurationPopover.currentState === 'renovado'
                  ? 'border-cyan-500 bg-cyan-100/90 text-cyan-950 ring-2 ring-cyan-500/20'
                  : 'border-cyan-300 bg-cyan-50/70 text-cyan-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-cyan-950">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      <span>Conseguido</span>
                    </div>
                    <p className="text-[10px] text-cyan-800 mt-0.5 leading-tight">
                      Ese día se compró / Conseguido de nuevo · Días siguientes serán Disponible
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyStateFromPopover('conseguido')}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs active:scale-95 shrink-0"
                  >
                    Marcar
                  </button>
                </div>

                {/* If resource has cost, enter renewal purchase price */}
                {resources.find(r => r.id === activeDurationPopover.resId)?.hasCost && (
                  <div className="flex items-center gap-2 pt-2 border-t border-cyan-200">
                    <span className="font-bold text-cyan-950 text-xs shrink-0">Precio de compra: S/.</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      placeholder="0.00"
                      value={renewalInputCost}
                      onChange={(e) => setRenewalInputCost(e.target.value)}
                      className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-cyan-400 rounded-lg text-center focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyStateFromPopover('conseguido')}
                      className="px-2 py-1 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded text-[11px] cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>

            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDurationPopover(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
