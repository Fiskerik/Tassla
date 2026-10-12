import type { BottomNavDestination } from '../../components/ui/BottomNav';

export const MAIN_TAB_DESTINATIONS = ['home', 'log', 'training', 'knowledge', 'more'] as const satisfies readonly BottomNavDestination[];
export type MainTabDestination = typeof MAIN_TAB_DESTINATIONS[number];

export function isMainTabDestination(page: string): page is MainTabDestination {
  return MAIN_TAB_DESTINATIONS.some((destination) => destination === page);
}

export function nextMainTabDestination(page: string, direction: 'left' | 'right'): MainTabDestination | undefined {
  const index = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === page);
  if (index < 0) return undefined;
  return MAIN_TAB_DESTINATIONS[index + (direction === 'left' ? 1 : -1)];
}

export function activeMainTabDestination(page: string): BottomNavDestination {
  return isMainTabDestination(page) ? page : 'more';
}

export function mainTabTransitionDirection(previous: string, current: string): 'forward' | 'backward' {
  const previousIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === previous);
  const currentIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === current);
  return currentIndex >= 0 && previousIndex >= 0 && currentIndex < previousIndex ? 'backward' : 'forward';
}
