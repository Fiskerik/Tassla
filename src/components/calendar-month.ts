export function shiftCalendarMonth(month: Date, direction: -1 | 1): Date {
  return new Date(month.getFullYear(), month.getMonth() + direction, 1);
}
