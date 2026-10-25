import { DogArticleProfileFields } from './DogArticleProfileFields';
import { validCalendarDate, type DogSex } from '../../content/article-targeting';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DatePickerField, InfoModal, MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { Button } from '../../components/ui';
import { Toast } from '../../components/ui/Toast';
import {
  fetchBreeds,
  isValidDogBirthDate,
  normalizeDogProfileName,
  type BreedOption,
  type AgeDisplayUnit,
  type OwnedDog,
  type OwnedDogAttribution,
  type OwnedDogProfileChanges,
} from '../../data/app-data';
import { normalizeKennelCode } from '../../onboarding-referral/referral-secure-storage';
import { tokens } from '../../theme/tokens';
import { ProfileScreenHeader } from './ProfileScreenHeader';
import { profileInsightsDisabledReason } from '../home/main-navigation';
import { BreedPickerField } from './BreedPickerField';
import { DogProfileSwitcherSheet } from '../home/DogProfileSwitcherSheet';
import type { ProfileExitScope, ProfileExitSnapshot } from './profile-exit';

export function EditDogProfileScreen({
  client,
  dog,
  busy = false,
  pending = false,
  statusMessage = '',
  statusError = false,
  conflict,
  attribution = null,
  attributionState = 'loading',
  attributionBusy = false,
  attributionWriteUnresolved = false,
  attributionMessage = '',
  attributionMessageError = false,
  backLabel = 'Tillbaka till Mer',
  onBack,
  onSave,
  onSaveAttribution,
  onRetryAttribution,
  onRetryStatus,
  onAcceptCurrent,
  ownedDogs = [dog],
  activeDogId = dog.id,
  exitScope,
  onExitStateChange,
  onSelectDog,
  onAddDog,
  onOpenInsights,
}: {
  client: SupabaseClient;
  dog: OwnedDog;
  ownedDogs?: readonly OwnedDog[];
  activeDogId?: string;
  exitScope?: ProfileExitScope;
  onExitStateChange?: (snapshot: ProfileExitSnapshot) => void;
  onSelectDog?: (dogId: string) => void;
  onAddDog?: () => void;
  onOpenInsights?: (canOpen: boolean) => void;
  busy?: boolean;
  pending?: boolean;
  statusMessage?: string;
  statusError?: boolean;
  conflict?: OwnedDog | null;
  attribution?: OwnedDogAttribution | null;
  attributionState?: 'loading' | 'ready' | 'error';
  attributionBusy?: boolean;
  attributionWriteUnresolved?: boolean;
  attributionMessage?: string;
  attributionMessageError?: boolean;
  backLabel?: string;
  onBack: () => void;
  onSave: (changes: OwnedDogProfileChanges, knownBreeds: readonly BreedOption[]) => Promise<boolean>;
  onSaveAttribution?: (code: string | null) => Promise<boolean>;
  onRetryAttribution?: () => void;
  onRetryStatus: () => void;
  onAcceptCurrent: () => void;
}) {
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedState, setBreedState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [name, setName] = useState(dog.name);
  const [breedId, setBreedId] = useState(dog.breed_id);
  const [birthDate, setBirthDate] = useState(dog.birth_date);
  const [expectedHomecomingDate, setExpectedHomecomingDate] = useState(dog.expected_homecoming_date ?? '');
  const [sex, setSex] = useState<DogSex | null>(dog.sex ?? null);
  const [ageDisplayUnit, setAgeDisplayUnit] = useState<AgeDisplayUnit>(dog.age_display_unit);
  const [formError, setFormError] = useState('');
  const [kennelCode, setKennelCode] = useState(attribution?.code ?? '');
  const savedAttributionCode = useRef(attribution?.code ?? '');
  const [attributionFormError, setAttributionFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [dogSwitcherVisible, setDogSwitcherVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [attributionExpanded, setAttributionExpanded] = useState(false);
  const confirmedMessage = statusMessage === 'Hundprofilen är sparad.' && !statusError && !pending && !busy
    ? statusMessage : null;
  const blocked = busy || pending;

  useEffect(() => {
    // The profile read is asynchronous; mirror a completed read into the local field.
    if (attributionState === 'ready') {
      const savedCode = attribution?.code ?? '';
      setKennelCode((current) => current === savedAttributionCode.current ? savedCode : current);
      savedAttributionCode.current = savedCode;
    }
  }, [attribution?.code, attributionState]);

  useEffect(() => {
    // The toast mirrors an external save-status prop and is intentionally reset here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!confirmedMessage) { setToastVisible(false); return; }
    setToastMessage(confirmedMessage);
    setToastVisible(true);
  }, [confirmedMessage]);

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
    setFormError('');
    const normalizedName = normalizeDogProfileName(name);
    if (!normalizedName) {
      setFormError('Ange ett namn med 1–80 tecken.');
      return;
    }
    const selectedBreedExists = breeds.some((breed) => breed.id === breedId);
    const mayKeepMissingSavedBreed = breedId === dog.breed_id && !breeds.some((breed) => breed.id === dog.breed_id);
    if (breedState !== 'ready' || (!selectedBreedExists && !mayKeepMissingSavedBreed)) {
      setFormError('Välj en ras från listan.');
      return;
    }
    const normalizedDate = birthDate.trim();
    if (!isValidDogBirthDate(normalizedDate)) {
      setFormError('Ange ett giltigt födelsedatum som inte ligger i framtiden.');
      return;
    }
    if (expectedHomecomingDate.trim() !== '' && !validCalendarDate(expectedHomecomingDate.trim())) {
      setFormError('Ange ett giltigt förväntat hemkomstdatum eller lämna fältet tomt.');
      return;
    }
    const changes: OwnedDogProfileChanges = {
      expected_homecoming_date: expectedHomecomingDate.trim() || null, sex,
      name: normalizedName,
      breed_id: breedId,
      birth_date: normalizedDate,
      age_display_unit: ageDisplayUnit,
    };
    await onSave(changes, breeds);
  }

  async function saveAttribution() {
    setAttributionFormError('');
    const value = kennelCode.trim();
    const normalized = value ? normalizeKennelCode(value) : null;
    if (value && !normalized) {
      setAttributionFormError('Ange en giltig kennelkod eller lämna fältet tomt.');
      return;
    }
    if (!onSaveAttribution) return;
    await onSaveAttribution(normalized);
  }

  const conflictBreed = conflict ? breeds.find((breed) => breed.id === conflict.breed_id)?.name ?? 'Ras saknas i listan' : '';
  const selectedBreedExists = breeds.some((breed) => breed.id === breedId);
  const mayKeepMissingSavedBreed = breedId === dog.breed_id && !breeds.some((breed) => breed.id === dog.breed_id);
  const canSaveBreed = breedState === 'ready' && (selectedBreedExists || mayKeepMissingSavedBreed);
  const draftDiffers = name.trim() !== dog.name || breedId !== dog.breed_id || birthDate.trim() !== dog.birth_date
    || ageDisplayUnit !== dog.age_display_unit
    || (expectedHomecomingDate.trim() || null) !== (dog.expected_homecoming_date ?? null) || sex !== (dog.sex ?? null);
  const kennelDraftDiffers = kennelCode.trim() !== (attribution?.code ?? '');
  const dogManagementBlocked = blocked || Boolean(conflict) || attributionBusy || attributionWriteUnresolved;
  const showAttributionDetails = attributionExpanded || attributionState === 'error' || attributionBusy || attributionWriteUnresolved;
  const insightsDisabledReason = profileInsightsDisabledReason({
    dogProfileDirty: draftDiffers,
    kennelDraftDirty: kennelDraftDiffers,
    profileBusy: busy,
    profilePending: pending,
    profileConflict: Boolean(conflict),
    attributionBusy,
    attributionWriteUnresolved,
    attributionReady: attributionState === 'ready',
  });
  const canOpenInsights = insightsDisabledReason === null;
  const showStatusMessage = Boolean(statusMessage) && (statusError || pending || busy);

  const reportExitState = useCallback((profileDirty = draftDiffers, kennelDirty = kennelDraftDiffers) => {
    if (!exitScope) return;
    onExitStateChange?.({ scope: exitScope, profileDirty: profileDirty || (expectedHomecomingDate.trim() || null) !== (dog.expected_homecoming_date ?? null) || sex !== (dog.sex ?? null), kennelDirty });
  }, [draftDiffers, exitScope, kennelDraftDiffers, onExitStateChange, expectedHomecomingDate, dog.expected_homecoming_date, sex, dog.sex]);

  useLayoutEffect(() => {
    reportExitState();
  }, [reportExitState]);

  return <View>
    <ProfileScreenHeader onBack={onBack} backLabel={backLabel} disabled={busy} />
    <Pressable accessibilityRole="button" accessibilityLabel={`Byt hund. Aktiv hund: ${dog.name}`}
      accessibilityState={{ disabled: dogManagementBlocked || !onSelectDog, expanded: dogSwitcherVisible }}
      disabled={dogManagementBlocked || !onSelectDog} onPress={() => setDogSwitcherVisible(true)}
      style={({ pressed }) => [styles.activeDogRow, pressed && !dogManagementBlocked && styles.dogProfilePressed]}>
      <View style={styles.dogProfileAvatar} accessible={false} importantForAccessibility="no-hide-descendants">
        <Ionicons name="paw" size={tokens.size.iconSm} color={tokens.colors.primary} />
      </View>
      <View style={styles.activeDogCopy}>
        <Text style={styles.activeDogLabel}>Aktiv hund</Text>
        <Text style={styles.dogProfileName}>{dog.name}</Text>
      </View>
      <Text style={styles.activeDogChange}>Byt</Text>
      <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </Pressable>
    {showStatusMessage ? <MessageCard tone={statusError ? 'error' : 'neutral'}>{statusMessage}</MessageCard> : null}
    {draftDiffers && !pending && !busy ? <MessageCard tone="neutral">Ändringarna är inte sparade.</MessageCard> : null}
    {pending && <>
      <MessageCard tone="error">Ändringen väntar på en säker statuskontroll. Den finns kvar även om du lämnar den här sidan.</MessageCard>
      <PrimaryButton title={busy ? 'Kontrollerar…' : 'Kontrollera profilen igen'} disabled={busy} onPress={onRetryStatus} />
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
          onChangeText={(value) => {
            setName(value);
            reportExitState(value.trim() !== dog.name || breedId !== dog.breed_id || birthDate.trim() !== dog.birth_date || ageDisplayUnit !== dog.age_display_unit, kennelDraftDiffers);
          }} onSubmitEditing={() => Keyboard.dismiss()} placeholder="Till exempel Nala"
          placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.input} value={name} />
      </View>
      <BreedPickerField
        label="Ras"
        value={breedId}
        breeds={breeds}
        state={breedState}
        disabled={blocked}
        onChange={(breed) => {
          setBreedId(breed.id);
          reportExitState(name.trim() !== dog.name || breed.id !== dog.breed_id || birthDate.trim() !== dog.birth_date || ageDisplayUnit !== dog.age_display_unit, kennelDraftDiffers);
        }}
        onRetry={() => { setBreedState('loading'); setBreedAttempt((attempt) => attempt + 1); }}
      />
      <DatePickerField label="Födelsedatum" disabled={blocked} onChangeText={(value) => {
        setBirthDate(value);
        reportExitState(name.trim() !== dog.name || breedId !== dog.breed_id || value.trim() !== dog.birth_date || ageDisplayUnit !== dog.age_display_unit, kennelDraftDiffers);
      }} value={birthDate} />
      <DogArticleProfileFields date={expectedHomecomingDate} sex={sex} disabled={blocked}
        onDate={setExpectedHomecomingDate} onSex={setSex} />
      <View style={styles.ageUnitField}>
        <Text style={styles.label}>Visa ålder som</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Visa ålder som" style={styles.ageUnitOptions}>
          {AGE_DISPLAY_OPTIONS.map((option) => {
            const selected = option.value === ageDisplayUnit;
            return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
              accessibilityState={{ selected, disabled: blocked }} disabled={blocked} onPress={() => {
                setAgeDisplayUnit(option.value);
                reportExitState(name.trim() !== dog.name || breedId !== dog.breed_id || birthDate.trim() !== dog.birth_date || option.value !== dog.age_display_unit, kennelDraftDiffers);
              }}
              style={({ pressed }) => [styles.ageUnitOption, selected && styles.ageUnitSelected, pressed && !blocked && styles.breedPressed]}>
              <Text style={[styles.ageUnitText, selected && styles.ageUnitTextSelected]}>{option.label}</Text>
            </Pressable>;
          })}
        </View>
      </View>
      {formError ? <MessageCard tone="error">{formError}</MessageCard> : null}
      <PrimaryButton title={busy ? 'Sparar…' : statusError && !pending ? 'Försök igen' : 'Spara profil'}
        disabled={blocked || !canSaveBreed} onPress={() => { void save(); }} />
      <Toast visible={toastVisible} tone="success" confirmed message={toastMessage ?? undefined} autoDismissMs={2500} onAutoDismiss={() => setToastVisible(false)} onExitComplete={() => setToastMessage(null)} />
    </View>
    <View style={styles.insightsCard}>
      <Pressable accessibilityRole="button" accessibilityLabel="Insikter"
        accessibilityHint="Visar hundens loggade händelser över tid"
        accessibilityState={{ disabled: !canOpenInsights }} disabled={!canOpenInsights}
        onPress={() => onOpenInsights?.(canOpenInsights)}
        style={({ pressed }) => [styles.insightsAction, !canOpenInsights && styles.insightsActionDisabled, pressed && canOpenInsights && styles.dogProfilePressed]}>
        <View style={styles.insightsIcon} accessible={false} importantForAccessibility="no-hide-descendants">
          <Ionicons name="bar-chart-outline" size={tokens.size.iconMd} color={tokens.colors.primary} />
        </View>
        <View style={styles.insightsCopy}>
          <Text style={styles.insightsTitle}>Insikter</Text>
          <Text style={styles.insightsDescription}>Se registreringar över tid.</Text>
        </View>
        <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={canOpenInsights ? tokens.colors.textSecondary : tokens.colors.borderStrong} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </Pressable>
      {insightsDisabledReason ? <Text style={styles.insightsDisabledReason}>{insightsDisabledReason}</Text> : null}
    </View>
    <View style={styles.attributionCard}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAttributionDetails }} onPress={() => setAttributionExpanded((expanded) => !expanded)} style={styles.attributionHeader}>
        <View style={styles.attributionHeading}>
          <Text style={styles.attributionTitle}>Kennelkoppling <Text style={styles.attributionOptional}>· valfri</Text></Text>
          <Text style={styles.attributionSummary}>{attributionState === 'loading' ? 'Hämtar status…'
            : attributionState === 'error' ? 'Status kunde inte hämtas'
              : attribution ? `Kopplad till ${attribution.name}` : 'Ingen kennel kopplad'}</Text>
        </View>
        <Ionicons name={showAttributionDetails ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
      </Pressable>
      {showAttributionDetails ? <View style={styles.attributionDetails}>
        {attributionState === 'loading' && <MessageCard>Hämtar kennelkopplingen…</MessageCard>}
        {attributionState === 'error' && <>
          <MessageCard tone="error">Kennelkopplingen kunde inte hämtas. Du kan försöka igen utan att ändra hundprofilen.</MessageCard>
          <Button variant="secondary" label="Försök igen" accessibilityLabel="Försök hämta kennelkopplingen igen" disabled={attributionBusy} onPress={onRetryAttribution ?? (() => undefined)} />
        </>}
        {attributionState === 'ready' && <>
          <Text style={styles.attributionBody}>Koppla en kennel om du vill. Det påverkar inte hundprofilen.</Text>
          <TextInput accessibilityLabel="Kennelkod, valfri" autoCapitalize="characters" editable={!attributionBusy}
            onChangeText={(value) => {
              const nextCode = value.toUpperCase();
              setKennelCode(nextCode);
              setAttributionFormError('');
              reportExitState(draftDiffers, nextCode.trim() !== (attribution?.code ?? ''));
            }} placeholder="Till exempel ABC123"
            placeholderTextColor={tokens.colors.textSecondary} style={styles.input} value={kennelCode} />
          {attributionFormError ? <MessageCard tone="error">{attributionFormError}</MessageCard> : null}
          {attributionMessage ? <MessageCard tone={attributionMessageError ? 'error' : 'neutral'}>{attributionMessage}</MessageCard> : null}
          {attributionWriteUnresolved ? <Button variant="secondary" label={attributionBusy ? 'Kontrollerar…' : 'Kontrollera kenneländringen igen'}
            accessibilityLabel="Kontrollera kenneländringen igen" loading={attributionBusy} disabled={attributionBusy}
            onPress={onRetryAttribution ?? (() => undefined)} /> : null}
          <Button variant={attribution && !kennelCode.trim() ? 'icon' : 'secondary'} iconName="trash-outline" label={attributionBusy ? 'Sparar…' : attribution ? (kennelCode.trim() ? 'Spara kennelkoppling' : 'Ta bort kennelkoppling') : 'Spara kennelkoppling'} accessibilityLabel={attribution && !kennelCode.trim() ? `Ta bort kennelkoppling till ${attribution.name}` : 'Spara kennelkoppling'} loading={attributionBusy}
            disabled={attributionBusy || !onSaveAttribution || kennelCode.trim() === (attribution?.code ?? '')} onPress={() => { void saveAttribution(); }} />
        </>}
      </View> : null}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Om hundens profil" onPress={() => setInfoVisible(true)} style={styles.infoEntry}>
      <Ionicons name="information-circle-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />
      <Text style={styles.infoEntryText}>Om hundens profil</Text>
    </Pressable>
    <InfoModal visible={infoVisible} title="Om hundens profil" onClose={() => setInfoVisible(false)}>
      <Text style={styles.infoBody}>Hundens historik och träningssteg följer med när du rättar profilen. Namn, ras och födelsedatum hjälper Tassla att visa innehåll som passar er.</Text>
    </InfoModal>
    <DogProfileSwitcherSheet visible={dogSwitcherVisible} dogs={ownedDogs} activeDogId={activeDogId}
      onRequestClose={() => setDogSwitcherVisible(false)} onSelectDog={(dogId) => {
        if (dogId === activeDogId) setDogSwitcherVisible(false);
        else onSelectDog?.(dogId);
      }} onAddDog={() => onAddDog?.()} />
  </View>;
}

const AGE_DISPLAY_OPTIONS: readonly { value: AgeDisplayUnit; label: string }[] = [
  { value: 'weeks', label: 'Veckor' },
  { value: 'months', label: 'Månader' },
  { value: 'years', label: 'År' },
];

const styles = StyleSheet.create({
  activeDogRow: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md, marginBottom: tokens.spacing.sm, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  activeDogCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  activeDogLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  activeDogChange: { ...tokens.typography.label, color: tokens.colors.primary },
  insightsCard: { marginTop: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, gap: tokens.spacing.sm },
  insightsAction: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  insightsIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, backgroundColor: tokens.colors.support.profile.bg },
  insightsCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  insightsTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  insightsDescription: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  insightsActionDisabled: { opacity: 0.62 },
  insightsDisabledReason: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  dogProfilePressed: { opacity: 0.78 },
  dogProfileAvatar: { width: tokens.size.chipMd, height: tokens.size.chipMd, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.support.profile.bg },
  dogProfileName: { ...tokens.typography.label, color: tokens.colors.textPrimary, flexShrink: 1 },
  conflictCard: { marginTop: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface },
  conflictTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  conflictText: { ...tokens.typography.body, color: tokens.colors.textPrimary, fontWeight: '700', marginTop: tokens.spacing.sm },
  conflictBody: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.sm },
  formCard: { marginTop: tokens.spacing.lg, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  attributionCard: { marginTop: tokens.spacing.md, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  attributionHeader: { minHeight: tokens.size.touchMin + tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md },
  attributionHeading: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  attributionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  attributionOptional: { color: tokens.colors.textSecondary, fontWeight: '400' },
  attributionSummary: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  attributionDetails: { paddingBottom: tokens.spacing.md, gap: tokens.spacing.sm },
  formTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  attributionBody: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  field: { marginBottom: tokens.spacing.md },
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm },
  input: { minHeight: tokens.size.buttonHeight, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  breedPressed: { opacity: 0.75 },
  ageUnitField: { marginTop: tokens.spacing.md, marginBottom: tokens.spacing.md },
  ageUnitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  ageUnitOption: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin * 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.full, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  ageUnitSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  ageUnitText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  ageUnitTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
  infoEntry: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs, marginTop: tokens.spacing.md },
  infoEntryText: { ...tokens.typography.caption, color: tokens.colors.primary },
  infoBody: { ...tokens.typography.body, color: tokens.colors.textPrimary },
});
