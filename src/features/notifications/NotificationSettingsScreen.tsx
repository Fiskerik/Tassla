import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { InfoModal, MessageCard, TimePickerField } from '../../components/AppPrimitives';
import { SupportScreenHeader } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { tokens } from '../../theme/tokens';
import type { NotificationPreferences } from '../../notifications/notification-model';
import { formatReminderTime, isReminderPreferencesDraftDirty, parseReminderTime, type ReminderPreferencesDraft } from './reminder-preferences-draft';

export function NotificationSettingsScreen({
  onBack, preferences, saved, busy, statusMessage, statusError, permissionState, onSave, onRequestPermission, registerEditorLeaveGuard,
}: {
  onBack: () => void;
  registerEditorLeaveGuard?: (owner: symbol, requestLeave: (commit: () => void) => void) => () => void;
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
  const [trainingTime, setTrainingTime] = useState(formatReminderTime(preferences.trainingMinutes));
  const [showSavedToast, setShowSavedToast] = useState(saved);
  const [toastMessage, setToastMessage] = useState<string | null>(saved ? 'Valen är sparade för ditt konto på den här enheten.' : null);
  const [toastVisible, setToastVisible] = useState(saved);
  const [formError, setFormError] = useState('');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const [saveInFlight, setSaveInFlight] = useState(false);
  const saveInFlightRef = useRef(false);
  const editorOwnerToken = useRef(Symbol('reminder-settings'));
  const leaveAlertOpen = useRef(false);
  const dirtyDraft: ReminderPreferencesDraft = { enabled, trainingEnabled, trainingTime };
  const isDirty = isReminderPreferencesDraftDirty(preferences, dirtyDraft);
  const dirtyDraftRef = useRef(isDirty);
  const onBackRef = useRef(onBack);

  useLayoutEffect(() => { dirtyDraftRef.current = isDirty; }, [isDirty]);
  useLayoutEffect(() => { onBackRef.current = onBack; }, [onBack]);

  const requestLeave = useCallback((commit: () => void) => {
    if (saveInFlightRef.current || leaveAlertOpen.current) return;
    if (!dirtyDraftRef.current) { commit(); return; }
    leaveAlertOpen.current = true;
    Alert.alert('Osparade ändringar', 'Vill du lämna utan att spara?', [
      { text: 'Stanna kvar', style: 'cancel', onPress: () => { leaveAlertOpen.current = false; } },
      { text: 'Lämna utan att spara', style: 'destructive', onPress: () => {
        leaveAlertOpen.current = false;
        commit();
      } },
    ], { cancelable: true, onDismiss: () => { leaveAlertOpen.current = false; } });
  }, []);
  const requestLeaveRef = useRef(requestLeave);
  useLayoutEffect(() => { requestLeaveRef.current = requestLeave; }, [requestLeave]);
  const requestBack = useCallback(() => requestLeaveRef.current(() => onBackRef.current()), []);

  useEffect(() => {
    if (!registerEditorLeaveGuard) return undefined;
    return registerEditorLeaveGuard(editorOwnerToken.current, (commit) => requestLeaveRef.current(commit));
  }, [registerEditorLeaveGuard]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [requestBack]);

  useEffect(() => {
    // Reset the transient toast when the persisted save status changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!showSavedToast || !saved || statusError) { setToastVisible(false); return; }
    setToastMessage('Valen är sparade för ditt konto på den här enheten.');
  }, [showSavedToast, saved, statusError, preferences]);

  async function save() {
    setFormError('');
    setShowSavedToast(false);
    setToastVisible(false);
    const minutes = parseReminderTime(trainingTime);
    if (minutes === null) {
      setFormError('Ange en tid mellan 00:00 och 23:59.');
      return;
    }
    if (busy || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setSaveInFlight(true);
    try {
      if (await onSave({ version: 1, enabled, trainingEnabled, trainingMinutes: minutes })) {
        setShowSavedToast(true);
        setToastMessage('Valen är sparade för ditt konto på den här enheten.');
        setToastVisible(true);
      }
    } catch {
      setFormError('Valen kunde inte sparas säkert. Försök igen.');
    } finally {
      saveInFlightRef.current = false;
      setSaveInFlight(false);
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
    <SupportScreenHeader title="Påminnelser" backLabel="Tillbaka till Mer" accent="reminders" disabled={saveInFlight} onBack={requestBack} />
    <View style={styles.hero}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="notifications-outline" size={tokens.size.iconMd} color={tokens.colors.support.reminders.fg} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.intro}>Välj om Tassla ska schemalägga lokala påminnelser på den här enheten.</Text>
      </View>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.infoHint}>Om lokala påminnelser</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa information om lokala påminnelser" onPress={() => setInfoVisible(true)} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.support.reminders.fg} />
        <Text style={styles.infoButtonText}>Läs information</Text>
      </Pressable>
    </View>
    <InfoModal visible={infoVisible} title="Om lokala påminnelser" onClose={() => setInfoVisible(false)}>
      <Text style={styles.infoBody}>Påminnelser är av från början. Enhetens tillstånd och ditt val här är separata.</Text>
      <Text style={styles.infoBody}>Låsskärmen visar bara en generell text. Påminnelser är inte en bekräftelse på leverans.</Text>
    </InfoModal>

    <View style={styles.settingsCard}>
    <Text style={styles.sectionTitle} accessibilityRole="header">Dina val</Text>
    <Choice selected={enabled} disabled={busy || saveInFlight} label="Tillåt Tasslas påminnelser på den här enheten"
      detail="Avbokar Tasslas egna påminnelser när du stänger av. Dina planval sparas."
      onPress={() => setEnabled((value) => !value)} />
    <Choice selected={trainingEnabled} disabled={busy || saveInFlight} label="Lägg till en frivillig träningspåminnelse"
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

    <TimePickerField label="Träningspåminnelse, lokal tid" disabled={busy || saveInFlight}
      onChangeText={setTrainingTime} value={trainingTime} />

    {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
    {statusMessage && statusError ? <MessageCard tone="error">{statusMessage}</MessageCard> : null}
    <Button label={saveInFlight ? 'Sparar…' : 'Spara val'} accessibilityLabel={saveInFlight ? 'Sparar val' : 'Spara val'}
      loading={saveInFlight} disabled={busy || saveInFlight} onPress={() => { void save(); }} />
    </View>

    <View style={styles.permissionCard}>
    <Text style={styles.sectionTitle} accessibilityRole="header">Enhetens behörighet</Text>
    {permissionMessage ? <MessageCard tone={permissionState === 'denied' ? 'error' : 'neutral'}>{permissionMessage}</MessageCard> : null}
    <Button variant="secondary" label={permissionBusy ? 'Kontrollerar…' : 'Tillåt påminnelser på telefonen'}
      accessibilityLabel={permissionBusy ? 'Kontrollerar tillåtelse för notiser' : 'Tillåt påminnelser på telefonen'}
      loading={permissionBusy} disabled={busy || saveInFlight || permissionBusy} onPress={() => { void requestPermission(); }} />
    {permissionState === 'granted' && <MessageCard>Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.</MessageCard>}
    {permissionState === 'denied' && <MessageCard tone="error">Enheten nekar notiser. Appen fungerar fortfarande.</MessageCard>}
    </View>
    <Toast visible={toastVisible && showSavedToast && saved && !statusError && !isDirty} tone="success" confirmed message={toastMessage ?? undefined}
      autoDismissMs={2500} onAutoDismiss={() => { setToastVisible(false); setShowSavedToast(false); }} onExitComplete={() => setToastMessage(null)} />
  </View>;
}

function Choice({ selected, disabled, label, detail, accessibilityHint, onPress }: {
  selected: boolean; disabled: boolean; label: string; detail: string; accessibilityHint?: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityHint={accessibilityHint}
    accessibilityState={{ checked: selected, disabled }} aria-checked={selected} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && !disabled && styles.pressed]}>
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.onPrimary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
    </View>
    <View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{label}</Text><Text style={styles.choiceDetail}>{detail}</Text></View>
  </Pressable>;
}
const styles = StyleSheet.create({
  intro: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs },
  infoHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  infoButton: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingHorizontal: tokens.spacing.sm },
  infoButtonText: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  infoBody: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.sm, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.reminders.bg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border },
  icon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  settingsCard: { marginTop: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, gap: tokens.spacing.sm },
  permissionCard: { marginTop: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.home.card, gap: tokens.spacing.sm },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.xs },
  choice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.layout.listGap, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.md, marginTop: tokens.layout.listGap, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  choiceSelected: { backgroundColor: tokens.colors.support.reminders.bg, borderColor: tokens.colors.support.reminders.fg },
  pressed: { opacity: 0.9 },
  checkbox: { width: tokens.size.iconMd, height: tokens.size.iconMd, borderRadius: tokens.radius.sm, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: tokens.colors.support.reminders.fg, borderColor: tokens.colors.support.reminders.fg },
  choiceCopy: { flex: 1 },
  choiceTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  choiceDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.layout.headingGap },
});
