import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionFeedbackModal, InfoModal, MessageCard, PageHeading, PrimaryButton, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import type { NotificationPreferences } from '../../notifications/notification-model';

export function NotificationSettingsScreen({
  onBack, preferences, saved, busy, statusMessage, statusError, permissionState, onSave, onRequestPermission,
}: {
  onBack: () => void;
  preferences: NotificationPreferences;
  saved: boolean;
  busy: boolean;
  statusMessage: string;
  statusError: boolean;
  permissionState: 'unknown' | 'granted' | 'denied';
  onSave: (preferences: NotificationPreferences) => Promise<boolean>;
  onRequestPermission: () => Promise<'granted' | 'denied' | 'unknown'>;
}) {
  const [enabled, setEnabled] = useState(preferences.enabled);
  const [trainingEnabled, setTrainingEnabled] = useState(preferences.trainingEnabled);
  const [trainingTime, setTrainingTime] = useState(formatTime(preferences.trainingMinutes));
  const [formError, setFormError] = useState('');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [dismissedStatus, setDismissedStatus] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  async function save() {
    setDismissedStatus(null);
    setFormError('');
    const minutes = parseTime(trainingTime);
    if (minutes === null) {
      setFormError('Ange en tid mellan 00:00 och 23:59.');
      return;
    }
    await onSave({ version: 1, enabled, trainingEnabled, trainingMinutes: minutes });
  }

  async function requestPermission() {
    setDismissedStatus(null);
    setPermissionBusy(true);
    setPermissionMessage('');
    try {
      const result = await onRequestPermission();
      setPermissionMessage(result === 'granted'
        ? 'Enhetens tillstånd tillåter Tassla att schemalägga lokala påminnelser.'
        : result === 'denied' ? 'Enhetens tillstånd nekar notiser. Du kan ändra detta i enhetsinställningarna.'
          : 'Tillståndet kunde inte kontrolleras för den här sessionen.');
    } catch {
      setPermissionMessage('Tillståndet kunde inte kontrolleras. Försök igen.');
    } finally {
      setPermissionBusy(false);
    }
  }

  return <View>
    <QuietButton title="Tillbaka till Mer" disabled={busy} onPress={onBack} />
    <View style={styles.hero}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="notifications-outline" size={24} color={theme.colors.accent} />
      </View>
      <View style={styles.heroCopy}>
        <PageHeading title="Påminnelser" description="Välj om Tassla ska schemalägga lokala påminnelser på den här enheten." />
      </View>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoHint}>Om lokala påminnelser</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa information om lokala påminnelser" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={21} color={theme.colors.accent} />
        <Text style={styles.infoButtonText}>Läs information</Text>
      </Pressable>
    </View>
    <InfoModal visible={infoVisible} title="Om lokala påminnelser" onClose={() => setInfoVisible(false)}>
      <Text style={styles.infoBody}>Påminnelser är av från början. Enhetens tillstånd och ditt val här är separata.</Text>
      <Text style={styles.infoBody}>Låsskärmen visar bara en generell text. Påminnelser är inte en bekräftelse på leverans.</Text>
    </InfoModal>

    <Choice selected={enabled} disabled={busy} label="Tillåt Tasslas påminnelser på den här enheten"
      detail="Avbokar Tasslas egna påminnelser när du stänger av. Dina planval sparas."
      onPress={() => setEnabled((value) => !value)} />
    <Choice selected={trainingEnabled} disabled={busy || !enabled} label="Lägg till en frivillig träningspåminnelse"
      detail="En lokal träningspåminnelse i taget. Nästa tid uppdateras när Tassla öppnas. Den är av från början."
      onPress={() => setTrainingEnabled((value) => !value)} />

    <TimePickerField label="Träningspåminnelse, lokal tid" disabled={busy} onChangeText={setTrainingTime} value={trainingTime} />

    {permissionMessage ? <MessageCard tone={permissionState === 'denied' ? 'error' : 'neutral'}>{permissionMessage}</MessageCard> : null}
    <PrimaryButton title={permissionBusy ? 'Kontrollerar…' : 'Tillåt påminnelser på telefonen'}
      disabled={busy || permissionBusy} onPress={() => { void requestPermission(); }} />
    {permissionState === 'granted' && <MessageCard>Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.</MessageCard>}
    {permissionState === 'denied' && <MessageCard tone="error">Enheten nekar notiser. Appen fungerar fortfarande.</MessageCard>}
    {statusMessage && statusError ? <MessageCard tone="error">{statusMessage}</MessageCard> : null}
    {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
    {saved && <MessageCard>Valen är sparade för ditt konto på den här enheten.</MessageCard>}
    <PrimaryButton title={busy ? 'Sparar…' : 'Spara val'} disabled={busy} onPress={() => { void save(); }} />
    {statusMessage && !statusError ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)} /> : null}
  </View>;
}

function Choice({ selected, disabled, label, detail, onPress }: {
  selected: boolean; disabled: boolean; label: string; detail: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && !disabled && styles.pressed]}>
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark" size={17} color={theme.colors.onAccent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
    </View>
    <View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.choiceDetail}>{detail}</Text></View>
  </Pressable>;
}
function formatTime(minutes: number): string {
  return Math.floor(minutes / 60).toString().padStart(2, '0') + ':' + (minutes % 60).toString().padStart(2, '0');
}
function parseTime(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}
const styles = StyleSheet.create({
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
  infoHint: { color: theme.colors.mutedText, fontSize: 14 },
  infoButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 },
  infoButtonText: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
  infoBody: { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  choice: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  choiceSelected: { borderColor: theme.colors.accent, backgroundColor: '#F0F6F1' },
  pressed: { opacity: 0.8 },
  checkbox: { width: 27, height: 27, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.mutedText, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
  choiceDetail: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 4 },
  field: { marginTop: 16 },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  timeInputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface },
  timeInput: { flex: 1, minHeight: 48, fontSize: 17, color: theme.colors.text },
});

