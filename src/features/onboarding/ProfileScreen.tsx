import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppScreen, FormField, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { createDog, fetchBreeds, fetchOwnedDogById, ownedDogAttributionMatches, type BreedOption, type OwnedDog } from '../../data/app-data';
import { clearSecurePendingReferral, normalizeKennelCode, readSecurePendingReferral } from '../../onboarding-referral/referral-secure-storage';
import { clearDogCreationRequest, getOrCreateDogCreationRequestId, readDogCreationRequestId } from './dog-creation-storage';
import { tokens } from '../../theme/tokens';
import { ageInWeeks, localDate } from './dog';
import type { SupabaseClient } from '@supabase/supabase-js';

export function ProfileScreen({ client, ownerId, accountGeneration, isCurrentAccount, onCreated, mode = 'initial', onCancel }: {
  client: SupabaseClient;
  ownerId: string;
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
  onCreated: (dog: OwnedDog) => void;
  mode?: 'initial' | 'add';
  onCancel?: () => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stackIntro = width < 360 || fontScale >= 1.25;
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedsState, setBreedsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState('');
  const [breedId, setBreedId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'error' | 'unknown' | 'invalidCode' | 'existingProfile' | 'sourceUnconfirmed' | 'recoveryUnavailable' | 'cleanupError'>('idle');
  const [resolvedDog, setResolvedDog] = useState<OwnedDog | null>(null);
  const [resolvedRequestId, setResolvedRequestId] = useState<string | null>(null);
  const [resolvedShouldClearReferral, setResolvedShouldClearReferral] = useState(true);
  const [sourceCheckProblem, setSourceCheckProblem] = useState<'mismatch' | 'unavailable' | 'recovery' | null>(null);
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
    void readDogCreationRequestId(ownerId).then((requestId) => {
      if (active && requestId && isCurrentAccount(ownerId, accountGeneration)) setSaveState('unknown');
    }).catch(() => {
      if (active && isCurrentAccount(ownerId, accountGeneration)) setSaveState('recoveryUnavailable');
    });
    return () => { active = false; };
  }, [accountGeneration, isCurrentAccount, ownerId]);

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

  async function finalizeCreatedDog(dog: OwnedDog, requestId: string, clearReferral = true): Promise<boolean> {
    try {
      await clearDogCreationRequest(ownerId, requestId);
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) {
        setResolvedDog(dog);
        setResolvedRequestId(requestId);
        setResolvedShouldClearReferral(clearReferral);
        setSaveState('cleanupError');
      }
      return false;
    }
    if (!isCurrentAccount(ownerId, accountGeneration)) return false;
    if (clearReferral) await clearSecurePendingReferral().catch(() => undefined);
    if (!isCurrentAccount(ownerId, accountGeneration)) return false;
    onCreated(dog);
    return true;
  }

  async function createAndConfirm() {
    if (operationInFlight.current || !canSubmit) return;
    const desired = { name: name.trim(), breedId, birthDate: birthDate.trim() };
    const referralCode = sourceSelected ? normalizeKennelCode(kennelCode) : null;
    operationInFlight.current = true;
    setBusy(true);
    setSaveState('idle');
    try {
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      let requestId: string;
      let isRecovery = false;
      try {
        const storedRequestId = await readDogCreationRequestId(ownerId);
        isRecovery = storedRequestId !== null;
        requestId = storedRequestId ?? await getOrCreateDogCreationRequestId(ownerId);
      } catch {
        if (isCurrentAccount(ownerId, accountGeneration)) setSaveState('recoveryUnavailable');
        return;
      }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      setResolvedRequestId(requestId);
      let dogId: string;
      try {
        dogId = await createDog(client, { ...desired, kennelCode: referralCode }, requestId);
      } catch (error) {
        if (!isCurrentAccount(ownerId, accountGeneration)) return;
        setSaveState(referralCode && error instanceof Error && /invalid kennel code/i.test(error.message) ? 'invalidCode' : 'unknown');
        return;
      }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      let dog: OwnedDog | null;
      try { dog = await fetchOwnedDogById(client, dogId); } catch { dog = null; }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      if (!dog) { setSaveState('unknown'); return; }
      if (dog.name !== desired.name || dog.breed_id !== desired.breedId || dog.birth_date !== desired.birthDate) {
        setResolvedDog(dog);
        setResolvedShouldClearReferral(false);
        setSaveState('existingProfile');
        return;
      }
      let sourceProblem: typeof sourceCheckProblem = null;
      if (referralCode !== null) {
        try {
          if (referralCode !== null && !await ownedDogAttributionMatches(client, dog.id, referralCode)) {
            sourceProblem = 'mismatch';
          }
        } catch {
          sourceProblem = 'unavailable';
        }
      } else if (isRecovery) {
        sourceProblem = 'recovery';
      }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      if (sourceProblem !== null) {
        setResolvedDog(dog);
        setResolvedRequestId(requestId);
        setResolvedShouldClearReferral(true);
        setSourceCheckProblem(sourceProblem);
        setSaveState('sourceUnconfirmed');
        return;
      }
      setSourceCheckProblem(null);
      await finalizeCreatedDog(dog, requestId);
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  async function openResolvedDog() {
    if (!resolvedDog || !resolvedRequestId || busy || operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true);
    try {
      await finalizeCreatedDog(resolvedDog, resolvedRequestId, resolvedShouldClearReferral);
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  async function startAnotherDog() {
    if (!resolvedDog || !resolvedRequestId || busy || operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true);
    try {
      await clearDogCreationRequest(ownerId, resolvedRequestId);
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      setResolvedDog(null);
      setResolvedRequestId(null);
      setResolvedShouldClearReferral(true);
      setSaveState('idle');
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setSaveState('recoveryUnavailable');
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  function markEdited() {
    setSaveState((current) => current === 'unknown' || current === 'sourceUnconfirmed' ? current : 'idle');
  }

  const canSubmit = name.trim().length > 0 && name.trim().length <= 80 && Boolean(breedId)
    && isValidBirthDate(birthDate) && (!sourceSelected || Boolean(normalizeKennelCode(kennelCode)));

  return (
    <AppScreen>
      <View style={[styles.introCard, stackIntro && styles.introCardStacked]}>
        <View style={styles.introIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="paw-outline" size={tokens.size.iconMd} color={tokens.colors.support.profile.fg} />
        </View>
        <View style={styles.introCopy}>
          <Text accessibilityRole="header" style={styles.introTitle}>{mode === 'add' ? 'Lägg till en hund' : 'Berätta om din hund'}</Text>
          <Text style={styles.introDescription}>{mode === 'add' ? 'Varje hund får en egen profil och innehåll utifrån sin ålder.' : 'Det hjälper oss att visa innehåll som passar just er.'}</Text>
        </View>
      </View>
      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Hundens uppgifter</Text>
      <FormField label="Hundens namn" onChangeText={(value) => { setName(value); markEdited(); }} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel Nala" returnKeyType="done" value={name} />
      <Text style={styles.label} accessibilityRole="header">Ras</Text>
      {breedsState === 'loading' && <MessageCard>Hämtar raslistan…</MessageCard>}
      {breedsState === 'error' && <>
        <MessageCard tone="error">Raslistan gick inte att hämta. Kontrollera anslutningen och försök igen.</MessageCard>
        <View style={styles.breedRetrySpacing}>
          <PrimaryButton title="Försök igen" onPress={() => { setBreedsState('loading'); setBreedAttempt((count) => count + 1); }} />
        </View>
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
      </View>
      <View style={styles.sourceCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Kennelkod (valfritt)</Text>
        <FormField
          editable={!busy}
          autoCapitalize="characters"
          autoComplete="off"
          label="Kennelkod"
          onChangeText={(value) => { setKennelCode(value); markEdited(); }}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder="Skriv koden från kennelns QR"
          returnKeyType="done"
          value={kennelCode}
        />
        <Text style={styles.sourceInfo}>Koden kopplar kennelkälla till din Tassla-profil för uppföljning. Kenneln får inte se dina uppgifter.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: sourceSelected, disabled: busy || !normalizeKennelCode(kennelCode) }} disabled={busy || !normalizeKennelCode(kennelCode)} onPress={() => { setSourceSelected((value) => !value); markEdited(); }} style={styles.sourceChoice}>
          <View style={[styles.checkbox, sourceSelected && styles.checkboxSelected]}>{sourceSelected && <Text style={styles.checkboxMark}>✓</Text>}</View>
          <Text style={styles.sourceChoiceText}>Jag vill koppla koden till min profil</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setKennelCode(''); setSourceSelected(false); markEdited(); void clearSecurePendingReferral().catch(() => undefined); }} style={styles.removeCode}>
          <Text style={styles.removeCodeText}>Ta bort kennelkälla</Text>
        </Pressable>
      </View>
      {sourceSelected && !normalizeKennelCode(kennelCode) && <MessageCard tone="error">Skriv en giltig kennelkod eller ta bort kennelkälla.</MessageCard>}
      {saveState === 'invalidCode' && <MessageCard tone="error">Koden känns inte igen eller är inte aktiv. Rätta den eller ta bort kennelkälla och fortsätt utan.</MessageCard>}
      {saveState === 'existingProfile' && <MessageCard tone="neutral">En tidigare begäran skapade redan {resolvedDog?.name ?? 'en hundprofil'}. Välj om du vill öppna den eller uttryckligen börja med en annan hund.</MessageCard>}
      {saveState === 'sourceUnconfirmed' && <MessageCard tone="neutral">
        {sourceCheckProblem === 'mismatch'
          ? 'Hundprofilen är sparad, men den valda koden matchar inte en bekräftad kennelkoppling.'
          : sourceCheckProblem === 'unavailable'
            ? 'Hundprofilen är sparad, men vi kunde inte kontrollera om en valfri kennelkälla kopplades.'
            : 'Vi kan inte bekräfta om en valfri kennelkälla kopplades vid det tidigare försöket.'}
        {' '}För kontroll igen, använd samma hunduppgifter och välj koden om du vill kontrollera en viss kennelkoppling.
      </MessageCard>}
      {saveState === 'error' && <MessageCard tone="error">Profilen kunde inte sparas. Kontrollera uppgifterna och anslutningen innan du försöker igen.</MessageCard>}
      {saveState === 'unknown' && <MessageCard tone="neutral">Vi kunde inte bekräfta sparandet. Din säkra begäran finns kvar. Fyll i samma uppgifter och försök igen så kontrollerar vi just den hunden.</MessageCard>}
      {saveState === 'recoveryUnavailable' && <MessageCard tone="error">Vi kan inte läsa eller spara den säkra återställningen just nu. Ingen ny hundregistrering skickades.</MessageCard>}
      {saveState === 'cleanupError' && <MessageCard tone="neutral">{resolvedDog?.name ?? 'Hundprofilen'} är sparad. Den lokala återställningsnyckeln kunde inte rensas ännu.</MessageCard>}
      {saveState === 'existingProfile' ? <>
        <PrimaryButton title={busy ? 'Öppnar…' : `Öppna ${resolvedDog?.name ?? 'hundprofilen'}`} disabled={busy || !resolvedDog} onPress={() => { void openResolvedDog(); }} />
        <QuietButton title={busy ? 'Vänta…' : 'Starta en ny hundprofil'} disabled={busy || !resolvedDog} onPress={() => { void startAnotherDog(); }} />
      </> : saveState === 'cleanupError' ? <PrimaryButton title={busy ? 'Kontrollerar…' : `Fortsätt till ${resolvedDog?.name ?? 'hunden'}`} disabled={busy || !resolvedDog} onPress={() => { void openResolvedDog(); }} />
        : saveState === 'sourceUnconfirmed' ? <>
          <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera igen med samma begäran'} disabled={!canSubmit || busy || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />
          <QuietButton title={busy ? 'Vänta…' : `Öppna ${resolvedDog?.name ?? 'hunden'} utan bekräftad kennelkoppling`} disabled={busy || !resolvedDog || !resolvedRequestId} onPress={() => { void openResolvedDog(); }} />
        </>
        : saveState === 'unknown' ? <PrimaryButton title={busy ? 'Kontrollerar…' : 'Försök igen med samma begäran'} disabled={!canSubmit || busy || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />
          : <PrimaryButton title={busy ? 'Sparar…' : saveState === 'recoveryUnavailable' ? 'Försök igen' : mode === 'add' ? 'Lägg till hund' : 'Fortsätt'} disabled={!canSubmit || busy || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />}
      {mode === 'add' && onCancel ? <QuietButton title="Avbryt" disabled={busy} onPress={onCancel} /> : null}
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
  introCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.support.profile.bg },
  introIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface },
  introCopy: { flex: 1, minWidth: 0 },
  introCardStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  introTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  introDescription: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  profileCard: { marginBottom: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm, marginTop: tokens.spacing.xs },
  breedList: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.lg },
  breedRetrySpacing: { marginBottom: tokens.spacing.md },
  breedOption: { minHeight: tokens.size.touchMin, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breedSelected: { borderColor: tokens.colors.support.profile.fg, backgroundColor: tokens.colors.support.profile.bg },
  breedPressed: { opacity: 0.72 },
  breedText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0 },
  breedTextSelected: { color: tokens.colors.support.profile.fg, fontWeight: '700' },
  checkmark: { ...tokens.typography.label, color: tokens.colors.support.profile.fg },
  sourceCard: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, padding: tokens.spacing.md, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.lg },
  sourceInfo: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  sourceChoice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkbox: { width: tokens.size.touchMin / 2, height: tokens.size.touchMin / 2, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary },
  checkboxMark: { ...tokens.typography.label, color: tokens.colors.onPrimary },
  sourceChoiceText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, flexShrink: 1 },
  removeCode: { minHeight: tokens.size.touchMin, justifyContent: 'center', alignSelf: 'flex-start' },
  removeCodeText: { ...tokens.typography.label, color: tokens.colors.danger },
});
