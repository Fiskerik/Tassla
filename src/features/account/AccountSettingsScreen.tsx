import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, QuietButton } from '../../components/AppPrimitives';
import { Button, SupportScreenHeader } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { readAccountDeletionMarker, type AccountDeleteResult, type AccountDeletionUnlockResult } from './account-delete';

export function AccountSettingsScreen({
  ownerId, onBack, onOpenInformation, onDeleteAccount, onResetDeletionLock, onSignOutLocally, busy, status, localCleanupFailed, signOutFailed,
  analyticsConsent, analyticsBusy, analyticsError, onSetAnalyticsConsent, onRetryAnalyticsConsent,
}: {
  ownerId: string;
  onBack: () => void;
  onOpenInformation: () => void;
  onDeleteAccount: () => Promise<AccountDeleteResult>;
  onResetDeletionLock: () => Promise<AccountDeletionUnlockResult>;
  onSignOutLocally: () => Promise<boolean>;
  busy: boolean;
  status: 'idle' | 'confirmed' | 'failed' | 'unknown' | 'unavailable' | 'blocked';
  localCleanupFailed: boolean;
  signOutFailed: boolean;
  analyticsConsent: boolean | null;
  analyticsBusy: boolean;
  analyticsError: boolean;
  onSetAnalyticsConsent: (enabled: boolean) => Promise<boolean>;
  onRetryAnalyticsConsent: () => Promise<void>;
}) {
  const [marker, setMarker] = useState<{ ownerId: string; state: 'pending' | 'clear' | 'unavailable'; ready: boolean }>({ ownerId, state: 'unavailable', ready: false });
  const markerState = marker.ownerId === ownerId ? marker.state : 'unavailable';
  const markerReady = marker.ownerId === ownerId && marker.ready;
  const [supportError, setSupportError] = useState(false);
  const terminal = status === 'confirmed' || status === 'unknown';
  const [unlockState, setUnlockState] = useState<{ ownerId: string; busy: boolean; result: 'idle' | 'ready' | 'unavailable' }>({ ownerId, busy: false, result: 'idle' });
  const unlockBusy = unlockState.ownerId === ownerId && unlockState.busy;
  const unlockResult = unlockState.ownerId === ownerId ? unlockState.result : 'idle';
  const unlockFlight = useRef(false);
  const screenGeneration = useRef(0);
  const canUnlock = markerReady && status !== 'confirmed'
    && (markerState !== 'clear' || status === 'unknown' || status === 'unavailable');

  useLayoutEffect(() => {
    screenGeneration.current += 1;
    return () => { screenGeneration.current += 1; };
  }, [ownerId]);

  async function unlockDeletion() {
    if (unlockFlight.current || busy || !canUnlock) return;
    const generation = screenGeneration.current;
    unlockFlight.current = true;
    setUnlockState({ ownerId, busy: true, result: 'idle' });
    try {
      const result = await onResetDeletionLock();
      if (screenGeneration.current !== generation) return;
      if (result === 'ready') {
        setMarker({ ownerId, state: 'clear', ready: true });
      }
      setUnlockState({ ownerId, busy: false, result });
    } catch {
      if (screenGeneration.current === generation) setUnlockState({ ownerId, busy: false, result: 'unavailable' });
    } finally {
      unlockFlight.current = false;
    }
  }

  useEffect(() => {
    let active = true;
    void readAccountDeletionMarker(ownerId).then((value) => {
      if (active) {
        setMarker({ ownerId, state: value, ready: true });
      }
    });
    return () => { active = false; };
  }, [ownerId]);

  function confirmDeletion() {
    if (busy || unlockFlight.current || !markerReady || markerState !== 'clear' || terminal) return;
    Alert.alert(
      'Radera konto?',
      'Det här tar bort ditt konto och data som hör till det, bland annat hundprofil, vardagslogg, hälsouppgifter, planerade poster, träningsframsteg och användningsattribution. Dina lokala påminnelseval och Tasslas egna notiser städas separat.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Fortsätt', onPress: () => confirmDeletionFinally() },
      ],
    );
  }

  function confirmDeletionFinally() {
    if (busy || unlockFlight.current || !markerReady || markerState !== 'clear' || terminal) return;
    Alert.alert(
      'Bekräfta radering',
      'Raderingen går inte att ångra. Vill du radera kontot nu?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Radera konto', style: 'destructive', onPress: () => { void onDeleteAccount(); } },
      ],
    );
  }

  async function openSupport() {
    setSupportError(false);
    try {
      await Linking.openURL('mailto:erimali.ab@gmail.com');
    } catch {
      setSupportError(true);
    }
  }

  return <View>
    <SupportScreenHeader title="Konto" backLabel="Tillbaka till Mer" accent="account" disabled={busy} onBack={onBack} />
    <View style={styles.hero}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="person-circle-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} />
      </View>
      <View style={styles.heroText}>
        <Text style={styles.intro}>Se information om betan eller hantera ditt konto.</Text>
      </View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Information om betan" onPress={onOpenInformation} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Information om betan</Text><Text style={styles.rowDetail}>Vad Tassla sparar och hur du får hjälp</Text></View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Kontakta support via e-post" onPress={() => { void openSupport(); }} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="mail-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Kontakta support</Text><Text style={styles.rowDetail}>erimali.ab@gmail.com</Text></View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
    </Pressable>
    {supportError && <MessageCard tone="error">E-postlänken kunde inte öppnas. Du kan skriva till erimali.ab@gmail.com.</MessageCard>}

    <View style={styles.metricsCard}>
      <View style={styles.metricsCopy}>
        <Text style={styles.rowTitle}>Hjälp oss göra Tassla bättre</Text>
        <Text style={styles.rowDetail}>Frivillig mätning visar vilka delar av appen som används. Händelser sparas i upp till 30 dagar. Du kan stänga av när du vill.</Text>
      </View>
      <View style={styles.metricsToggleRow}>
        <Text style={styles.metricsLabel}>Tillåt användningsmätning</Text>
        <Switch
          accessibilityLabel="Tillåt frivillig användningsmätning"
          accessibilityState={{ checked: analyticsConsent === true, disabled: analyticsConsent === null || analyticsBusy || busy }}
          disabled={analyticsConsent === null || analyticsBusy || busy}
          value={analyticsConsent === true}
          onValueChange={(value) => { void onSetAnalyticsConsent(value); }}
          trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.support.account.fg }}
          thumbColor={tokens.colors.surface}
        />
      </View>
      {(analyticsBusy || analyticsConsent === null) && <Text style={styles.metricsStatus}>{analyticsBusy ? 'Sparar ditt val…' : 'Hämtar ditt val…'}</Text>}
    </View>
    {analyticsError && <MessageCard tone="error">Valet kunde inte sparas eller hämtas. Kontrollera anslutningen och försök igen.</MessageCard>}
    {analyticsError && <QuietButton title="Försök hämta valet igen" disabled={analyticsBusy || busy} onPress={() => { void onRetryAnalyticsConsent(); }} />}

    <View style={styles.deleteCard}>
    <View style={styles.deleteHeader}><Text style={[styles.deleteSectionTitle, styles.deleteTitle]} accessibilityRole="header">Kontoradering</Text>
    <Button variant="icon" iconName="trash-outline" label="Radera konto" accessibilityLabel={busy && !unlockBusy ? 'Raderar konto…' : 'Radera konto'} loading={busy && !unlockBusy}
      disabled={busy || !markerReady || markerState !== 'clear' || terminal || status === 'unavailable'} onPress={confirmDeletion} />
    </View>
    {status === 'confirmed' && <MessageCard>Kontot är raderat. Vi loggar ut från den här enheten.</MessageCard>}
    {status === 'failed' && <MessageCard tone="error">Vi kunde inte bekräfta att kontot raderades. Kontrollera anslutningen eller kontakta support.</MessageCard>}
    {status === 'unavailable' && <MessageCard tone="error">Raderingen kunde inte startas säkert på den här enheten. Försök igen senare.</MessageCard>}
    {status === 'blocked' && <MessageCard tone="error">Avsluta pågående ändringar och kontrollera att de är klara innan du raderar kontot.</MessageCard>}
    {canUnlock && <View style={styles.unlockSection} testID="account-deletion-unlock">
      <Text style={styles.rowDetail}>{markerState === 'unavailable' && status !== 'unknown'
        ? 'Det tidigare försöket kunde inte kontrolleras.' : 'Det tidigare raderingsförsöket saknar bekräftelse.'}</Text>
      {unlockResult === 'unavailable' && <Text accessibilityLiveRegion="polite" style={[styles.rowDetail, styles.unlockError]}>Kunde inte låsa upp. Försök igen.</Text>}
      <Button label="Kontrollera och lås upp" iconName="refresh-outline" accessibilityLabel="Kontrollera kontot och lås upp ett nytt raderingsförsök"
        loading={unlockBusy} disabled={busy || unlockBusy} onPress={() => { void unlockDeletion(); }} />
      <Text accessibilityLiveRegion="polite" style={styles.rowDetail}>{unlockBusy ? 'Kontrollerar kontot…' : 'En ny radering kräver din bekräftelse.'}</Text>
    </View>}
    {unlockResult === 'ready' && status === 'idle' && !busy && !canUnlock && <MessageCard>Klart för ett nytt försök.</MessageCard>}
    {localCleanupFailed && <MessageCard tone="error">Kontot är raderat, men uppgifter kan fortfarande visas på den här enheten. Kontakta support.</MessageCard>}
    {signOutFailed && status === 'confirmed' && <MessageCard tone="error">Kontot är raderat, men utloggningen på den här enheten misslyckades.</MessageCard>}
    {signOutFailed && status !== 'confirmed' && <MessageCard tone="error">Utloggningen på den här enheten misslyckades. Vi kunde inte bekräfta om kontot raderades.</MessageCard>}


    {(status === 'confirmed' || localCleanupFailed || signOutFailed || status === 'unknown' || markerState !== 'clear' || status === 'unavailable')
      && <QuietButton title="Logga ut på den här enheten" disabled={busy} onPress={() => { void onSignOutLocally(); }} />}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  unlockError: { color: tokens.colors.danger },
  unlockSection: { gap: tokens.spacing.sm },
  deleteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  deleteTitle: { flex: 1, minWidth: 0 },
  intro: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.account.bg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  icon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  row: { minHeight: tokens.size.touchMin + tokens.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, marginBottom: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  rowCopy: { flex: 1 },
  rowTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  rowDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  metricsCard: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginBottom: tokens.spacing.sm },
  deleteCard: { marginTop: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.dangerSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.dangerBorder, gap: tokens.spacing.sm },
  deleteSectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  metricsCopy: { marginBottom: tokens.spacing.sm },
  metricsToggleRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  metricsLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  metricsStatus: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  pressed: { opacity: 0.78 },
});
