export type ScheduleType = 'daily' | 'finite' | 'specific_days' | 'pattern_blocks' | 'day_clusters';

export type GroupViewState = 'expanded_all' | 'collapsed_subactivities' | 'collapsed_group';

export type GroupType = 'activity' | 'resource';

export interface SubActivity {
  id: string;
  code?: string;
  name: string;
  order: number;
}

export interface ActivityGroup {
  id: string;
  code?: string;
  name: string;
  color: string;
  collapsed?: boolean;
  showBox?: boolean; // whether to show a box for this group in each day column
  type?: GroupType; // 'activity' (default) or 'resource'
}

export interface Activity {
  id: string;
  code?: string;
  groupId: string | null;
  name: string;
  color: string;
  startDate: string; // YYYY-MM-DD
  hasEndDate: boolean;
  endDate: string | null; // YYYY-MM-DD
  isCompleted: boolean;
  completedDate?: string | null; // YYYY-MM-DD when completed
  scheduleType: ScheduleType;
  // For specific_days & day_clusters: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  activeDays: number[];
  // For pattern_blocks & day_clusters (e.g. 2, 3, 4, 5, 6 days per cluster)
  blockSize?: number;
  clusterSize?: number;
  dayValue?: number;
  // Explicitly selected cluster day blocks, e.g. [[1, 2], [3, 4]] for Lun-Mar and Mié-Jue
  clusterBlocks?: number[][];
  subActivities: SubActivity[];
  notes?: string;
}

export type ResourcePossession = 'falta' | 'disponible' | 'se_requiere' | 'se_tiene';
export type ResourceAvailability = 'disponible' | 'por_agotar' | 'agotado' | 'por_agotarse';
export type ResourceConsumptionType = 'daily_frequent' | 'durable_seasonal';

export interface ResourcePurchaseCycle {
  id: string;
  purchaseDate: string; // YYYY-MM-DD
  exhaustedDate?: string | null; // YYYY-MM-DD
  cost: number; // in Soles S/.
  notes?: string;
}

export type ResourceNature = 'expense' | 'income'; // 'expense' (gasto que cuesta) | 'income' (activo/servicio que genera ganancia)

export interface Resource {
  id: string;
  code?: string;
  groupId: string | null;
  name: string;
  resourceNature?: ResourceNature; // 'expense' | 'income'
  order?: number; // custom display order position
  hasCost: boolean; // whether it has price/cost or earnings value
  cost: number; // reference cost or earnings value in Soles S/.
  hasDurationStatus?: boolean; // whether it has duration status (disponible, por agotar, agotado)
  possessionStatus?: ResourcePossession; // 'disponible' | 'falta'
  availabilityStatus?: ResourceAvailability; // 'disponible' | 'por_agotar' | 'agotado'
  lastRenewedDate?: string | null; // YYYY-MM-DD
  consumptionType?: ResourceConsumptionType;
  cycles?: ResourcePurchaseCycle[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DayResourceState = 'ninguno' | 'disponible' | 'por_terminar' | 'conseguido' | 'renovado' | 'por_agotar' | 'agotado';

export interface DailyResourceLog {
  cost?: number; // specific cost in Soles S/. entered for that day (> 0, or 0/undefined if blank)
  bought: boolean; // whether marked as bought on that date
  renewed?: boolean; // whether renewed/conseguido on that date
  state?: DayResourceState; // explicit state set on this date: ninguno, disponible, por_terminar, conseguido
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  groups: ActivityGroup[];
  activities: Activity[];
  resources?: Resource[];
  // Map key: `${activityId}_${subActivityId || 'main'}_${dateString}` => boolean
  completionLogs: Record<string, boolean>;
  // Map key: `${resourceId}_${dateString}` => DailyResourceLog
  resourceLogs?: Record<string, DailyResourceLog>;
  // Custom chosen activity IDs for the "Misiones Diarias" daily guide
  dailyMissionsCustomIds?: string[];
}

export interface DayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Dom, 1=Lun ...
  dayName: string; // "Lun", "Mar"
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isWeekend: boolean;
}

