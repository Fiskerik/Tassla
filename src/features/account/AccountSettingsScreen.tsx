import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import { readAccountDeletionMarker, type AccountDeleteResult } from './account-delete';

export function AccountSettingsScreen({
  ownerId, onBack, onOpenInformation, onDeleteAccount, onSignOutLocally, busy, status, localCleanupFailed, signOutFailed,
  analyticsConsent, analyticsBusy, analyticsError, onSetAnalyticsConsent, onRetryAnalyticsConsent,
}: {
  ownerId: string;
  onBack: () => void;
  onOpenInformation: () => void;
  onDeleteAccount: () => Promise<AccountDeleteResult>;
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
  const [markerState, setMarkerState] = useState<'pending' | 'clear' | 'unavailable'>('unavailable');
  const [markerReady, setMarkerReady] = useState(false);
  const [supportError, setSupportError] = useState(false);
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
    <QuietButton title="Tillbaka till Mer" disabled={busy} onPress={onBack} />
    <View style={styles.hero}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="person-circle-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
      </View>
      <View style={styles.heroText}>
        <PageHeading title="Konto och support" description="Se information om betan eller hantera ditt konto." />
      </View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Information om betan" onPress={onOpenInformation} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Information om betan</Text><Text style={styles.rowDetail}>Vad Tassla sparar och hur du får hjälp</Text></View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Kontakta support via e-post" onPress={() => { void openSupport(); }} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="mail-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Kontakta support</Text><Text style={styles.rowDetail}>erimali.ab@gmail.com</Text></View>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
    </Pressable>
    {supportError && <MessageCard tone="error">E-postlänken kunde inte öppnas. Du kan skriva till erimali.ab@gmail.com.</MessageCard>}

    <View style={styles.metricsCard}>
      <View style={styles.metricsCopy}>
        <Text style={styles.rowTitle}>Hjälp oss göra Tassla bättre</Text>
        <Text style={styles.rowDetail}>Frivillig mätning visar vilka delar av appen som används. Händelser sparas i upp till 30 dagar. Du kan stänga av när du vill.</Text>
      </View>
      <Switch
        accessibilityLabel="Tillåt frivillig användningsmätning"
        accessibilityState={{ checked: analyticsConsent === true, disabled: analyticsConsent === null || analyticsBusy || busy }}
        disabled={analyticsConsent === null || analyticsBusy || busy}
        value={analyticsConsent === true}
        onValueChange={(value) => { void onSetAnalyticsConsent(value); }}
        trackColor={{ false: tokens.colors.borderStrong, true: tokens.colors.primary }}
        thumbColor={tokens.colors.surface}
      />
      <Text style={styles.metricsLabel}>{analyticsBusy ? 'Sparar ditt val…' : analyticsConsent === null ? 'Hämtar ditt val…' : 'Tillåt användningsmätning'}</Text>
    </View>
    {analyticsError && <MessageCard tone="error">Valet kunde inte sparas eller hämtas. Kontrollera anslutningen och försök igen.</MessageCard>}
    {analyticsError && <QuietButton title="Försök hämta valet igen" disabled={analyticsBusy || busy} onPress={() => { void onRetryAnalyticsConsent(); }} />}

    {status === 'confirmed' && <MessageCard>Kontot är raderat. Vi loggar ut från den här enheten.</MessageCard>}
    {status === 'failed' && <MessageCard tone="error">Vi kunde inte bekräfta att kontot raderades. Kontrollera anslutningen eller kontakta support.</MessageCard>}
    {status === 'unavailable' && <MessageCard tone="error">Raderingen kunde inte startas säkert på den här enheten. Försök igen senare.</MessageCard>}
    {status === 'blocked' && <MessageCard tone="error">Avsluta pågående ändringar och kontrollera att de är klara innan du raderar kontot.</MessageCard>}
    {status === 'unknown' && <MessageCard tone="error">Vi kunde inte bekräfta om kontot raderades. Försök inte igen än. Logga ut, försök logga in och kontakta support om du fortfarande kan komma in.</MessageCard>}
    {markerReady && markerState === 'pending' && status === 'idle' && <MessageCard tone="error">Vi kunde inte bekräfta en tidigare radering. Försök inte igen än. Logga ut och kontakta support för hjälp.</MessageCard>}
    {markerReady && markerState === 'unavailable' && status === 'idle' && <MessageCard tone="error">Vi kunde inte kontrollera om kontot redan har en raderingsbegäran. Skicka inte en ny innan support har hjälpt dig.</MessageCard>}
    {localCleanupFailed && <MessageCard tone="error">Kontot är raderat, men uppgifter kan fortfarande visas på den här enheten. Kontakta support.</MessageCard>}
    {signOutFailed && status === 'confirmed' && <MessageCard tone="error">Kontot är raderat, men utloggningen på den här enheten misslyckades.</MessageCard>}
    {signOutFailed && status !== 'confirmed' && <MessageCard tone="error">Utloggningen på den här enheten misslyckades. Vi kunde inte bekräfta om kontot raderades.</MessageCard>}

    <DestructiveButton title={busy ? 'Raderar konto…' : 'Radera konto'}
      disabled={busy || !markerReady || markerState !== 'clear' || terminal || status === 'unavailable'} onPress={confirmDeletion} />
    {(status === 'confirmed' || localCleanupFailed || signOutFailed || status === 'unknown' || markerState !== 'clear' || status === 'unavailable')
      && <QuietButton title="Logga ut på den här enheten" disabled={busy} onPress={() => { void onSignOutLocally(); }} />}
  </View>;
}

function DestructiveButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.deleteButton, disabled && styles.deleteDisabled, pressed && !disabled && styles.pressed]}>
    <Text style={styles.deleteText}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.selectedSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  icon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.successSurface, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  row: { minHeight: tokens.size.touchMin + tokens.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md, marginBottom: tokens.spacing.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  rowCopy: { flex: 1 },
  rowTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  rowDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  metricsCard: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginBottom: tokens.spacing.sm },
  metricsCopy: { marginBottom: tokens.spacing.sm },
  metricsLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xs },
  deleteButton: { minHeight: tokens.size.buttonHeight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.lg, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.danger, backgroundColor: tokens.colors.surface, marginTop: tokens.spacing.md },
  deleteDisabled: { opacity: 0.5 },
  deleteText: { ...tokens.typography.label, color: tokens.colors.danger },
  pressed: { opacity: 0.78 },
});
