import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen, FormField, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { createDog, fetchBreeds, fetchOwnedDog, ownedDogAttributionMatches, type BreedOption, type OwnedDog } from '../../data/app-data';
import { clearSecurePendingReferral, normalizeKennelCode, readSecurePendingReferral } from '../../onboarding-referral/referral-secure-storage';
import { tokens } from '../../theme/tokens';
import { ageInWeeks, localDate } from './dog';
import type { SupabaseClient } from '@supabase/supabase-js';

export function ProfileScreen({ client, ownerId, accountGeneration, isCurrentAccount, onCreated }: {
  client: SupabaseClient;
  ownerId: string;
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
  onCreated: (dog: OwnedDog) => void;
}) {
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedsState, setBreedsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState('');
  const [breedId, setBreedId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'error' | 'unknown' | 'invalidCode' | 'existingProfile'>('idle');
  const [kennelCode, setKennelCode] = useState('');
  const [sourceSelected, setSourceSelected] = useState(false);
  const operationInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    void readSecurePendingReferral().then((referral) => {
      if (active && referral) setKennelCode(referral.code);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((options) => {
      if (!active || !isCurrentAccount(ownerId, accountGeneration)) return;
      setBreeds(options);
      setBreedId((current) => current || options[0]?.id || '');
      setBreedsState('ready');
    }).catch(() => {
      if (active && isCurrentAccount(ownerId, accountGeneration)) setBreedsState('error');
    });
    return () => { active = false; };
  }, [accountGeneration, breedAttempt, client, isCurrentAccount, ownerId]);

  async function checkExistingDog(expected: { name: string; breedId: string; birthDate: string }, referralCode: string | null, expectedDogId?: string): Promise<boolean> {
    try {
      const dog = await fetchOwnedDog(client);
      if (!isCurrentAccount(ownerId, accountGeneration)) return false;
      if (dog) {
        if (expectedDogId && dog.id !== expectedDogId) {
          setSaveState('unknown');
          return false;
        }
        if (dog.name !== expected.name || dog.breed_id !== expected.breedId || dog.birth_date !== expected.birthDate) {
          setSaveState('existingProfile');
          return false;
        }
        if (referralCode !== null && !await ownedDogAttributionMatches(client, dog.id, referralCode)) {
          setSaveState('unknown');
          return false;
        }
        if (!isCurrentAccount(ownerId, accountGeneration)) return false;
        await clearSecurePendingReferral().catch(() => undefined);
        if (!isCurrentAccount(ownerId, accountGeneration)) return false;
        onCreated(dog);
        return true;
      }
      setSaveState('error');
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setSaveState('unknown');
    }
    return false;
  }

  async function submitProfile() {
    if (operationInFlight.current || !canSubmit) return;
    const desired = { name: name.trim(), breedId, birthDate: birthDate.trim() };
    const referralCode = sourceSelected ? normalizeKennelCode(kennelCode) : null;
    operationInFlight.current = true;
    setBusy(true);
    setSaveState('idle');
    let createFailed = false;
    let invalidReferral = false;
    let createdDogId: string | undefined;
    try {
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      try {
        createdDogId = await createDog(client, { ...desired, kennelCode: referralCode });
      } catch (error) {
        if (!isCurrentAccount(ownerId, accountGeneration)) return;
        createFailed = true;
        if (referralCode && error instanceof Error && /invalid kennel code/i.test(error.message)) {
          invalidReferral = true;
        }
      }

      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      const found = await checkExistingDog(desired, referralCode, createdDogId);
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      if (!found && invalidReferral) setSaveState('invalidCode');
      else if (!found && createFailed) setSaveState('unknown');
      if (!found && !createFailed) setSaveState('unknown');
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  async function checkSaveStatus() {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true);
    try {
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      await checkExistingDog({ name: name.trim(), breedId, birthDate: birthDate.trim() }, sourceSelected ? normalizeKennelCode(kennelCode) : null);
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  function markEdited() {
    setSaveState((current) => current === 'unknown' ? 'unknown' : 'idle');
  }

  const canSubmit = name.trim().length > 0 && name.trim().length <= 80 && Boolean(breedId)
    && isValidBirthDate(birthDate) && (!sourceSelected || Boolean(normalizeKennelCode(kennelCode)));

  return (
    <AppScreen>
      <PageHeading
        title="Berätta om din hund"
        description="Det hjälper oss att visa innehåll som passar just er."
      />
      <FormField label="Hundens namn" onChangeText={(value) => { setName(value); markEdited(); }} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel Nala" returnKeyType="done" value={name} />
      <Text style={styles.label} accessibilityRole="header">Ras</Text>
      {breedsState === 'loading' && <MessageCard>Hämtar raslistan…</MessageCard>}
      {breedsState === 'error' && <>
        <MessageCard tone="error">Raslistan gick inte att hämta. Kontrollera anslutningen och försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { setBreedsState('loading'); setBreedAttempt((count) => count + 1); }} />
      </>}
      {breedsState === 'ready' && (
        <View accessibilityRole="radiogroup" accessibilityLabel="Välj hundras" style={styles.breedList}>
          {breeds.map((breed) => {
            const selected = breedId === breed.id;
            return (
              <Pressable
                key={breed.id}
                accessibilityRole="radio"
                accessibilityLabel={breed.name}
                accessibilityState={{ selected }}
                onPress={() => { setBreedId(breed.id); markEdited(); }}
                style={({ pressed }) => [styles.breedOption, selected && styles.breedSelected, pressed && styles.breedPressed]}
              >
                <Text style={[styles.breedText, selected && styles.breedTextSelected]}>{breed.name}</Text>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
      <FormField
        autoCapitalize="none"
        autoComplete="off"
        label="Födelsedatum"
        onChangeText={(value) => { setBirthDate(value); markEdited(); }}
        onSubmitEditing={() => Keyboard.dismiss()}
        placeholder="ÅÅÅÅ-MM-DD"
        returnKeyType="done"
        value={birthDate}
      />
      <View style={styles.sourceCard}>
        <Text style={styles.label} accessibilityRole="header">Kennelkod (valfritt)</Text>
        <FormField
          editable={!busy}
          autoCapitalize="characters"
          autoComplete="off"
          label="Kennelkod"
          onChangeText={(value) => { setKennelCode(value); setSaveState('idle'); }}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder="Skriv koden från kennelns QR"
          returnKeyType="done"
          value={kennelCode}
        />
        <Text style={styles.sourceInfo}>Koden kopplar kennelkälla till din Tassla-profil för uppföljning. Kenneln får inte se dina uppgifter.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: sourceSelected, disabled: busy || !normalizeKennelCode(kennelCode) }} disabled={busy || !normalizeKennelCode(kennelCode)} onPress={() => { setSourceSelected((value) => !value); setSaveState('idle'); }} style={styles.sourceChoice}>
          <View style={[styles.checkbox, sourceSelected && styles.checkboxSelected]}>{sourceSelected && <Text style={styles.checkboxMark}>✓</Text>}</View>
          <Text style={styles.sourceChoiceText}>Jag vill koppla koden till min profil</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setKennelCode(''); setSourceSelected(false); setSaveState('idle'); void clearSecurePendingReferral().catch(() => undefined); }} style={styles.removeCode}>
          <Text style={styles.removeCodeText}>Ta bort kennelkälla</Text>
        </Pressable>
      </View>
      {sourceSelected && !normalizeKennelCode(kennelCode) && <MessageCard tone="error">Skriv en giltig kennelkod eller ta bort kennelkälla.</MessageCard>}
      {saveState === 'invalidCode' && <MessageCard tone="error">Koden känns inte igen eller är inte aktiv. Rätta den eller ta bort kennelkälla och fortsätt utan.</MessageCard>}
      {saveState === 'existingProfile' && <MessageCard tone="error">En annan hundprofil finns redan på kontot. Den ändras inte här.</MessageCard>}
      {saveState === 'error' && <MessageCard tone="error">Profilen kunde inte sparas. Kontrollera uppgifterna och anslutningen innan du försöker igen.</MessageCard>}
      {saveState === 'unknown' && <MessageCard tone="error">Vi kunde inte kontrollera om profilen sparades. Kontrollera om den redan finns innan du försöker igen.</MessageCard>}
      {saveState === 'unknown'
        ? <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera om profilen finns'} disabled={busy} onPress={() => { void checkSaveStatus(); }} />
        : <PrimaryButton title={busy ? 'Sparar…' : 'Fortsätt'} disabled={!canSubmit || busy || breedsState !== 'ready'} onPress={() => { void submitProfile(); }} />}
    </AppScreen>
  );
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  try {
    ageInWeeks(value.trim(), localDate());
    return true;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm, marginTop: tokens.spacing.xs },
  breedList: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  breedOption: { minHeight: tokens.size.touchMin, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breedSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  breedPressed: { opacity: 0.72 },
  breedText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  breedTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
  checkmark: { ...tokens.typography.label, color: tokens.colors.primary },
  sourceCard: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, padding: tokens.spacing.md, marginBottom: tokens.spacing.lg },
  sourceInfo: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  sourceChoice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkbox: { width: tokens.size.touchMin / 2, height: tokens.size.touchMin / 2, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary },
  checkboxMark: { ...tokens.typography.label, color: tokens.colors.onPrimary },
  sourceChoiceText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flexShrink: 1 },
  removeCode: { minHeight: tokens.size.touchMin, justifyContent: 'center', alignSelf: 'flex-start' },
  removeCodeText: { ...tokens.typography.label, color: tokens.colors.danger },
});
