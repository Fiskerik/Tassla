import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen, FormField, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { createDog, fetchBreeds, fetchOwnedDog, type BreedOption, type OwnedDog } from '../../data/app-data';
import { tokens } from '../../theme/tokens';
import { ageInWeeks, localDate } from './dog';
import type { SupabaseClient } from '@supabase/supabase-js';

export function ProfileScreen({ client, onCreated }: { client: SupabaseClient; onCreated: (dog: OwnedDog) => void }) {
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedsState, setBreedsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState('');
  const [breedId, setBreedId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'error' | 'unknown'>('idle');
  const operationInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((options) => {
      if (!active) return;
      setBreeds(options);
      setBreedId((current) => current || options[0]?.id || '');
      setBreedsState('ready');
    }).catch(() => {
      if (active) setBreedsState('error');
    });
    return () => { active = false; };
  }, [breedAttempt, client]);

  async function checkExistingDog(): Promise<boolean> {
    try {
      const dog = await fetchOwnedDog(client);
      if (dog) {
        onCreated(dog);
        return true;
      }
      setSaveState('error');
    } catch {
      setSaveState('unknown');
    }
    return false;
  }

  async function submitProfile() {
    if (operationInFlight.current || !canSubmit) return;
    operationInFlight.current = true;
    setBusy(true);
    setSaveState('idle');
    let createFailed = false;
    try {
      try {
        await createDog(client, { name: name.trim(), breedId, birthDate: birthDate.trim() });
      } catch {
        createFailed = true;
      }

      const found = await checkExistingDog();
      if (!found && !createFailed) setSaveState('unknown');
    } finally {
      operationInFlight.current = false;
      setBusy(false);
    }
  }

  async function checkSaveStatus() {
    if (operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true);
    try {
      await checkExistingDog();
    } finally {
      operationInFlight.current = false;
      setBusy(false);
    }
  }

  function markEdited() {
    setSaveState((current) => current === 'unknown' ? 'unknown' : 'idle');
  }

  const canSubmit = name.trim().length > 0 && name.trim().length <= 80 && Boolean(breedId)
    && isValidBirthDate(birthDate);

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
      {saveState === 'error' && <MessageCard tone="error">Profilen kunde inte sparas. Kontrollera uppgifterna och anslutningen innan du försöker igen.</MessageCard>}
      {saveState === 'unknown' && <MessageCard tone="error">Sparstatus är okänd. Kontrollera först om profilen redan finns.</MessageCard>}
      {saveState === 'unknown'
        ? <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera sparstatus'} disabled={busy} onPress={() => { void checkSaveStatus(); }} />
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
});
