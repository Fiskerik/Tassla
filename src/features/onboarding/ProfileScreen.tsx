import { DogArticleProfileFields } from './DogArticleProfileFields';
import { validCalendarDate, type DogSex } from '../../content/article-targeting';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppScreen, DatePickerField, FormField, InfoModal, MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { Button, Dialog } from '../../components/ui';
import { createDog, fetchBreeds, fetchOwnedDogById, ownedDogAttributionMatches, RetiredDogCreationRequestError, type BreedOption, type OwnedDog } from '../../data/app-data';
import { clearSecurePendingReferral, normalizeKennelCode, readSecurePendingReferral } from '../../onboarding-referral/referral-secure-storage';
import { clearDogCreationRequest, getOrCreateDogCreationRequestId, readDogCreationRequestId } from './dog-creation-storage';
import { tokens } from '../../theme/tokens';
import { ageInWeeks, localDate } from './dog';
import { BreedPickerField } from './BreedPickerField';
import { profileRecoveryRequestMatches } from './profile-exit';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DogCreationSaveState = 'idle' | 'error' | 'unknown' | 'invalidCode' | 'existingProfile' | 'sourceUnconfirmed' | 'recoveryUnavailable' | 'cleanupError' | 'retiredRequest';
export type DogCreationEntryPoint = 'home' | 'settings';
export type DogCreationRecoverySnapshot = {
  ownerId: string;
  accountGeneration: number;
  entryPoint: DogCreationEntryPoint;
  draft: { expectedHomecomingDate?: string; sex?: DogSex | null; name: string; breedId: string; birthDate: string; kennelCode: string; sourceSelected: boolean };
  saveState: DogCreationSaveState;
  resolvedDog: OwnedDog | null;
  resolvedRequestId: string | null;
  resolvedShouldClearReferral: boolean;
  sourceCheckProblem: 'mismatch' | 'unavailable' | 'recovery' | null;
};

export function ProfileScreen({ client, ownerId, accountGeneration, isCurrentAccount, onCreated, mode = 'initial', onCancel,
  entryPoint = 'home', recoverySnapshot, onClearRecoverySnapshot }: {
  client: SupabaseClient;
  ownerId: string;
  accountGeneration: number;
  isCurrentAccount(ownerId: string, generation: number): boolean;
  onCreated: (dog: OwnedDog) => void;
  mode?: 'initial' | 'add';
  entryPoint?: DogCreationEntryPoint;
  recoverySnapshot?: DogCreationRecoverySnapshot | null;
  onCancel?: (result: { kind: 'discard' } | { kind: 'resume'; snapshot: DogCreationRecoverySnapshot }) => void;
  onClearRecoverySnapshot?: () => void;
}) {
  const validRecoverySnapshot = recoverySnapshot?.ownerId === ownerId && recoverySnapshot.accountGeneration === accountGeneration
    ? recoverySnapshot : null;
  const initialDraft = validRecoverySnapshot?.draft ?? { name: '', breedId: '', birthDate: '', kennelCode: '', sourceSelected: false };
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedsState, setBreedsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState(initialDraft.name);
  const [breedId, setBreedId] = useState(initialDraft.breedId);
  const [birthDate, setBirthDate] = useState(initialDraft.birthDate);
  const [expectedHomecomingDate, setExpectedHomecomingDate] = useState(initialDraft.expectedHomecomingDate ?? '');
  const [sex, setSex] = useState<DogSex | null>(initialDraft.sex ?? null);
  const [formBaseline, setFormBaseline] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<DogCreationSaveState>(validRecoverySnapshot?.saveState ?? 'idle');
  const [resolvedDog, setResolvedDog] = useState<OwnedDog | null>(validRecoverySnapshot?.resolvedDog ?? null);
  const [resolvedRequestId, setResolvedRequestId] = useState<string | null>(validRecoverySnapshot?.resolvedRequestId ?? null);
  const [resolvedShouldClearReferral, setResolvedShouldClearReferral] = useState(validRecoverySnapshot?.resolvedShouldClearReferral ?? true);
  const [sourceCheckProblem, setSourceCheckProblem] = useState<DogCreationRecoverySnapshot['sourceCheckProblem']>(validRecoverySnapshot?.sourceCheckProblem ?? null);
  const [kennelCode, setKennelCode] = useState(initialDraft.kennelCode);
  const [sourceSelected, setSourceSelected] = useState(initialDraft.sourceSelected);
  const [sourceExpanded, setSourceExpanded] = useState(Boolean(initialDraft.sourceSelected));
  const [recoveryChecking, setRecoveryChecking] = useState(true);
  const [recoveryMismatch, setRecoveryMismatch] = useState(false);
  const [retiredRequestResetFailed, setRetiredRequestResetFailed] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [initialExitDialogVisible, setInitialExitDialogVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const recoveryCheckInFlight = useRef(true);
  const operationInFlight = useRef(false);
  const handleBackRef = useRef<() => boolean>(() => false);

  const draftDirty = name !== formBaseline.name || breedId !== formBaseline.breedId || birthDate !== formBaseline.birthDate
    || expectedHomecomingDate !== (formBaseline.expectedHomecomingDate ?? '') || sex !== (formBaseline.sex ?? null)
    || kennelCode !== formBaseline.kennelCode || sourceSelected !== formBaseline.sourceSelected;
  const isRecoveryState = saveState === 'unknown' || saveState === 'sourceUnconfirmed' || saveState === 'existingProfile'
    || saveState === 'cleanupError' || saveState === 'recoveryUnavailable' || saveState === 'retiredRequest';

  function makeRecoverySnapshot(): DogCreationRecoverySnapshot {
    return {
      ownerId,
      accountGeneration,
      entryPoint: validRecoverySnapshot?.entryPoint ?? entryPoint,
      draft: { name, breedId, birthDate, kennelCode, sourceSelected, expectedHomecomingDate, sex },
      saveState,
      resolvedDog,
      resolvedRequestId,
      resolvedShouldClearReferral,
      sourceCheckProblem,
    };
  }

  function leaveAddFlow(kind: 'discard' | 'resume') {
    if (busy || operationInFlight.current || recoveryCheckInFlight.current) return;
    if (kind === 'resume') onCancel?.({ kind: 'resume', snapshot: makeRecoverySnapshot() });
    else {
      onClearRecoverySnapshot?.();
      onCancel?.({ kind: 'discard' });
    }
  }

  function requestAddFlowExit() {
    if (busy || operationInFlight.current || recoveryCheckInFlight.current) return;
    if (isRecoveryState) {
      leaveAddFlow('resume');
    } else if (draftDirty) {
      setCancelDialogVisible(true);
    } else {
      leaveAddFlow('discard');
    }
  }

  useLayoutEffect(() => {
    handleBackRef.current = () => {
      if (recoveryCheckInFlight.current || operationInFlight.current || busy) return true;
      if (mode === 'add') {
        requestAddFlowExit();
        return true;
      }
      if (draftDirty || isRecoveryState) {
        setInitialExitDialogVisible(true);
        return true;
      }
      return false;
    };
  });

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => handleBackRef.current());
    return () => subscription.remove();
  }, [mode]);

  useEffect(() => {
    let active = true;
    void readSecurePendingReferral().then((referral) => {
      if (active && referral && !validRecoverySnapshot) {
        setKennelCode(referral.code);
        setFormBaseline((baseline) => ({ ...baseline, kennelCode: referral.code }));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [validRecoverySnapshot]);

  useEffect(() => {
    let active = true;
    recoveryCheckInFlight.current = true;
    void readDogCreationRequestId(ownerId).then((requestId) => {
      if (!active || !isCurrentAccount(ownerId, accountGeneration)) return;
      if (validRecoverySnapshot) {
        if (!profileRecoveryRequestMatches(validRecoverySnapshot, ownerId, accountGeneration, requestId)) {
          setRecoveryMismatch(true);
          setSaveState('recoveryUnavailable');
          setResolvedDog(null);
          setResolvedRequestId(null);
          setSourceCheckProblem(null);
          return;
        }
        // A matching in-memory snapshot owns the recovery variant and its actions.
        // The secure-ID read only validates that context; it never retries a write.
        return;
      }
      if (requestId) {
        setResolvedRequestId(requestId);
        setSaveState('unknown');
      }
    }).catch(() => {
      if (!active || !isCurrentAccount(ownerId, accountGeneration)) return;
      if (validRecoverySnapshot?.resolvedRequestId) {
        setRecoveryMismatch(true);
        setSaveState('recoveryUnavailable');
        setResolvedDog(null);
        setResolvedRequestId(null);
        setSourceCheckProblem(null);
      } else if (!validRecoverySnapshot) {
        setSaveState('recoveryUnavailable');
      }
    }).finally(() => {
      recoveryCheckInFlight.current = false;
      if (active && isCurrentAccount(ownerId, accountGeneration)) setRecoveryChecking(false);
    });
    return () => { active = false; recoveryCheckInFlight.current = false; };
  }, [accountGeneration, isCurrentAccount, ownerId, validRecoverySnapshot]);

  useEffect(() => {
    let active = true;
    void fetchBreeds(client).then((options) => {
      if (!active || !isCurrentAccount(ownerId, accountGeneration)) return;
      setBreeds(options);
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
    const desired = { name: name.trim(), breedId, birthDate: birthDate.trim(), expectedHomecomingDate: expectedHomecomingDate.trim() || null, sex };
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
        setSaveState(error instanceof RetiredDogCreationRequestError
          ? 'retiredRequest'
          : referralCode && error instanceof Error && /invalid kennel code/i.test(error.message) ? 'invalidCode' : 'unknown');
        return;
      }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      let dog: OwnedDog | null;
      try { dog = await fetchOwnedDogById(client, dogId); } catch { dog = null; }
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      if (!dog) { setSaveState('unknown'); return; }
      if (dog.name !== desired.name || dog.breed_id !== desired.breedId || dog.birth_date !== desired.birthDate
        || (dog.expected_homecoming_date ?? null) !== desired.expectedHomecomingDate || (dog.sex ?? null) !== desired.sex) {
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
      setRecoveryMismatch(false);
      onClearRecoverySnapshot?.();
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setSaveState('recoveryUnavailable');
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  async function clearRetiredCreationRequest() {
    if (saveState !== 'retiredRequest' || !resolvedRequestId || busy || operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true);
    setRetiredRequestResetFailed(false);
    try {
      await clearDogCreationRequest(ownerId, resolvedRequestId);
      if (!isCurrentAccount(ownerId, accountGeneration)) return;
      setResolvedRequestId(null);
      setResolvedDog(null);
      setResolvedShouldClearReferral(true);
      setSaveState('idle');
      setRecoveryMismatch(false);
      onClearRecoverySnapshot?.();
    } catch {
      if (isCurrentAccount(ownerId, accountGeneration)) setRetiredRequestResetFailed(true);
    } finally {
      operationInFlight.current = false;
      if (isCurrentAccount(ownerId, accountGeneration)) setBusy(false);
    }
  }

  function markEdited() {
    setSaveState((current) => current === 'unknown' || current === 'sourceUnconfirmed' || current === 'retiredRequest' ? current : 'idle');
  }

  const exitDialog = mode === 'add' ? cancelDialogVisible : initialExitDialogVisible;
  const requestWasSent = Boolean(resolvedRequestId) || saveState === 'unknown' || saveState === 'sourceUnconfirmed'
    || saveState === 'existingProfile' || saveState === 'cleanupError' || saveState === 'retiredRequest';

  function dismissExitDialog() {
    setCancelDialogVisible(false);
    setInitialExitDialogVisible(false);
  }

  function confirmExitDialog() {
    dismissExitDialog();
    if (mode === 'add') leaveAddFlow('discard');
    else BackHandler.exitApp();
  }

  function pressAddCancel() {
    if (busy || operationInFlight.current || recoveryCheckInFlight.current) return;
    requestAddFlowExit();
  }

  const requestRecoveryResume = isRecoveryState && mode === 'add' && !busy && !recoveryChecking;

  const sourceNeedsAttention = sourceSelected || saveState === 'invalidCode' || saveState === 'sourceUnconfirmed';
  const sourceSummary = sourceSelected ? 'Koppling vald' : kennelCode ? 'Kod inläst · inte kopplad' : 'Valfritt';
  const showRestartWarning = requestWasSent;

  const canSubmit = name.trim().length > 0 && name.trim().length <= 80 && Boolean(breedId)
    && isValidBirthDate(birthDate) && (expectedHomecomingDate.trim() === '' || validCalendarDate(expectedHomecomingDate.trim())) && (!sourceSelected || Boolean(normalizeKennelCode(kennelCode)));

  return (
    <AppScreen>
      <View style={styles.screenHeader}>
        <View style={styles.screenHeading}>
          <Text accessibilityRole="header" style={styles.screenTitle}>{mode === 'add' ? 'Lägg till hund' : 'Hundens profil'}</Text>
          <Text style={styles.screenSubtitle}>{mode === 'add' ? 'Uppgifterna går att ändra senare.' : 'Berätta det viktigaste om din hund.'}</Text>
        </View>
        {mode === 'add' && onCancel && !requestRecoveryResume ? <Pressable accessibilityRole="button" accessibilityLabel="Avbryt och gå tillbaka"
          accessibilityState={{ disabled: busy || recoveryChecking }} disabled={busy || recoveryChecking} onPress={pressAddCancel} style={styles.headerAction}>
          <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
        </Pressable> : null}
      </View>
      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle} accessibilityRole="header">Hundens uppgifter</Text>
      <FormField label="Hundens namn" editable={!busy} onChangeText={(value) => { setName(value); markEdited(); }} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel Nala" returnKeyType="done" value={name} />
      <BreedPickerField
        label="Ras"
        value={breedId}
        breeds={breeds}
        state={breedsState}
        disabled={busy}
        onChange={(breed) => { setBreedId(breed.id); markEdited(); }}
        onRetry={() => { setBreedsState('loading'); setBreedAttempt((count) => count + 1); }}
      />
      <DatePickerField label="Födelsedatum" disabled={busy} onChangeText={(value) => { setBirthDate(value); markEdited(); }} value={birthDate} />
      <DogArticleProfileFields date={expectedHomecomingDate} sex={sex} disabled={busy}
        onDate={(value) => { setExpectedHomecomingDate(value); markEdited(); }}
        onSex={(value) => { setSex(value); markEdited(); }} />
      </View>
      <View style={styles.sourceCard}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: sourceExpanded }} onPress={() => setSourceExpanded((expanded) => !expanded)} style={styles.sourceHeader}>
          <View style={styles.sourceHeading}>
            <Text style={styles.sourceTitle}>Kennelkod <Text style={styles.optionalLabel}>· valfritt</Text></Text>
            <Text style={styles.sourceSummary}>{sourceSummary}</Text>
          </View>
          <Ionicons name={sourceExpanded ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
        </Pressable>
        {sourceExpanded || sourceNeedsAttention ? <View style={styles.sourceDetails}>
          <FormField editable={!busy} autoCapitalize="characters" autoComplete="off" label="Kennelkod"
            onChangeText={(value) => { setKennelCode(value); markEdited(); }} onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Skriv koden från kennelns QR" returnKeyType="done" value={kennelCode} />
          <Text style={styles.sourceInfo}>En inläst kod kopplas först när du väljer det.</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: sourceSelected, disabled: busy || !normalizeKennelCode(kennelCode) }} disabled={busy || !normalizeKennelCode(kennelCode)} onPress={() => { setSourceSelected((value) => !value); markEdited(); }} style={styles.sourceChoice}>
            <View style={[styles.checkbox, sourceSelected && styles.checkboxSelected]}>{sourceSelected && <Text style={styles.checkboxMark}>✓</Text>}</View>
            <Text style={styles.sourceChoiceText}>Koppla koden till min profil</Text>
          </Pressable>
          {kennelCode ? <Button variant="icon" iconName="trash-outline" label="Ta bort kod" accessibilityLabel="Ta bort kennelkod" disabled={busy} onPress={() => { setKennelCode(''); setSourceSelected(false); markEdited(); void clearSecurePendingReferral().catch(() => undefined); }} /> : null}
        </View> : null}
      </View>
      {sourceSelected && !normalizeKennelCode(kennelCode) && <MessageCard tone="error">Skriv en giltig kennelkod eller ta bort kennelkälla.</MessageCard>}
      {recoveryChecking && <MessageCard>Kontrollerar om ett tidigare försök behöver återställas…</MessageCard>}
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
      {saveState === 'retiredRequest' && <MessageCard tone={retiredRequestResetFailed ? 'error' : 'neutral'}>
        {retiredRequestResetFailed
          ? 'Den gamla begäran hör till en borttagen hund, men den säkra begäran kunde inte rensas. Ingen ny begäran har skickats.'
          : 'Den sparade begäran hör till en hundprofil som har tagits bort. Uppgifterna du fyllt i finns kvar. Fortsätt med en ny begäran när du är redo.'}
      </MessageCard>}
      {saveState === 'recoveryUnavailable' && <MessageCard tone="error">{recoveryMismatch ? 'Återställningen matchar inte den säkra begäran. Öppna hundprofilen igen för att hämta aktuell status.' : 'Vi kunde inte kontrollera den säkra återställningen. Ingen ny begäran skickas innan kontrollen lyckas.'}</MessageCard>}
      {saveState === 'cleanupError' && <MessageCard tone="neutral">{resolvedDog?.name ?? 'Hundprofilen'} är sparad. Den lokala återställningsnyckeln kunde inte rensas ännu.</MessageCard>}
      {saveState === 'existingProfile' ? <>
        <PrimaryButton title={busy ? 'Öppnar…' : `Öppna ${resolvedDog?.name ?? 'hundprofilen'}`} disabled={busy || recoveryChecking || !resolvedDog} onPress={() => { void openResolvedDog(); }} />
        <QuietButton title={busy ? 'Vänta…' : 'Starta en ny hundprofil'} disabled={busy || recoveryChecking || !resolvedDog} onPress={() => { void startAnotherDog(); }} />
      </> : saveState === 'cleanupError' ? <PrimaryButton title={busy ? 'Kontrollerar…' : `Fortsätt till ${resolvedDog?.name ?? 'hunden'}`} disabled={busy || recoveryChecking || !resolvedDog} onPress={() => { void openResolvedDog(); }} />
        : saveState === 'sourceUnconfirmed' ? <>
          <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera igen med samma begäran'} disabled={!canSubmit || busy || recoveryChecking || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />
          <QuietButton title={busy ? 'Vänta…' : `Öppna ${resolvedDog?.name ?? 'hunden'} utan bekräftad kennelkoppling`} disabled={busy || recoveryChecking || !resolvedDog || !resolvedRequestId} onPress={() => { void openResolvedDog(); }} />
        </>
        : saveState === 'unknown' ? <PrimaryButton title={busy ? 'Kontrollerar…' : 'Försök igen med samma begäran'} disabled={!canSubmit || busy || recoveryChecking || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />
          : saveState === 'retiredRequest' ? <PrimaryButton title={busy ? 'Rensar säker begäran…' : 'Fortsätt med en ny begäran'} disabled={busy || recoveryChecking || !resolvedRequestId} onPress={() => { void clearRetiredCreationRequest(); }} />
          : <PrimaryButton title={busy ? 'Sparar…' : saveState === 'recoveryUnavailable' ? 'Försök igen' : mode === 'add' ? 'Lägg till hund' : 'Fortsätt'} disabled={!canSubmit || busy || recoveryChecking || breedsState !== 'ready'} onPress={() => { void createAndConfirm(); }} />}
      <Pressable accessibilityRole="button" accessibilityLabel="Om hundens uppgifter" onPress={() => setInfoVisible(true)} style={styles.infoEntry}>
        <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />
        <Text style={styles.infoEntryText}>Om hundens uppgifter</Text>
      </Pressable>
      {requestRecoveryResume && onCancel ? <QuietButton
        title={requestRecoveryResume ? `Tillbaka till ${validRecoverySnapshot?.entryPoint === 'settings' || entryPoint === 'settings' ? 'Hundprofil' : 'Hem'}` : 'Avbryt'}
        disabled={busy || recoveryChecking} onPress={() => leaveAddFlow('resume')} /> : null}
      <InfoModal visible={infoVisible} title="Om hundens uppgifter" onClose={() => setInfoVisible(false)}>
        <Text style={styles.infoBody}>Namn, ras och födelsedatum hjälper Tassla att visa åldersanpassat innehåll. Uppgifterna kan ändras senare.</Text>
      </InfoModal>
      <Dialog visible={exitDialog} title={mode === 'add' ? 'Kasta ändringarna?' : 'Lämna Tassla?'}
        confirmLabel={mode === 'add' ? 'Kasta ändringar' : 'Lämna appen'} confirmVariant="destructive"
        cancelLabel={mode === 'add' ? 'Fortsätt redigera' : 'Stanna kvar'}
        onRequestClose={dismissExitDialog} onConfirm={confirmExitDialog}>
        <Text style={styles.dialogCopy}>
          {mode === 'add'
            ? 'Det du har fyllt i här kastas. Hundprofilerna som redan sparats finns kvar.'
            : `Du har uppgifter som inte är klara. ${showRestartWarning ? 'Efter ett sparförsök finns en säker begäran kvar, men fälten kan behöva fyllas i igen när du öppnar appen.' : 'Inget sparas förrän du fortsätter.'}`}
        </Text>
      </Dialog>
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
  screenHeader: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  screenHeading: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  screenTitle: { ...tokens.typography.title, color: tokens.colors.textPrimary },
  screenSubtitle: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  headerAction: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.support.profile.bg },
  profileCard: { marginBottom: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  sourceCard: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.md },
  sourceHeader: { minHeight: tokens.size.touchMin + tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md },
  sourceHeading: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  sourceTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  optionalLabel: { color: tokens.colors.textSecondary, fontWeight: '400' },
  sourceSummary: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  sourceDetails: { paddingBottom: tokens.spacing.md, gap: tokens.spacing.xs },
  sourceInfo: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  sourceChoice: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  checkbox: { width: tokens.size.touchMin / 2, height: tokens.size.touchMin / 2, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary },
  checkboxMark: { ...tokens.typography.label, color: tokens.colors.onPrimary },
  sourceChoiceText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, flexShrink: 1 },
  infoEntry: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, marginBottom: tokens.spacing.xs },
  infoEntryText: { ...tokens.typography.caption, color: tokens.colors.primary },
  infoBody: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  dialogCopy: { ...tokens.typography.body, color: tokens.colors.textSecondary },
});
