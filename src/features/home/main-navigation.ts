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
  if (page === 'development' || page === 'progress' || page === 'checklist' || page === 'home-training-detail') return 'home';
  return isMainTabDestination(page) ? page : 'more';
}

export type ProductRouteScrollKeys = { scrollKey: string; preserveScrollKey?: string };

export function productRouteScrollKeys(page: string, knowledgeReturnPage?: string, trainingReturnPage?: string): ProductRouteScrollKeys {
  if (page === 'home') return { scrollKey: 'home-detail-flow', preserveScrollKey: 'home-detail-flow' };
  if (page === 'development') return { scrollKey: 'home-development-flow', preserveScrollKey: 'home-development-flow' };
  if (page === 'progress') return { scrollKey: 'home-progress-flow', preserveScrollKey: 'home-progress-flow' };
  if (page === 'checklist') return { scrollKey: 'home-checklist-flow', preserveScrollKey: 'home-checklist-flow' };
  if (page === 'home-training-detail' && trainingReturnPage === 'progress') return { scrollKey: 'home-progress-training-detail', preserveScrollKey: 'home-progress-flow' };
  if (page === 'home-training-detail') return { scrollKey: page, preserveScrollKey: 'home-checklist-flow' };
  if (page === 'knowledge' && knowledgeReturnPage === 'development') {
    return { scrollKey: 'home-development-guide-detail', preserveScrollKey: 'home-development-flow' };
  }
  return { scrollKey: page };
}

export function mainTabTransitionDirection(previous: string, current: string): 'forward' | 'backward' {
  const previousIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === previous);
  const currentIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === current);
  return currentIndex >= 0 && previousIndex >= 0 && currentIndex < previousIndex ? 'backward' : 'forward';
}
