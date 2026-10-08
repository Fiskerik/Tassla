import { isAnalyticsEventType, type AnalyticsEventType, type SyntheticAnalyticsEvent } from './analytics-model.ts';

export type SyntheticAnalyticsOptions = {
  enabled?: boolean;
  consentGranted?: boolean;
  now?: () => Date;
};

export type SyntheticAnalyticsAdapter = {
  track: (eventType: AnalyticsEventType) => void;
  getEvents: () => SyntheticAnalyticsEvent[];
  clear: () => void;
};

export function createSyntheticAnalyticsAdapter(
  { enabled = false, consentGranted = false, now = () => new Date() }: SyntheticAnalyticsOptions = {},
): SyntheticAnalyticsAdapter {
  const events: SyntheticAnalyticsEvent[] = [];

  return {
    track(eventType) {
      if (!enabled || !consentGranted || !isAnalyticsEventType(eventType)) return;
      events.push({ eventType, occurredAt: now().toISOString() });
    },
    getEvents() {
      return events.map((event) => ({ ...event }));
    },
    clear() {
      events.length = 0;
    },
  };
}
