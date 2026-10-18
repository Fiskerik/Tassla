// Gesture distances use React Native layout points; velocity is points per millisecond.
export const SHEET_DRAG_START = 8;
export const SHEET_DISMISS_DISTANCE = 96;
export const SHEET_DISMISS_VELOCITY = 0.8;
export const SHEET_DISMISS_MIN_FLICK_DISTANCE = 24;

export function shouldStartSheetDrag(dx: number, dy: number): boolean {
  return dy > SHEET_DRAG_START && dy > Math.abs(dx) * 1.5;
}

export function sheetDragOffset(dy: number): number {
  return dy > 0 ? dy : 0;
}

export function shouldDismissSheet(dy: number, vy: number): boolean {
  if (dy >= SHEET_DISMISS_DISTANCE) return true;
  return dy >= SHEET_DISMISS_MIN_FLICK_DISTANCE && vy >= SHEET_DISMISS_VELOCITY;
}
