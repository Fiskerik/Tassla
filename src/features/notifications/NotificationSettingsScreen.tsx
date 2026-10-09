import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InfoModal, MessageCard } from '../../components/AppPrimitives';
import { Button, CheckboxCard, Field } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
import { tokens } from '../../theme/tokens';
import type { NotificationPreferences } from '../../notifications/notification-model';

export function NotificationSettingsScreen({
  preferences, saved, busy, statusMessage, statusError, permissionState, onSave, onRequestPermission,
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
        ? 'Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.'
        : result === 'denied' ? 'Enhetens tillstånd nekar notiser. Du kan ändra detta i enhetsinställningarna.'
          : 'Tillståndet kunde inte kontrolleras för den här sessionen.');
    } catch {
      setPermissionMessage('Tillståndet kunde inte kontrolleras. Försök igen.');
    } finally {
      setPermissionBusy(false);
    }
  }

  const statusLine = permissionMessage || (permissionState === 'granted'
    ? 'Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras.'
    : permissionState === 'denied' ? 'Enheten nekar notiser. Appen fungerar fortfarande.' : '');
  const errorMessage = formError || (statusError ? statusMessage : '');

  return <View style={styles.screen}>
    <View style={styles.intro}>
      <Text style={styles.description}>Välj om Tassla ska schemalägga lokala påminnelser på den här enheten.</Text>
      <Text style={styles.infoHint}>Om lokala påminnelser</Text>
      <Button variant="tertiary" label="Läs information" accessibilityLabel="Visa information om lokala påminnelser" onPress={() => setInfoVisible(true)} />
    </View>
    <InfoModal visible={infoVisible} title="Om lokala påminnelser" onClose={() => setInfoVisible(false)}>
      <Text style={styles.infoBody}>Påminnelser är av från början. Enhetens tillstånd och ditt val här är separata.</Text>
      <Text style={styles.infoBody}>Låsskärmen visar bara en generell text. Påminnelser är inte en bekräftelse på leverans.</Text>
    </InfoModal>

    <View style={styles.group}>
      <CheckboxCard checked={enabled} disabled={busy} label="Tillåt Tasslas påminnelser på den här enheten" onChange={setEnabled} />
      <CheckboxCard checked={trainingEnabled} disabled={busy} label="Lägg till en frivillig träningspåminnelse" onChange={(checked) => { if (!enabled && checked) setEnabled(true); setTrainingEnabled(checked); }} />
    </View>

    <Field label="Träningspåminnelse, lokal tid" state={busy ? 'disabled' : 'default'} kind="time"
      onChangeText={setTrainingTime} value={trainingTime} />

    <View style={styles.group}>
      <Button variant="secondary" label={permissionBusy ? 'Kontrollerar…' : 'Tillåt påminnelser på telefonen'}
      accessibilityLabel={permissionBusy ? 'Kontrollerar tillåtelse för notiser' : 'Tillåt påminnelser på telefonen'}
      loading={permissionBusy} disabled={busy || permissionBusy} onPress={() => { void requestPermission(); }} />
      {statusLine ? <Text style={styles.statusLine}>{statusLine}</Text> : null}
    </View>
    {errorMessage ? <MessageCard tone="error">{errorMessage}</MessageCard> : null}
    {toastMessage && showSavedToast && saved && !statusError && !isDirty
      ? <Toast tone="success" confirmed message={toastMessage} /> : null}
    <Button variant="primary" label={busy ? 'Sparar…' : 'Spara val'} accessibilityLabel={busy ? 'Sparar val' : 'Spara val'}
      loading={busy} disabled={busy} onPress={() => { void save(); }} />
  </View>;
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
  screen: { gap: tokens.spacing.lg },
  intro: { gap: tokens.spacing.sm },
  description: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  infoHint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  infoBody: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  group: { gap: tokens.layout.sectionGap },
  statusLine: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});

