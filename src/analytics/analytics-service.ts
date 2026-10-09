import { isAnalyticsEventType, type AnalyticsEventType, type SyntheticAnalyticsEvent } from './analytics-model';

type RpcResult = { data: unknown; error: unknown | null };
export type AnalyticsRpc = (name: string, args?: Record<string, unknown>) => Promise<RpcResult>;

export type AnalyticsService = {
  getConsent: () => Promise<boolean | null>;
  setConsent: (enabled: boolean) => Promise<boolean>;
  track: (eventType: AnalyticsEventType) => Promise<boolean>;
};

/** Product analytics is best effort. RPCs enforce consent and the allowlist again on the server. */
export function createAnalyticsService(rpc: AnalyticsRpc): AnalyticsService {
  let consent: boolean | null = null;
  return {
    async getConsent() {
      try {
        const result = await rpc('get_beta_metrics_consent');
        if (result.error) {
          consent = null;
          return null;
        }
        consent = result.data === true;
        return consent;
      } catch {
        consent = null;
        return null;
      }
    },
    async setConsent(enabled) {
      if (!enabled) consent = false;
      try {
        const result = await rpc('set_beta_metrics_consent', { p_enabled: enabled });
        if (result.error || result.data !== true) return false;
        consent = enabled;
        return true;
      } catch {
        return false;
      }
    },
    async track(eventType) {
      if (consent !== true || !isAnalyticsEventType(eventType)) return false;
      try {
        const result = await rpc('record_product_event', { p_event_type: eventType });
        return result.error === null && typeof result.data === 'string';
      } catch {
        return false;
      }
    },
  };
}

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
