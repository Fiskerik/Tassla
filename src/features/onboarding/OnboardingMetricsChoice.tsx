import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAnalyticsService } from '../../analytics/analytics-service';
import { QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';

/** Optional, account-scoped usage measurement; no event is sent before consent. */
export function OnboardingMetricsChoice({ client, ownerId, accountGeneration, isCurrentAccount, hasReferral }: {
  client: SupabaseClient;
  ownerId: string;
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
  hasReferral: boolean;
}) {
  const [consent, setConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const alive = useRef(false);
  const inFlight = useRef(false);
  const sequence = useRef(0);
  const sent = useRef({ onboarding: false, referral: false });
  const service = useMemo(() => createAnalyticsService(async (name, args) => {
    if (!isCurrentAccount(ownerId, accountGeneration)) return { data: null, error: new Error('Account changed') };
    const result = await client.rpc(name, args as never);
    return { data: result.data, error: result.error };
  }), [client, ownerId, accountGeneration, isCurrentAccount]);
  const current = useCallback(() => alive.current && isCurrentAccount(ownerId, accountGeneration), [isCurrentAccount, ownerId, accountGeneration]);
  const readConsent = useCallback(async () => {
    if (!current() || inFlight.current) return;
    inFlight.current = true;
    const operation = ++sequence.current;
    setLoading(true);
    const value = await service.getConsent();
    if (!current() || sequence.current !== operation) return;
    inFlight.current = false;
    setConsent(value);
    setError(value === null);
    setLoading(false);
  }, [current, service]);
  useEffect(() => {
    alive.current = true;
    const operation = ++sequence.current;
    inFlight.current = true;
    void service.getConsent().then((value) => {
      if (!current() || sequence.current !== operation) return;
      inFlight.current = false;
      setConsent(value);
      setError(value === null);
      setLoading(false);
    });
    return () => { alive.current = false; sequence.current += 1; inFlight.current = false; };
  }, [current, service]);
  useEffect(() => {
    if (consent !== true || !current()) return;
    if (!sent.current.onboarding) {
      sent.current.onboarding = true;
      void service.track('onboarding_opened');
    }
    if (hasReferral && !sent.current.referral) {
      sent.current.referral = true;
      void service.track('referral_opened');
    }
  }, [consent, current, hasReferral, service]);
  async function changeConsent(enabled: boolean) {
    if (loading || inFlight.current || !current()) return;
    inFlight.current = true;
    const operation = ++sequence.current;
    setLoading(true);
    setError(false);
    const saved = await service.setConsent(enabled);
    if (!current() || sequence.current !== operation) return;
    inFlight.current = false;
    if (!saved) {
      setConsent(null);
      setError(true);
    } else {
      if (!enabled) sent.current = { onboarding: false, referral: false };
      setConsent(enabled);
    }
    setLoading(false);
  }
  return <View style={styles.card}>
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>Hjälp oss förbättra Tassla</Text>
        <Text style={styles.detail}>Frivillig mätning visar vilka delar av appen som används. Händelser sparas i högst 30 dagar. Ändra valet under Konto.</Text>
      </View>
      <Switch accessibilityLabel="Tillåt frivillig användningsmätning" value={consent === true}
        accessibilityState={{ checked: consent === true, disabled: loading || consent === null }}
        disabled={loading || consent === null} onValueChange={(value) => { void changeConsent(value); }}
        trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.primary }} thumbColor={tokens.colors.surface} />
    </View>
    {loading ? <Text style={styles.detail}>Kontrollerar valet…</Text> : null}
    {error ? <><Text accessibilityLiveRegion="polite" style={styles.detail}>Vi kunde inte kontrollera valet. Du kan fortsätta skapa profilen.</Text>
      <QuietButton title="Försök kontrollera mätning igen" disabled={loading} onPress={() => { void readConsent(); }} /></> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginBottom: tokens.spacing.md, gap: tokens.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
