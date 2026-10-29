export type ScheduleType = 'daily' | 'finite' | 'specific_days' | 'pattern_blocks' | 'day_clusters';

export type GroupViewState = 'expanded_all' | 'collapsed_subactivities' | 'collapsed_group';

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

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  groups: ActivityGroup[];
  activities: Activity[];
  // Map key: `${activityId}_${subActivityId || 'main'}_${dateString}` => boolean
  completionLogs: Record<string, boolean>;
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
