export const ANALYTICS_EVENT_TYPES = [
  'dog_created',
  'home_viewed',
  'first_log',
  'training_started',
  'training_completed',
  'meaningful_return',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  occurredAt: string;
};

export type SyntheticAnalyticsEvent = AnalyticsEvent;

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === 'string' && ANALYTICS_EVENT_TYPES.some((eventType) => eventType === value);
}
