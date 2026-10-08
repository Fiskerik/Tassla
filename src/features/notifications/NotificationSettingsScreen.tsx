import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { InfoModal, MessageCard, PageHeading, QuietButton, TimePickerField } from '../../components/AppPrimitives';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { tokens } from '../../theme/tokens';
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
  const [showSavedToast, setShowSavedToast] = useState(saved);
  const [toastMessage, setToastMessage] = useState<string | null>(saved ? 'Valen är sparade för ditt konto på den här enheten.' : null);
  const [formError, setFormError] = useState('');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const isDirty = enabled !== preferences.enabled
    || trainingEnabled !== preferences.trainingEnabled
    || trainingTime !== formatTime(preferences.trainingMinutes);

  useEffect(() => {
    if (!showSavedToast || !saved || statusError) { setToastMessage(null); return; }
    setToastMessage('Valen är sparade för ditt konto på den här enheten.');
    const timer = setTimeout(() => {
      setShowSavedToast(false);
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [showSavedToast, saved, statusError, preferences]);

  async function save() {
    setFormError('');
    setShowSavedToast(false);
    setToastMessage(null);
    const minutes = parseTime(trainingTime);
    if (minutes === null) {
      setFormError('Ange en tid mellan 00:00 och 23:59.');
      return;
    }
    if (await onSave({ version: 1, enabled, trainingEnabled, trainingMinutes: minutes })) {
      setShowSavedToast(true);
    }
  }

  async function requestPermission() {
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
        <Ionicons name="notifications-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
      </View>
      <View style={styles.heroCopy}>
        <PageHeading title="Påminnelser" description="Välj om Tassla ska schemalägga lokala påminnelser på den här enheten." />
      </View>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoHint}>Om lokala påminnelser</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa information om lokala påminnelser" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
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
    <Choice selected={trainingEnabled} disabled={busy} label="Lägg till en frivillig träningspåminnelse"
      detail={enabled
        ? 'En lokal träningspåminnelse i taget. Nästa tid uppdateras när Tassla öppnas.'
        : trainingEnabled
          ? 'Tasslas påminnelser är av. Tryck för att ta bort träningsvalet.'
          : 'Tryck för att slå på Tasslas påminnelser och lägga till träningspåminnelsen.'}
      accessibilityHint={!enabled && !trainingEnabled ? 'Slår på Tasslas påminnelser på den här enheten och väljer träningspåminnelse.' : undefined}
      onPress={() => {
        if (!enabled && !trainingEnabled) setEnabled(true);
        setTrainingEnabled((value) => !value);
      }} />

    <TimePickerField label="Träningspåminnelse, lokal tid" disabled={busy}
      onChangeText={setTrainingTime} value={trainingTime} />

    {permissionMessage ? <MessageCard tone={permissionState === 'denied' ? 'error' : 'neutral'}>{permissionMessage}</MessageCard> : null}
    <Button variant="secondary" label={permissionBusy ? 'Kontrollerar…' : 'Tillåt påminnelser på telefonen'}
      accessibilityLabel={permissionBusy ? 'Kontrollerar tillåtelse för notiser' : 'Tillåt påminnelser på telefonen'}
      loading={permissionBusy} disabled={busy || permissionBusy} onPress={() => { void requestPermission(); }} />
    {permissionState === 'granted' && <MessageCard>Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.</MessageCard>}
    {permissionState === 'denied' && <MessageCard tone="error">Enheten nekar notiser. Appen fungerar fortfarande.</MessageCard>}
    {statusMessage && statusError ? <MessageCard tone="error">{statusMessage}</MessageCard> : null}
    {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
    {toastMessage && showSavedToast && saved && !statusError && !isDirty
      ? <Toast tone="success" confirmed message={toastMessage} /> : null}
    <Button label={busy ? 'Sparar…' : 'Spara val'} accessibilityLabel={busy ? 'Sparar val' : 'Spara val'}
      loading={busy} disabled={busy} onPress={() => { void save(); }} />
  </View>;
}

function Choice({ selected, disabled, label, detail, accessibilityHint, onPress }: {
  selected: boolean; disabled: boolean; label: string; detail: string; accessibilityHint?: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityHint={accessibilityHint}
    accessibilityState={{ checked: selected, disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && !disabled && styles.pressed]}>
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
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
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs },
  infoHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  infoBody: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.sm, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.selectedSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  icon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  choice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.listGap, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.md, marginTop: tokens.layout.listGap, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  choiceSelected: { backgroundColor: tokens.colors.selectedSurface },
  pressed: { opacity: 0.9 },
  checkbox: { width: tokens.size.iconMd, height: tokens.size.iconMd, borderRadius: tokens.radius.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary },
  choiceCopy: { flex: 1 },
  choiceTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  choiceDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.layout.headingGap },
});

