/** Fångsttröskel i React Native-layoutpunkter. */
export const MAIN_SWIPE_CLAIM_DISTANCE = 12;
/** Vågrät rörelse måste dominera lodrät rörelse med minst detta förhållande. */
export const MAIN_SWIPE_HORIZONTAL_RATIO = 2;
/** Dragsträcka i layoutpunkter som byter flik vid släpp. */
export const MAIN_SWIPE_COMMIT_DISTANCE = 48;
/** Snabbgestens hastighet i layoutpunkter per millisekund. */
export const MAIN_SWIPE_FLICK_VELOCITY = 0.5;
/** Minsta sträcka i layoutpunkter för en snabbgest. */
export const MAIN_SWIPE_MIN_FLICK_DISTANCE = 24;

export type MainSwipeDirection = 'left' | 'right';

export function shouldClaimMainSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) > MAIN_SWIPE_CLAIM_DISTANCE
    && Math.abs(dx) > Math.abs(dy) * MAIN_SWIPE_HORIZONTAL_RATIO;
}

/** Vänstersvep (dx < 0) går framåt, högersvep (dx > 0) går bakåt. */
export function mainSwipeDirection(dx: number, dy: number, vx: number): MainSwipeDirection | null {
  const distance = Math.abs(dx);
  if (distance <= Math.abs(dy)) return null;

  const committed = distance >= MAIN_SWIPE_COMMIT_DISTANCE;
  const flicked = distance >= MAIN_SWIPE_MIN_FLICK_DISTANCE
    && Math.abs(vx) >= MAIN_SWIPE_FLICK_VELOCITY
    && Math.sign(vx) === Math.sign(dx);

  if (!committed && !flicked) return null;
  return dx < 0 ? 'left' : 'right';
}
