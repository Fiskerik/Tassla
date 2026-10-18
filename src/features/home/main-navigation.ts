import type { BottomNavDestination } from '../../components/ui/BottomNav';

export const MAIN_TAB_DESTINATIONS = ['home', 'log', 'training', 'knowledge', 'more'] as const satisfies readonly BottomNavDestination[];
export type MainTabDestination = typeof MAIN_TAB_DESTINATIONS[number];

export function isMainTabDestination(page: string): page is MainTabDestination {
  return MAIN_TAB_DESTINATIONS.some((destination) => destination === page);
}

export function usesDailyActivitySnapshotForPage(page: string): boolean {
  return page === 'home' || page === 'checklist' || page === 'training' || page === 'daily-progress';
}

export function nextMainTabDestination(page: string, direction: 'left' | 'right'): MainTabDestination | undefined {
  const index = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === page);
  if (index < 0) return undefined;
  return MAIN_TAB_DESTINATIONS[index + (direction === 'left' ? 1 : -1)];
}

export function activeMainTabDestination(page: string): BottomNavDestination {
  if (page === 'checklist' || page === 'daily-progress') return 'home';
  if (page === 'insights') return 'log';
  return isMainTabDestination(page) ? page : 'more';
}

export function mainTabTransitionDirection(previous: string, current: string): 'forward' | 'backward' {
  const previousIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === previous);
  const currentIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === current);
  return currentIndex >= 0 && previousIndex >= 0 && currentIndex < previousIndex ? 'backward' : 'forward';
}


export function requestMainTabNavigation<Destination extends string>(
  currentPage: string,
  destination: Destination,
  requestLeave: (commit: () => void) => void,
  commit: (destination: Destination) => void,
): 'same' | 'requested' {
  if (currentPage === destination) return 'same';
  requestLeave(() => commit(destination));
  return 'requested';
}
