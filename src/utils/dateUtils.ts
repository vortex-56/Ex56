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

    default:
      return true;
  }
}

export function formatFriendlyDate(dateStr: string): string {
  const d = parseYYYYMMDD(dateStr);
  const dayName = SPANISH_DAYS_FULL[d.getDay()];
  const monthName = SPANISH_MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} de ${monthName}`;
}
