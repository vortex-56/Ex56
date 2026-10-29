import { DayInfo, Activity } from '../types';

const SPANISH_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SPANISH_DAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseYYYYMMDD(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(new Date());
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateToYYYYMMDD(d);
}

export function getDaysRange(startDate: Date, totalDays: number): DayInfo[] {
  const todayStr = getTodayDateString();
  const result: DayInfo[] = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(current);
    const dayOfWeek = current.getDay();

    result.push({
      date: current,
      dateStr,
      dayOfWeek,
      dayName: SPANISH_DAYS_SHORT[dayOfWeek],
      dayNumber: current.getDate(),
      monthName: SPANISH_MONTHS[current.getMonth()],
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return result;
}

export function getDaysBetweenDates(startDate: Date, endDate: Date): DayInfo[] {
  const todayStr = getTodayDateString();
  const result: DayInfo[] = [];

  // Ensure start <= end
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  const e = new Date(endDate);
  e.setHours(0, 0, 0, 0);

  if (s > e) {
    // If start > end, swap or return single day
    return getDaysRange(s, 1);
  }

  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1, 90); // Cap at 90 days for performance

  for (let i = 0; i < diffDays; i++) {
    const current = new Date(s);
    current.setDate(s.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(current);
    const dayOfWeek = current.getDay();

    result.push({
      date: current,
      dateStr,
      dayOfWeek,
      dayName: SPANISH_DAYS_SHORT[dayOfWeek],
      dayNumber: current.getDate(),
      monthName: SPANISH_MONTHS[current.getMonth()],
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return result;
}

/**
 * Checks whether an activity should have an active box on a specific date.
 */
export function isActivityActiveOnDate(activity: Activity, dateStr: string): boolean {
  // If activity is marked finished/completed prior to this, it may still show past boxes,
  // but if the date is after its completion or if activity completed is an archive state:
  if (activity.isCompleted && activity.endDate && dateStr > activity.endDate) {
    return false;
  }

  // Must be >= startDate
  if (dateStr < activity.startDate) {
    return false;
  }

  // If has end date, must be <= endDate
  if (activity.hasEndDate && activity.endDate && dateStr > activity.endDate) {
    return false;
  }

  const dateObj = parseYYYYMMDD(dateStr);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Check schedule type
  switch (activity.scheduleType) {
    case 'daily':
      // Active every day from startDate onwards
      return true;

    case 'finite':
      // Finite event: active between startDate and endDate
      if (activity.hasEndDate && activity.endDate) {
        return dateStr >= activity.startDate && dateStr <= activity.endDate;
      }
      return dateStr === activity.startDate;

    case 'specific_days':
      // Active only on selected days of the week (e.g. Mon-Sat, skip Sun)
      return activity.activeDays.includes(dayOfWeek);

    case 'pattern_blocks': {
      // E.g. user described video making: 3 days in a row (e.g. Lun, Mar, Mié or groups of 3 days excluding Sunday)
      // If activeDays is set (e.g. [1, 2, 3, 4, 5, 6]), it only counts on those active days
      if (activity.activeDays.length > 0 && !activity.activeDays.includes(dayOfWeek)) {
        return false;
      }
      return true;
    }

    case 'day_clusters': {
      // Active ONLY if the date belongs to a complete cluster of clusterSize days that fits entirely
      const clusterDates = getClusterDatesForDate(activity, dateStr);
      return clusterDates.length === (activity.clusterSize || 2);
    }

    default:
      return true;
  }
}

export interface ClusterPreset {
  label: string;
  days: number[]; // Consecutive days of week e.g. [1, 2] for Lun, Mar
}

/**
 * Standard fixed cluster presets of contiguous day sequences.
 */
export function getClusterPresets(size: number): ClusterPreset[] {
  if (size === 2) {
    return [
      { label: 'Lun y Mar', days: [1, 2] },
      { label: 'Mar y Mié', days: [2, 3] },
      { label: 'Mié y Jue', days: [3, 4] },
      { label: 'Jue y Vie', days: [4, 5] },
      { label: 'Vie y Sáb', days: [5, 6] },
      { label: 'Sáb y Dom', days: [6, 0] },
    ];
  }
  if (size === 3) {
    return [
      { label: 'Lun - Mar - Mié', days: [1, 2, 3] },
      { label: 'Mar - Mié - Jue', days: [2, 3, 4] },
      { label: 'Mié - Jue - Vie', days: [3, 4, 5] },
      { label: 'Jue - Vie - Sáb', days: [4, 5, 6] },
      { label: 'Vie - Sáb - Dom', days: [5, 6, 0] },
    ];
  }
  if (size === 4) {
    return [
      { label: 'Lun a Jue', days: [1, 2, 3, 4] },
      { label: 'Mar a Vie', days: [2, 3, 4, 5] },
      { label: 'Mié a Sáb', days: [3, 4, 5, 6] },
      { label: 'Jue a Dom', days: [4, 5, 6, 0] },
    ];
  }
  if (size === 5) {
    return [
      { label: 'Lun a Vie', days: [1, 2, 3, 4, 5] },
      { label: 'Mar a Sáb', days: [2, 3, 4, 5, 6] },
      { label: 'Mié a Dom', days: [3, 4, 5, 6, 0] },
    ];
  }
  return [
    { label: 'Lun a Sáb', days: [1, 2, 3, 4, 5, 6] },
    { label: 'Mar a Dom', days: [2, 3, 4, 5, 6, 0] },
  ];
}

/**
 * Resolves non-overlapping cluster day blocks for an activity.
 * If activity.clusterBlocks is provided and non-empty, returns it.
 * Otherwise, reconstructs non-overlapping blocks without any false ghost overlaps.
 */
export function getActivityClusterBlocks(activity: Activity): number[][] {
  if (activity.clusterBlocks && activity.clusterBlocks.length > 0) {
    return activity.clusterBlocks;
  }

  const clusterSize = activity.clusterSize || 2;
  const presets = getClusterPresets(clusterSize);
  const activeDays = activity.activeDays || [];

  const blocks: number[][] = [];
  const claimedDays = new Set<number>();

  for (const preset of presets) {
    const allDaysInActive = preset.days.every(d => activeDays.includes(d));
    const noDaysClaimed = preset.days.every(d => !claimedDays.has(d));
    if (allDaysInActive && noDaysClaimed) {
      blocks.push(preset.days);
      preset.days.forEach(d => claimedDays.add(d));
    }
  }

  return blocks;
}

/**
 * Returns all date strings that belong to the complete cluster containing dateStr.
 * If the cluster cannot fit completely (e.g. cut off by startDate or endDate),
 * returns empty array [] so incomplete clusters of 1 or fewer days are never formed.
 */
export function getClusterDatesForDate(activity: Activity, dateStr: string): string[] {
  if (activity.scheduleType !== 'day_clusters' || !activity.activeDays || activity.activeDays.length === 0) {
    return [dateStr];
  }

  const d = parseYYYYMMDD(dateStr);
  const dow = d.getDay();
  if (!activity.activeDays.includes(dow)) {
    return [];
  }

  const clusterSize = activity.clusterSize || 2;
  const blocks = getActivityClusterBlocks(activity);

  // Find which specific non-overlapping block contains this dow
  const matchingBlock = blocks.find(b => b.includes(dow));
  if (!matchingBlock || matchingBlock.length !== clusterSize) {
    return [];
  }

  const dowIndexInBlock = matchingBlock.indexOf(dow);
  if (dowIndexInBlock === -1) {
    return [];
  }

  // Calculate cluster start date in calendar (index 0 is cluster start)
  const clusterStart = new Date(d);
  clusterStart.setDate(d.getDate() - dowIndexInBlock);

  const candidateDates: string[] = [];
  for (let i = 0; i < clusterSize; i++) {
    const cur = new Date(clusterStart);
    cur.setDate(clusterStart.getDate() + i);
    candidateDates.push(formatDateToYYYYMMDD(cur));
  }

  // Strict Rule: Every date in the cluster must fall within [startDate, endDate]
  // Never can an incomplete cluster enter (e.g. if start was Tuesday for Lun y Mar,
  // that week's cluster cannot enter and only the next week with complete Lun y Mar enters)
  const allFit = candidateDates.every(cd => {
    if (cd < activity.startDate) return false;
    if (activity.hasEndDate && activity.endDate && cd > activity.endDate) return false;
    return true;
  });

  if (!allFit) {
    return [];
  }

  return candidateDates;
}

export function formatFriendlyDate(dateStr: string): string {
  const d = parseYYYYMMDD(dateStr);
  const dayName = SPANISH_DAYS_FULL[d.getDay()];
  const monthName = SPANISH_MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} de ${monthName}`;
}
