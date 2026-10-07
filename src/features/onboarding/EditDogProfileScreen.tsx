import { useEffect, useState } from 'react';
import { Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActionFeedbackModal, DatePickerField, MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import {
  fetchBreeds,
  isValidDogBirthDate,
  normalizeDogProfileName,
  type BreedOption,
  type OwnedDog,
  type OwnedDogProfileChanges,
} from '../../data/app-data';
import { theme } from '../../theme/tokens';

export function EditDogProfileScreen({
  client,
  dog,
  busy = false,
  pending = false,
  statusMessage = '',
  statusError = false,
  conflict,
  onBack,
  onSave,
  onRetryStatus,
  onAcceptCurrent,
}: {
  client: SupabaseClient;
  dog: OwnedDog;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  conflict?: OwnedDog | null;
  onBack: () => void;
  onSave: (changes: OwnedDogProfileChanges, knownBreeds: readonly BreedOption[]) => Promise<boolean>;
  onRetryStatus: () => void;
  onAcceptCurrent: () => void;
}) {
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedState, setBreedState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState(dog.name);
  const [breedId, setBreedId] = useState(dog.breed_id);
  const [birthDate, setBirthDate] = useState(dog.birth_date);
  const [formError, setFormError] = useState('');
  const [dismissedStatus, setDismissedStatus] = useState('');
  const blocked = busy || pending;

  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((options) => {
      if (!active) return;
      setBreeds(options);
      setBreedState('ready');
    }).catch(() => {
      if (active) setBreedState('error');
    });
    return () => { active = false; };
  }, [breedAttempt, client]);

  async function save() {
    setDismissedStatus('');
    setFormError('');
    const normalizedName = normalizeDogProfileName(name);
    if (!normalizedName) {
      setFormError('Ange ett namn med 1–80 tecken.');
      return;
    }
    if (breedState !== 'ready' || !breeds.some((breed) => breed.id === breedId)) {
      setFormError('Välj en ras från listan.');
      return;
    }
    const normalizedDate = birthDate.trim();
    if (!isValidDogBirthDate(normalizedDate)) {
      setFormError('Ange ett giltigt födelsedatum som inte ligger i framtiden.');
      return;
    }
    const changes: OwnedDogProfileChanges = { name: normalizedName, breed_id: breedId, birth_date: normalizedDate };
    await onSave(changes, breeds);
  }

  const currentBreed = breeds.find((breed) => breed.id === dog.breed_id)?.name ?? dog.breed_id;
  const conflictBreed = conflict ? breeds.find((breed) => breed.id === conflict.breed_id)?.name ?? conflict.breed_id : '';
  const draftDiffers = name.trim() !== dog.name || breedId !== dog.breed_id || birthDate.trim() !== dog.birth_date;
  const showStatusMessage = Boolean(statusMessage) && (statusError || pending || busy);

  return <View>
    <QuietButton title="Tillbaka till Mer" disabled={busy} onPress={onBack} />
    <View style={styles.heroCard}>
      <View style={styles.heroCopy}>
        <PageHeading title="Hundprofil" description="Håll namn, ras och födelsedatum uppdaterade för innehåll som passar er." />
      </View>
      <Image source={require('../../../assets/images/dog-resting.png')} style={styles.heroImage}
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </View>
    <View style={styles.profileNote}>
      <Ionicons name="paw-outline" size={19} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={styles.profileNoteText}>Hundens historik och träningssteg följer med när du rättar profilen.</Text>
    </View>
    {showStatusMessage ? <MessageCard tone={statusError ? 'error' : 'neutral'}>{statusMessage}</MessageCard> : null}
    {draftDiffers && !pending && !busy ? <MessageCard tone="neutral">Ändringarna är inte sparade.</MessageCard> : null}
    {pending && <>
      <MessageCard tone="error">Ändringen väntar på en säker statuskontroll. Den finns kvar även om du lämnar den här sidan.</MessageCard>
      <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera sparstatus'} disabled={busy} onPress={onRetryStatus} />
    </>}
    {conflict && <View style={styles.conflictCard}>
      <Text style={styles.conflictTitle} accessibilityRole="header">Aktuella sparade uppgifter</Text>
      <Text style={styles.conflictText}>{conflict.name} · {conflictBreed} · {conflict.birth_date}</Text>
      <Text style={styles.conflictBody}>En annan ändring har sparats. Granska uppgifterna och använd den senaste versionen innan du börjar om.</Text>
      <PrimaryButton title={busy ? 'Hämtar…' : 'Använd aktuell profil'} disabled={busy} onPress={onAcceptCurrent} />
    </View>}
    <View style={styles.formCard}>
      <Text style={styles.formTitle} accessibilityRole="header">Hundens uppgifter</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Hundens namn</Text>
        <TextInput accessibilityLabel="Hundens namn" autoCapitalize="words" editable={!blocked}
          onChangeText={setName} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel Nala"
          placeholderTextColor={theme.colors.mutedText} returnKeyType="done" style={styles.input} value={name} />
      </View>
      <Text style={styles.label}>Ras</Text>
      {breedState === 'loading' && <MessageCard>Hämtar raslistan…</MessageCard>}
      {breedState === 'error' && <>
        <MessageCard tone="error">Raslistan kunde inte hämtas. Profilen är kvar och inget har sparats.</MessageCard>
        <PrimaryButton title="Hämta raslistan igen" disabled={busy} onPress={() => { setBreedState('loading'); setBreedAttempt((attempt) => attempt + 1); }} />
      </>}
      {breedState === 'ready' && <View accessibilityRole="radiogroup" accessibilityLabel="Välj hundras" style={styles.breedList}>
        {breeds.map((breed) => {
          const selected = breed.id === breedId;
          return <Pressable key={breed.id} accessibilityRole="radio" accessibilityLabel={breed.name}
            accessibilityState={{ selected, disabled: blocked }} disabled={blocked} onPress={() => setBreedId(breed.id)}
            style={({ pressed }) => [styles.breedOption, selected && styles.breedSelected, pressed && !blocked && styles.breedPressed]}>
            <Text style={[styles.breedText, selected && styles.breedTextSelected]}>{breed.name}</Text>
            {selected && <Ionicons name="checkmark-circle" size={21} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
          </Pressable>;
        })}
        {!breeds.some((breed) => breed.id === dog.breed_id) && <MessageCard>Nuvarande ras ({currentBreed}) finns inte i listan. Välj en ras om du vill ändra profilen.</MessageCard>}
      </View>}
      <DatePickerField label="Födelsedatum" disabled={blocked} onChangeText={setBirthDate} value={birthDate} />
      {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
      <PrimaryButton title={busy ? 'Sparar…' : statusError && !pending ? 'Försök igen' : 'Spara profil'}
        disabled={blocked || breedState !== 'ready'} onPress={() => { void save(); }} />
      {statusMessage && !statusError && !pending ? <ActionFeedbackModal visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)} /> : null}
    </View>
    <QuietButton title="Avbryt" disabled={busy} onPress={onBack} />
  </View>;
}

const styles = StyleSheet.create({
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border },
  heroCopy: { flex: 1 },
  heroImage: { width: 56, height: 56, borderRadius: 28 },
  profileNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 14, marginTop: 10, borderRadius: theme.radius.card, backgroundColor: '#EAF2EC' },
  profileNoteText: { flex: 1, color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  conflictCard: { marginTop: 12, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' },
  conflictTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  conflictText: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 8 },
  conflictBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginVertical: 8 },
  formCard: { marginTop: 17, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  formTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 15 },
  field: { marginBottom: 14 },
  label: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 54, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 },
  breedList: { gap: 8, marginBottom: 17 },
  breedOption: { minHeight: 50, borderRadius: theme.radius.button, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breedSelected: { borderColor: theme.colors.accent, backgroundColor: '#E5EFE8' },
  breedPressed: { opacity: 0.75 },
  breedText: { color: theme.colors.text, fontSize: 16 },
  breedTextSelected: { color: theme.colors.accent, fontWeight: '700' },
  dateWrap: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  dateInput: { flex: 1, paddingVertical: 10, color: theme.colors.text, fontSize: 17 },
});
