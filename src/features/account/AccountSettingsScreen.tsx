import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import { readAccountDeletionMarker, type AccountDeleteResult } from './account-delete';

export function AccountSettingsScreen({
  ownerId, onBack, onOpenInformation, onDeleteAccount, onSignOutLocally, busy, status, localCleanupFailed, signOutFailed,
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
        <Ionicons name="person-circle-outline" size={26} color={theme.colors.accent} />
      </View>
      <View style={styles.heroText}>
        <PageHeading title="Konto och support" description="Se information om betan eller hantera ditt konto." />
      </View>
    </View>

    <Pressable accessibilityRole="button" onPress={onOpenInformation} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="information-circle-outline" size={23} color={theme.colors.accent} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Information om betan</Text><Text style={styles.rowDetail}>Vad Tassla sparar och hur du får hjälp</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
    </Pressable>
    <Pressable accessibilityRole="button" onPress={() => { void openSupport(); }} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name="mail-outline" size={23} color={theme.colors.accent} />
      <View style={styles.rowCopy}><Text style={styles.rowTitle}>Kontakta support</Text><Text style={styles.rowDetail}>erimali.ab@gmail.com</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
    </Pressable>
    {supportError && <MessageCard tone="error">E-postlänken kunde inte öppnas. Du kan skriva till erimali.ab@gmail.com.</MessageCard>}

    {status === 'confirmed' && <MessageCard>Konto raderat på servern. Den här enheten loggas ut.</MessageCard>}
    {status === 'failed' && <MessageCard tone="error">Servern avvisade raderingsbegäran. Kontot har inte bekräftats raderat. Kontrollera anslutningen eller kontakta support.</MessageCard>}
    {status === 'unavailable' && <MessageCard tone="error">Raderingen kunde inte startas säkert på den här enheten. Försök igen senare.</MessageCard>}
    {status === 'blocked' && <MessageCard tone="error">Avsluta först pågående ändringar och lös eventuell osäker sparstatus innan du raderar kontot.</MessageCard>}
    {status === 'unknown' && <MessageCard tone="error">Vi kunde inte bekräfta om raderingen gick igenom. Skicka inte en ny begäran. Logga ut, försök logga in igen och kontakta support för att kontrollera status.</MessageCard>}
    {markerReady && markerState === 'pending' && status === 'idle' && <MessageCard tone="error">En tidigare raderingsbegäran har osäker status. Skicka inte en ny. Logga ut, kontrollera om du kan logga in igen och kontakta support.</MessageCard>}
    {markerReady && markerState === 'unavailable' && status === 'idle' && <MessageCard tone="error">Raderingsstatus kunde inte läsas från den här enheten. Skicka inte en ny begäran innan support har hjälpt dig kontrollera status.</MessageCard>}
    {localCleanupFailed && <MessageCard tone="error">Kontot är raderat på servern, men lokal städning kunde inte slutföras. Kontakta support om uppgifter fortfarande visas på den här enheten.</MessageCard>}
    {signOutFailed && status === 'confirmed' && <MessageCard tone="error">Kontot är raderat på servern, men utloggningen på den här enheten misslyckades.</MessageCard>}
    {signOutFailed && status !== 'confirmed' && <MessageCard tone="error">Utloggningen på den här enheten misslyckades. Serverns raderingsstatus är inte bekräftad.</MessageCard>}

    <PrimaryButton title={busy ? 'Raderar konto…' : 'Radera konto'}
      disabled={busy || !markerReady || markerState !== 'clear' || terminal || status === 'unavailable'} onPress={confirmDeletion} />
    {(status === 'confirmed' || localCleanupFailed || signOutFailed || status === 'unknown' || markerState !== 'clear' || status === 'unavailable')
      && <QuietButton title="Logga ut på den här enheten" disabled={busy} onPress={() => { void onSignOutLocally(); }} />}
  </View>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, marginBottom: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1 },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  rowCopy: { flex: 1 },
  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  rowDetail: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 4 },
  pressed: { opacity: 0.78 },
});
