export type ScheduleType = 'daily' | 'finite' | 'specific_days' | 'pattern_blocks';

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
  // For specific_days: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  activeDays: number[];
  // For pattern_blocks (e.g., 3 days on, user configured)
  blockSize?: number;
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
