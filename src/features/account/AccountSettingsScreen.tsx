import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Dialog, InfoBanner, ListRow } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { readAccountDeletionMarker, type AccountDeleteResult } from './account-delete';

type AccountStatus = AccountDeleteResult['status'] | 'blocked';

export function AccountSettingsScreen({
  ownerId, onOpenInformation, onDeleteAccount, onSignOutLocally, busy, status, localCleanupFailed, signOutFailed,
  analyticsConsent, analyticsBusy, analyticsError, onSetAnalyticsConsent, onRetryAnalyticsConsent,
}: {
  ownerId: string;
  onBack: () => void;
  onOpenInformation: () => void;
  onDeleteAccount: () => Promise<AccountDeleteResult>;
  onSignOutLocally: () => Promise<boolean>;
  busy: boolean;
  status: 'idle' | AccountStatus;
  localCleanupFailed: boolean;
  signOutFailed: boolean;
  analyticsConsent: boolean | null;
  analyticsBusy: boolean;
  analyticsError: boolean;
  onSetAnalyticsConsent: (enabled: boolean) => Promise<boolean>;
  onRetryAnalyticsConsent: () => Promise<void>;
}) {
  const [markerState, setMarkerState] = useState<'pending' | 'clear' | 'unavailable'>('unavailable');
  const [markerReady, setMarkerReady] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const terminal = status === 'confirmed' || status === 'unknown';

  useEffect(() => {
    let active = true;
    void readAccountDeletionMarker(ownerId).then((value) => {
      if (active) {
        setMarkerState(value);
        setMarkerReady(true);
      }
    });
    return () => { active = false; };
  }, [ownerId]);

  function confirmDeletion() {
    if (busy || !markerReady || markerState !== 'clear' || terminal) return;
    setDeleteDialogOpen(true);
  }

  function confirmDeletionFinally() {
    setDeleteDialogOpen(false);
    void onDeleteAccount();
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
    <ListRow category="training" title="Information om betan" detail="Vad Tassla sparar och hur du får hjälp" onPress={onOpenInformation} disabled={busy} />
    <ListRow category="veterinary" title="Kontakta support" detail="erimali.ab@gmail.com" onPress={() => { void openSupport(); }} disabled={busy} />
    {supportError && <InfoBanner>E-postlänken kunde inte öppnas. Du kan skriva till erimali.ab@gmail.com.</InfoBanner>}

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
          trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.primary }}
          thumbColor={tokens.colors.surface}
        />
      </View>
      {(analyticsBusy || analyticsConsent === null) && <Text style={styles.metricsStatus}>{analyticsBusy ? 'Sparar ditt val…' : 'Hämtar ditt val…'}</Text>}
    </View>
    {analyticsError && <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" disabled={analyticsBusy || busy} onPress={() => { void onRetryAnalyticsConsent(); }} />}>Valet kunde inte sparas eller hämtas.</InfoBanner>}

    {(status !== 'idle' || (markerReady && markerState !== 'clear') || localCleanupFailed || signOutFailed) && <InfoBanner>{accountStatusText({ status, markerReady, markerState, localCleanupFailed, signOutFailed })}</InfoBanner>}

    <Button label={busy ? 'Raderar konto…' : 'Radera konto'} accessibilityLabel="Radera konto" variant="destructive"
      disabled={busy || !markerReady || markerState !== 'clear' || terminal || status === 'unavailable'} onPress={confirmDeletion} />
    {(status === 'confirmed' || localCleanupFailed || signOutFailed || status === 'unknown' || markerState !== 'clear' || status === 'unavailable')
      && <Button label="Logga ut på den här enheten" accessibilityLabel="Logga ut på den här enheten" variant="tertiary" disabled={busy} onPress={() => { void onSignOutLocally(); }} />}
    <Dialog visible={deleteDialogOpen} title="Bekräfta radering" onRequestClose={() => setDeleteDialogOpen(false)} onConfirm={confirmDeletionFinally} confirmLabel="Radera konto">
      <Text style={styles.dialogText}>Raderingen går inte att ångra. Det tar bort kontot och data som hör till det.</Text>
    </Dialog>
  </View>;
}

function accountStatusText({ status, markerReady, markerState, localCleanupFailed, signOutFailed }: { status: 'idle' | AccountStatus; markerReady: boolean; markerState: string; localCleanupFailed: boolean; signOutFailed: boolean }): string {
  if (localCleanupFailed) return 'Kontot är raderat, men uppgifter kan fortfarande visas på den här enheten. Kontakta support.';
  if (signOutFailed) return 'Utloggningen på den här enheten misslyckades.';
  if (status === 'confirmed') return 'Kontot är raderat. Vi loggar ut från den här enheten.';
  if (status === 'unknown') return 'Vi kunde inte bekräfta om kontot raderades. Försök inte igen än och kontakta support.';
  if (status === 'blocked') return 'Avsluta pågående ändringar innan du raderar kontot.';
  if (status === 'failed' || status === 'unavailable') return 'Vi kunde inte bekräfta att kontot raderades. Försök igen senare.';
  if (markerReady && markerState !== 'clear') return 'En tidigare raderingsbegäran kunde inte kontrolleras. Kontakta support innan du försöker igen.';
  return '';
}

const styles = StyleSheet.create({
  rowTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  rowDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  metricsCard: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginBottom: tokens.spacing.sm },
  metricsCopy: { marginBottom: tokens.spacing.sm },
  metricsToggleRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  metricsLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  metricsStatus: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  dialogText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
});
