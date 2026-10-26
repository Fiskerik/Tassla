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

export type ProfileInsightsOrigin = {
  kind: 'profile';
  selectionKey: string;
  accountGeneration: number;
  dogId: string;
  profileReturnPage: 'more' | 'training';
};

export type InsightsOrigin = { kind: 'log' } | ProfileInsightsOrigin;

export function logViewScrollKeys(view: 'today' | 'overview'): ProductRouteScrollKeys {
  return view === 'overview'
    ? { scrollKey: 'log-insights-flow', preserveScrollKey: 'log' }
    : { scrollKey: 'log', preserveScrollKey: 'log' };
}

export function profileInsightsOriginMatches(origin: InsightsOrigin | null, selectionKey: string, accountGeneration: number, dogId: string): origin is ProfileInsightsOrigin {
  return origin?.kind === 'profile'
    && origin.selectionKey === selectionKey
    && origin.accountGeneration === accountGeneration
    && origin.dogId === dogId;
}

export function profileInsightsDisabledReason(input: {
  dogProfileDirty: boolean;
  kennelDraftDirty: boolean;
  profileBusy: boolean;
  profilePending: boolean;
  profileConflict: boolean;
  attributionBusy: boolean;
  attributionWriteUnresolved: boolean;
  attributionReady: boolean;
}): string | null {
  if (input.dogProfileDirty) return 'Spara eller ändra tillbaka profiluppgifterna för att öppna Insikter.';
  if (input.profileBusy || input.profilePending || input.profileConflict) return 'Kontrollera profiländringen innan du öppnar Insikter.';
  if (input.kennelDraftDirty || input.attributionBusy || input.attributionWriteUnresolved) return 'Kontrollera kenneländringen innan du öppnar Insikter.';
  if (!input.attributionReady) return 'Kontrollera kennelkopplingen innan du öppnar Insikter.';
  return null;
}

export function productRouteScrollKeys(page: string, knowledgeReturnPage?: string, trainingReturnPage?: string, knowledgeContentId?: string | null): ProductRouteScrollKeys {
  if (page === 'home') return { scrollKey: 'home-detail-flow', preserveScrollKey: 'home-detail-flow' };
  if (page === 'development') return { scrollKey: 'home-development-flow', preserveScrollKey: 'home-development-flow' };
  if (page === 'progress') return { scrollKey: 'home-progress-flow', preserveScrollKey: 'home-progress-flow' };
  if (page === 'checklist') return { scrollKey: 'home-checklist-flow', preserveScrollKey: 'home-checklist-flow' };
  if (page === 'home-training-detail' && trainingReturnPage === 'progress') return { scrollKey: 'home-progress-training-detail', preserveScrollKey: 'home-progress-flow' };
  if (page === 'home-training-detail') return { scrollKey: page, preserveScrollKey: 'home-checklist-flow' };
  if (page === 'health') return { scrollKey: 'health-flow', preserveScrollKey: 'health-flow' };
  if (page === 'planned-health') return { scrollKey: 'planned-health', preserveScrollKey: 'planned-health' };
  if (page === 'knowledge' && knowledgeContentId) {
    return {
      scrollKey: `knowledge-article:${knowledgeContentId}`,
      preserveScrollKey: knowledgeReturnPage === 'development' ? 'home-development-flow' : 'knowledge',
    };
  }
  if (page === 'knowledge' && knowledgeReturnPage === 'development') {
    return { scrollKey: 'home-development-guide-detail', preserveScrollKey: 'home-development-flow' };
  }
  if (page === 'knowledge') return { scrollKey: 'knowledge', preserveScrollKey: 'knowledge' };
  return { scrollKey: page };
}

export function mainTabTransitionDirection(previous: string, current: string): 'forward' | 'backward' {
  const previousIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === previous);
  const currentIndex = MAIN_TAB_DESTINATIONS.findIndex((destination) => destination === current);
  return currentIndex >= 0 && previousIndex >= 0 && currentIndex < previousIndex ? 'backward' : 'forward';
}
