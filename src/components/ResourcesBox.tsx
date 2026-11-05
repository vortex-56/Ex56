import React, { useState, useMemo } from 'react';
import { Resource, ActivityGroup, ResourcePossession, ResourceAvailability, ResourcePurchaseCycle } from '../types';
import { getTodayDateString, formatFriendlyDate } from '../utils/dateUtils';
import { 
  Package, 
  Plus, 
  Coins, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Edit2, 
  Trash2, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp,
  Check
} from 'lucide-react';

interface ResourcesBoxProps {
  resources: Resource[];
  groups: ActivityGroup[];
  onAddResource: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
  onUpdateResource: (resource: Resource) => void;
  onMoveResource?: (resourceId: string, direction: 'up' | 'down') => void;
  onOpenGroups: () => void;
}

export const ResourcesBox: React.FC<ResourcesBoxProps> = ({
  resources,
  groups,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onUpdateResource,
  onMoveResource,
  onOpenGroups,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedCyclesResId, setExpandedCyclesResId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Financial calculations separating Expenses vs Income/Activos
  const financialMetrics = useMemo(() => {
    let expSpent = 0;
    let expPending = 0;
    let incEarned = 0;
    let incPending = 0;

    for (const res of resources) {
      const isIncome = res.resourceNature === 'income';
      const costVal = res.hasCost ? Number(res.cost) || 0 : 0;

      if (isIncome) {
        if (res.possessionStatus === 'se_requiere' || res.availabilityStatus === 'agotado') {
          incPending += costVal;
        } else {
          incEarned += costVal;
        }
        if (res.cycles) {
          for (const cyc of res.cycles) {
            incEarned += Number(cyc.cost) || 0;
          }
        }
      } else {
        if (res.possessionStatus === 'se_requiere' || res.availabilityStatus === 'agotado') {
          expPending += costVal;
        }
        if (res.cycles && res.cycles.length > 0) {
          for (const cyc of res.cycles) {
            expSpent += Number(cyc.cost) || 0;
          }
        } else if (res.hasCost && res.possessionStatus !== 'se_requiere') {
          expSpent += costVal;
        }
      }
    }

    const net = incEarned - expSpent;

    return {
      expSpent: Math.round(expSpent * 100) / 100,
      expPending: Math.round(expPending * 100) / 100,
      incEarned: Math.round(incEarned * 100) / 100,
      incPending: Math.round(incPending * 100) / 100,
      netBalance: Math.round(net * 100) / 100,
    };
  }, [resources]);

  // Calculate Dates for Today, This Week (last 7 days), and This Month
  const { todaySpent, weekSpent, monthSpent, totalSpent, pendingCostRequired } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // 7 days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    let todayS = 0;
    let weekS = 0;
    let monthS = 0;
    let totalS = 0;
    let reqCost = 0;

    for (const res of resources) {
      if (res.possessionStatus === 'se_requiere' && res.hasCost) {
        reqCost += res.cost;
      }

      if (!res.hasCost || !res.cycles) continue;

      for (const cyc of res.cycles) {
        const cCost = Number(cyc.cost) || 0;
        totalS += cCost;

        const pDate = cyc.purchaseDate;
        if (pDate === todayStr) {
          todayS += cCost;
        }
        if (pDate >= sevenDaysAgoStr && pDate <= todayStr) {
          weekS += cCost;
        }

        // Check if same month & year
        const pYear = parseInt(pDate.slice(0, 4), 10);
        const pMonth = parseInt(pDate.slice(5, 7), 10) - 1;
        if (pYear === currentYear && pMonth === currentMonth) {
          monthS += cCost;
        }
      }
    }

    return {
      todaySpent: todayS,
      weekSpent: weekS,
      monthSpent: monthS,
      totalSpent: totalS,
      pendingCostRequired: reqCost,
    };
  }, [resources, todayStr]);

  // Filtered resources sorted by order
  const filteredResources = useMemo(() => {
    const list = resources.filter(res => {
      if (selectedGroupId && res.groupId !== selectedGroupId) return false;
      if (searchQuery.trim() && !res.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      if (filterType === 'income') {
        return res.resourceNature === 'income';
      }
      if (filterType === 'expense') {
        return res.resourceNature !== 'income';
      }
      if (filterType === 'se_requiere') {
        return res.possessionStatus === 'se_requiere' && res.resourceNature !== 'income';
      }
      if (filterType === 'por_cobrar') {
        return res.resourceNature === 'income' && (res.possessionStatus === 'se_requiere' || res.availabilityStatus === 'agotado');
      }
      if (filterType === 'disponible') {
        return res.possessionStatus === 'se_tiene' && res.availabilityStatus === 'disponible';
      }
      if (filterType === 'por_agotarse') {
        return res.possessionStatus === 'se_tiene' && (res.availabilityStatus === 'por_agotarse' || res.availabilityStatus === 'por_agotar');
      }
      if (filterType === 'agotado') {
        return res.possessionStatus === 'se_tiene' && res.availabilityStatus === 'agotado';
      }
      if (filterType === 'daily') {
        return res.consumptionType === 'daily_frequent';
      }
      if (filterType === 'durable') {
        return res.consumptionType === 'durable_seasonal';
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return 0;
    });
  }, [resources, selectedGroupId, searchQuery, filterType]);

  // Handlers for Quick Renewal / Rebuying
  const handleQuickAddConsumption = (res: Resource) => {
    const newCycle: ResourcePurchaseCycle = {
      id: 'cyc_' + Math.random().toString(36).substring(2, 9),
      purchaseDate: todayStr,
      cost: res.hasCost ? res.cost : 0,
      notes: `Compra de hoy (${formatFriendlyDate(todayStr)})`,
    };

    const updated: Resource = {
      ...res,
      possessionStatus: 'se_tiene',
      availabilityStatus: 'disponible',
      cycles: [newCycle, ...(res.cycles || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateResource(updated);
  };

  const handleRenewCycle = (res: Resource) => {
    // Closes previous cycle with today's date if not closed
    const cycles = [...(res.cycles || [])];
    if (cycles.length > 0 && !cycles[0].exhaustedDate) {
      cycles[0] = {
        ...cycles[0],
        exhaustedDate: todayStr,
      };
    }

    // Creates new cycle
    const newCycle: ResourcePurchaseCycle = {
      id: 'cyc_' + Math.random().toString(36).substring(2, 9),
      purchaseDate: todayStr,
      cost: res.hasCost ? res.cost : 0,
      notes: 'Ciclo renovado / Recomprado',
    };

    const updated: Resource = {
      ...res,
      possessionStatus: 'se_tiene',
      availabilityStatus: 'disponible',
      cycles: [newCycle, ...cycles],
      updatedAt: new Date().toISOString(),
    };

    onUpdateResource(updated);
  };

  const handleUpdateAvailability = (res: Resource, status: ResourceAvailability) => {
    const updated: Resource = {
      ...res,
      availabilityStatus: status,
      updatedAt: new Date().toISOString(),
    };
    onUpdateResource(updated);
  };

  const handleTogglePossession = (res: Resource) => {
    const nextPossession: ResourcePossession = res.possessionStatus === 'se_requiere' ? 'se_tiene' : 'se_requiere';
    const updated: Resource = {
      ...res,
      possessionStatus: nextPossession,
      availabilityStatus: nextPossession === 'se_tiene' ? 'disponible' : 'agotado',
      updatedAt: new Date().toISOString(),
    };
    onUpdateResource(updated);
  };

  const handleDeleteCycle = (res: Resource, cycleId: string) => {
    const updatedCycles = (res.cycles || []).filter(c => c.id !== cycleId);
    const updated: Resource = {
      ...res,
      cycles: updatedCycles,
      updatedAt: new Date().toISOString(),
    };
    onUpdateResource(updated);
  };

  // Helper code
  const getResourceCode = (res: Resource, idx: number) => {
    if (res.code && res.code.trim()) return res.code.trim().toUpperCase();
    return `R${String(idx + 1).padStart(2, '0')}`;
  };

  // Resource groups
  const resourceGroups = groups.filter(g => g.type === 'resource');

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      
      {/* Top Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center shrink-0">
            <Package className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Recursos
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
                {resources.length} registrados
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Control de insumos, lista de faltantes, gastos en soles y ciclos de renovación (desayunos, cenas, rastrillos, etc.).
            </p>
          </div>
        </div>

        {/* Buttons: + Nuevo Recurso & Grupos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGroups}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            title="Administrar grupos de recursos y actividades"
          >
            <span>Grupos</span>
          </button>

          <button
            type="button"
            onClick={onAddResource}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Recurso</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards: Gastos Pagados, Faltantes, Ganancias Cobradas, Por Cobrar y Balance */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Gastos Pagados
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-slate-400 font-semibold">S/.</span>
              <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                {financialMetrics.expSpent.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              Compras realizadas
            </span>
          </div>

          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 shadow-2xs space-y-1">
            <span className="text-[10px] sm:text-xs font-bold text-rose-800 uppercase tracking-wider block">
              Falta Pagar
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-rose-700 font-semibold">S/.</span>
              <span className="text-base sm:text-lg font-black text-rose-950 tabular-nums">
                {financialMetrics.expPending.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium block truncate">
              Gastos por comprar
            </span>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-300 shadow-2xs space-y-1">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-900 uppercase tracking-wider block">
              Ganancias Cobradas
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-emerald-700 font-semibold">S/.</span>
              <span className="text-base sm:text-lg font-black text-emerald-950 tabular-nums">
                +{financialMetrics.incEarned.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block truncate">
              Servicios ganados
            </span>
          </div>

          <div className="p-3 bg-cyan-50/80 rounded-xl border border-cyan-300 shadow-2xs space-y-1">
            <span className="text-[10px] sm:text-xs font-bold text-cyan-900 uppercase tracking-wider block">
              Por Cobrar (Recompensas)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-cyan-700 font-semibold">S/.</span>
              <span className="text-base sm:text-lg font-black text-cyan-950 tabular-nums">
                {financialMetrics.incPending.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-cyan-700 font-medium block truncate">
              Servicios pendientes
            </span>
          </div>

          <div className={`p-3 rounded-xl border shadow-2xs space-y-1 col-span-2 sm:col-span-1 ${
            financialMetrics.netBalance > 0
              ? 'bg-emerald-100/90 text-emerald-950 border-emerald-400'
              : financialMetrics.netBalance < 0
              ? 'bg-rose-100/90 text-rose-950 border-rose-300'
              : 'bg-white text-slate-800 border-slate-200'
          }`}>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider block">
              Balance Neto
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold">S/.</span>
              <span className="text-base sm:text-lg font-black tabular-nums">
                {financialMetrics.netBalance > 0 ? `+${financialMetrics.netBalance.toFixed(2)}` : financialMetrics.netBalance.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] opacity-80 block truncate">
              Ganado - Gastado
            </span>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white">
        
        {/* Search & Group dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar recurso..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden xs:inline" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">Todos los grupos ({resources.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code ? `[${g.code}] ` : ''}{g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 matrix-scroll text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'income', label: '💰 Activos / Ganancias' },
            { id: 'expense', label: '🛒 Gastos' },
            { id: 'se_requiere', label: '★ Falta Pagar' },
            { id: 'por_cobrar', label: '⏳ Por Cobrar' },
            { id: 'disponible', label: 'Disponibles' },
            { id: 'por_agotarse', label: 'Por Terminar' },
            { id: 'agotado', label: 'Agotados' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Items List */}
      <div className="p-3.5 sm:p-4 space-y-2.5">
        {filteredResources.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">
              No se encontraron recursos
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Crea recursos como desayunos, cenas, jabones o rastrillos para cuadrar tus gastos y controlar inventarios.
            </p>
            <button
              type="button"
              onClick={onAddResource}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Crear Primer Recurso</span>
            </button>
          </div>
        ) : (
          filteredResources.map((res, idx) => {
            const resCode = getResourceCode(res, idx);
            const group = groups.find(g => g.id === res.groupId);
            const groupColor = group?.color || '#06b6d4';
            const groupCode = group?.code || (group ? group.name.slice(0, 3).toUpperCase() : 'REC');
            const groupName = group ? group.name : 'General';

            const isDaily = res.consumptionType === 'daily_frequent';
            const isRequired = res.possessionStatus === 'se_requiere';
            const isCyclesExpanded = expandedCyclesResId === res.id;
            const cycleCount = res.cycles?.length || 0;

            // Compute month purchases for this resource
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            const monthCycles = (res.cycles || []).filter(c => {
              const pYear = parseInt(c.purchaseDate.slice(0, 4), 10);
              const pMonth = parseInt(c.purchaseDate.slice(5, 7), 10) - 1;
              return pYear === currentYear && pMonth === currentMonth;
            });
            const monthTotal = monthCycles.reduce((acc, c) => acc + (Number(c.cost) || 0), 0);

            // Calculate duration in days of latest completed cycle or current cycle
            const latestCycle = res.cycles?.[0];
            let currentCycleDays = 0;
            if (latestCycle) {
              const start = new Date(latestCycle.purchaseDate);
              const end = latestCycle.exhaustedDate ? new Date(latestCycle.exhaustedDate) : new Date();
              currentCycleDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            }

            return (
              <div
                key={res.id}
                className={`p-3 rounded-xl border transition-all ${
                  isRequired
                    ? 'bg-amber-50/30 border-amber-300/80 shadow-2xs'
                    : res.availabilityStatus === 'agotado'
                    ? 'bg-rose-50/25 border-rose-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Move buttons, Code, Name, Group, Cost */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {onMoveResource && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onMoveResource(res.id, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
                          title="Subir de posición"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === filteredResources.length - 1}
                          onClick={() => onMoveResource(res.id, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
                          title="Bajar de posición"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: groupColor }}
                      title={`Código: ${resCode}`}
                    >
                      {resCode}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={res.name}>
                          {res.name}
                        </span>

                        {res.resourceNature === 'income' ? (
                          <span className="font-mono text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>ACTIVO / SERVICIO</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            GASTO
                          </span>
                        )}

                        {/* Possession / Availability Badge */}
                        {res.resourceNature === 'income' ? (
                          isRequired || res.availabilityStatus === 'agotado' ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-2xs">
                              ⏳ Recompensa por Cobrar
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Ganado / Cobrado
                            </span>
                          )
                        ) : isRequired ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-slate-950 border border-amber-500/30 shadow-2xs">
                            ★ Se Requiere (Falta comprar)
                          </span>
                        ) : res.availabilityStatus === 'disponible' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Disponible
                          </span>
                        ) : (res.availabilityStatus === 'por_agotarse' || res.availabilityStatus === 'por_agotar') ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            ⚠ Por terminar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                            ✕ Agotado (Ninguno)
                          </span>
                        )}

                        {/* Cost Tag */}
                        {res.hasCost ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border tabular-nums ${
                            res.resourceNature === 'income'
                              ? 'text-emerald-900 bg-emerald-50 border-emerald-300'
                              : 'text-slate-800 bg-slate-100 border-slate-200'
                          }`}>
                            {res.resourceNature === 'income' ? 'Ganancia: +S/. ' : 'S/. '}
                            {res.cost.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sin costo
                          </span>
                        )}
                      </div>

                      {/* Group and Cycle Metadata line below */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: groupColor }} />
                          <span
                            className="font-mono font-bold text-[10px] px-1 py-0.2 rounded"
                            style={{ backgroundColor: `${groupColor}1f`, color: groupColor }}
                          >
                            {groupCode}
                          </span>
                          <span className="font-medium text-slate-600 truncate max-w-[120px]">
                            {groupName}
                          </span>
                        </div>

                        <span aria-hidden="true" className="text-slate-300">·</span>

                        {res.resourceNature === 'income' ? (
                          <span className="text-emerald-800 font-semibold bg-emerald-50 px-1 rounded">
                            Servicio / Activo de ganancia
                          </span>
                        ) : isDaily ? (
                          <span className="text-amber-800 font-semibold bg-amber-50 px-1 rounded">
                            Consumo diario · {monthCycles.length} este mes (S/. {monthTotal.toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-cyan-800 font-semibold bg-cyan-50 px-1 rounded">
                            Temporada · {latestCycle ? `En uso ${currentCycleDays} días` : 'Sin compras'}
                          </span>
                        )}

                        {res.notes && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-slate-400 truncate max-w-xs">{res.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Quick Action (Comprar hoy / Cobrar hoy) + Status Switcher + Edit */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                    
                    {/* If Income: Quick earn button */}
                    {res.resourceNature === 'income' ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAddConsumption(res)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-500 border border-emerald-500/30 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                        title="Registrar ganancia cobrada hoy"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Cobrar hoy ({res.hasCost ? `+S/. ${res.cost.toFixed(2)}` : 'Ganado'})</span>
                      </button>
                    ) : isDaily ? (
                      <button
                        type="button"
                        onClick={() => handleQuickAddConsumption(res)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500/30 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                        title="Registrar consumo o compra de hoy"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Comprar hoy ({res.hasCost ? `S/. ${res.cost.toFixed(2)}` : 'Registrar'})</span>
                      </button>
                    ) : (
                      /* If durable: Renovar ciclo / Comprar nuevo ciclo */
                      <button
                        type="button"
                        onClick={() => handleRenewCycle(res)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 border border-cyan-500/30 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                        title="Marcar como agotado el anterior y abrir un nuevo ciclo de compra renovada"
                      >
                        <RotateCw className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Renovar Ciclo ({res.hasCost ? `S/. ${res.cost.toFixed(2)}` : 'Nuevo'})</span>
                      </button>
                    )}

                    {/* Stock level quick buttons for durable */}
                    {!isDaily && res.resourceNature !== 'income' && res.possessionStatus === 'se_tiene' && (
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateAvailability(res, 'disponible')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            res.availabilityStatus === 'disponible'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Disponible"
                        >
                          Disp.
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAvailability(res, 'por_agotarse')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            res.availabilityStatus === 'por_agotarse' || res.availabilityStatus === 'por_agotar'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Por terminar"
                        >
                          Por terminar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAvailability(res, 'agotado')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            res.availabilityStatus === 'agotado'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Agotado"
                        >
                          Agotado
                        </button>
                      </div>
                    )}

                    {/* Toggle between "Se requiere" and "Se tiene" (or "Recompensa" vs "Ganado") */}
                    <button
                      type="button"
                      onClick={() => handleTogglePossession(res)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      title={
                        res.resourceNature === 'income'
                          ? (isRequired ? 'Marcar que ya fue cobrado / ganado' : 'Marcar como recompensa pendiente de cobro')
                          : (isRequired ? 'Marcar que ya se tiene / adquirido' : 'Mover a lista de faltantes (Se requiere)')
                      }
                    >
                      {res.resourceNature === 'income'
                        ? (isRequired ? 'Cobrado' : 'Por cobrar')
                        : (isRequired ? 'Ya lo compré' : 'Falta')}
                    </button>

                    {/* Expand Cycles history */}
                    {cycleCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCyclesResId(isCyclesExpanded ? null : res.id)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isCyclesExpanded
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Ver historial de ciclos / compras"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="text-[11px]">{cycleCount}</span>
                        {isCyclesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditResource(res)}
                      className="p-1.5 text-slate-400 hover:text-amber-800 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Editar recurso"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    {confirmDeleteId === res.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={() => onDeleteResource(res.id)}
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
                        onClick={() => setConfirmDeleteId(res.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Cycles History Box */}
                {isCyclesExpanded && res.cycles && res.cycles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 bg-slate-50/80 p-3 rounded-lg text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Historial de Compras y Ciclos ({res.cycles.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Gasto total en este ítem: S/. {(res.cycles.reduce((acc, c) => acc + (Number(c.cost) || 0), 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/60 max-h-48 overflow-y-auto pr-1">
                      {res.cycles.map((cyc, cIdx) => {
                        const start = new Date(cyc.purchaseDate);
                        const end = cyc.exhaustedDate ? new Date(cyc.exhaustedDate) : new Date();
                        const daysDuration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

                        return (
                          <div key={cyc.id} className="py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-500 text-[11px]">
                                #{(res.cycles?.length || 0) - cIdx}
                              </span>
                              <span className="font-medium text-slate-800">
                                {formatFriendlyDate(cyc.purchaseDate)}
                              </span>
                              {cyc.exhaustedDate ? (
                                <span className="text-[11px] text-slate-500">
                                  hasta {formatFriendlyDate(cyc.exhaustedDate)} ({daysDuration} días de duración)
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Ciclo activo ({daysDuration} días en curso)
                                </span>
                              )}
                              {cyc.notes && (
                                <span className="text-[10px] text-slate-400 italic">
                                  ({cyc.notes})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">
                                S/. {(Number(cyc.cost) || 0).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCycle(res, cyc.id)}
                                className="text-slate-300 hover:text-red-500 p-0.5 cursor-pointer"
                                title="Eliminar este registro"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
