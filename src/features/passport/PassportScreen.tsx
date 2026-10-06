import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { fetchBreeds, type BreedOption, type OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, HealthWeightRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { theme } from '../../theme/tokens';
import { createAndSharePassportPdf, type PassportExportResult } from './passport-export';
import { createPassportSnapshot, type PassportSelection, type PassportSnapshot } from './passport-model';

type LoadState = 'loading' | 'ready' | 'error';

interface PassportScreenProps {
  onBack: () => void;
  client?: SupabaseClient;
  dog?: OwnedDog;
  lifetime?: string;
  isLifetimeCurrent?: (lifetime: string) => boolean;
  weights?: readonly HealthWeightRecord[];
  weightLoadState?: LoadState;
  weightBusy?: boolean;
  weightPending?: boolean;
  history?: readonly HealthHistoryRecord[];
  historyLoadState?: LoadState;
  historyBusy?: boolean;
  historyPending?: boolean;
  onRetryWeights?: () => void;
  onRetryHistory?: () => void;
  profileBusy?: boolean;
  profilePending?: boolean;
  profileConflict?: boolean;
}

const initialSelection: PassportSelection = { profile: true, latestWeight: true, healthHistory: true };
const emptyWeights: readonly HealthWeightRecord[] = [];
const emptyHistory: readonly HealthHistoryRecord[] = [];

export function PassportScreen(props: PassportScreenProps) {
  const { client, dog, isLifetimeCurrent } = props;
  const [iconsLoaded] = useFonts(Ionicons.font);
  const [selection, setSelection] = useState<PassportSelection>(initialSelection);
  const [breeds, setBreeds] = useState<BreedOption[]>([]);
  const [breedState, setBreedState] = useState<'loading' | 'ready' | 'error'>(props.client ? 'loading' : 'ready');
  const [breedDataLifetime, setBreedDataLifetime] = useState<string | null>(null);
  const [breedAttempt, setBreedAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingSnapshot, setExportingSnapshot] = useState<PassportSnapshot | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);
  const mounted = useRef(true);
  const lifetimeRef = useRef(props.lifetime ?? 'preview');
  const operationInFlight = useRef(false);
  const currentLifetime = props.lifetime ?? 'preview';

  useLayoutEffect(() => { lifetimeRef.current = currentLifetime; }, [currentLifetime]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!client || !dog) return;
    let active = true;
    const lifetime = currentLifetime;
    void fetchBreeds(client).then((options) => {
      if (!active || !mounted.current || lifetimeRef.current !== lifetime || isLifetimeCurrent?.(lifetime) === false) return;
      setBreeds(options);
      setBreedDataLifetime(lifetime);
      setBreedState('ready');
    }).catch(() => {
      if (!active || !mounted.current || lifetimeRef.current !== lifetime || isLifetimeCurrent?.(lifetime) === false) return;
      setBreedDataLifetime(lifetime);
      setBreedState('error');
    });
    return () => { active = false; };
  }, [breedAttempt, client, currentLifetime, dog, isLifetimeCurrent]);

  const weights = props.weights ?? emptyWeights;
  const history = props.history ?? emptyHistory;
  const breedName = dog ? breeds.find((breed) => breed.id === dog.breed_id)?.name ?? null : null;
  const currentBreedState = breedDataLifetime === currentLifetime ? breedState : 'loading';
  const selectedAny = selection.profile || selection.latestWeight || selection.healthHistory;
  const profileReady = !selection.profile || (
    Boolean(dog && breedName) && currentBreedState === 'ready' && !props.profileBusy && !props.profilePending && !props.profileConflict
  );
  const weightReady = !selection.latestWeight || (
    props.weightLoadState === 'ready' && !props.weightBusy && !props.weightPending
  );
  const historyReady = !selection.healthHistory || (
    props.historyLoadState === 'ready' && !props.historyBusy && !props.historyPending
  );
  const ready = Boolean(client && dog && selectedAny && profileReady && weightReady && historyReady);
  const snapshot = useMemo(() => ready && dog ? createPassportSnapshot({
    dog,
    breedName,
    weights,
    performedHistory: history,
    selection,
    createdOn: localDate(),
  }) : null, [breedName, dog, history, ready, selection, weights]);
  const visibleSnapshot = exportingSnapshot ?? snapshot;
  const busy = exporting;

  function toggleSelection(key: keyof PassportSelection) {
    if (busy) return;
    setSelection((current) => ({ ...current, [key]: !current[key] }));
    setStatusMessage('');
  }

  function isCurrent(lifetime: string): boolean {
    return mounted.current && lifetimeRef.current === lifetime
      && (props.isLifetimeCurrent?.(lifetime) ?? true);
  }

  async function createAndShare() {
    if (operationInFlight.current || !snapshot || !ready) return;
    const capturedSnapshot = snapshot;
    operationInFlight.current = true;
    setExporting(true);
    setExportingSnapshot(capturedSnapshot);
    setStatusMessage('');
    setStatusError(false);
    const lifetime = currentLifetime;
    try {
      const result = await createAndSharePassportPdf(capturedSnapshot, () => isCurrent(lifetime));
      if (!isCurrent(lifetime)) return;
      const message = exportMessage(result);
      setStatusMessage(message.text);
      setStatusError(message.error);
    } finally {
      operationInFlight.current = false;
      if (isCurrent(lifetime)) {
        setExporting(false);
        setExportingSnapshot(null);
      }
    }
  }

  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={props.onBack} disabled={busy} />
      <PageHeading title="Tassla-pass" description="En sparad överblick över hundens uppgifter, som du själv väljer att dela." />
      <View style={styles.heroCard}>
        <View style={styles.heroIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {iconsLoaded ? <Ionicons name="document-text-outline" size={25} color={theme.colors.accent} /> : <Text style={styles.fallback}>T</Text>}
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Dina uppgifter, på ditt sätt.</Text>
          <Text style={styles.body}>Förhandsvisningen visar samma sparade uppgifter som PDF:en.</Text>
        </View>
      </View>

      {!props.client || !dog ? <MessageCard>Ingen hundinformation visas i den lokala förhandsvisningen. En PDF skapas inte här.</MessageCard> : <>
        <Text style={styles.sectionTitle} accessibilityRole="header">Välj avsnitt</Text>
        <SelectionRow iconsLoaded={iconsLoaded} icon="person-outline" title="Hundprofil" detail="Namn, ras och födelsedatum" checked={selection.profile} disabled={busy} onPress={() => toggleSelection('profile')} />
        <SelectionRow iconsLoaded={iconsLoaded} icon="scale-outline" title="Senaste vikten" detail="Senaste ägarregistrerade vikt och datum" checked={selection.latestWeight} disabled={busy} onPress={() => toggleSelection('latestWeight')} />
        <SelectionRow iconsLoaded={iconsLoaded} icon="medkit-outline" title="Utförda hälsoposter" detail="Vaccinationer och veterinärbesök" checked={selection.healthHistory} disabled={busy} onPress={() => toggleSelection('healthHistory')} />

        {selection.profile && currentBreedState === 'loading' && <MessageCard>Hämtar rasnamnet till hundprofilen…</MessageCard>}
        {selection.profile && currentBreedState === 'error' && <>
          <MessageCard tone="error">Rasnamnet kunde inte hämtas. Försök igen eller välj bort hundprofilen.</MessageCard>
          <PrimaryButton title="Hämta rasnamnet igen" onPress={() => { setBreedState('loading'); setBreedDataLifetime(currentLifetime); setBreedAttempt((count) => count + 1); }} disabled={busy} />
        </>}
        {selection.profile && (props.profileBusy || props.profilePending || props.profileConflict) && <MessageCard tone="error">Hundprofilens sparstatus behöver lösas innan den kan tas med. Kontrollera profilen i Mer.</MessageCard>}
        {selection.latestWeight && props.weightLoadState === 'loading' && <MessageCard>Hämtar sparade vikter…</MessageCard>}
        {selection.latestWeight && props.weightLoadState === 'error' && <MessageCard tone="error">Vikterna kunde inte hämtas. Försök igen i Hälsa eller välj bort viktavsnittet.</MessageCard>}
        {selection.latestWeight && props.weightPending && <MessageCard tone="error">En viktändring har oklar sparstatus. Kontrollera den i Hälsa innan du tar med vikten.</MessageCard>}
        {selection.healthHistory && props.historyLoadState === 'loading' && <MessageCard>Hämtar sparade hälsoposter…</MessageCard>}
        {selection.healthHistory && props.historyLoadState === 'error' && <MessageCard tone="error">Hälsoposterna kunde inte hämtas. Försök igen i Hälsa eller välj bort avsnittet.</MessageCard>}
        {selection.healthHistory && props.historyPending && <MessageCard tone="error">En hälsopost har oklar sparstatus. Kontrollera den i Hälsa innan du tar med posterna.</MessageCard>}

        <View style={styles.previewCard}>
          <View style={styles.previewHeading}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Förhandsvisning</Text>
            <Text style={styles.previewTag}>SPARADE UPPGIFTER</Text>
          </View>
          {visibleSnapshot ? <SnapshotPreview snapshot={visibleSnapshot} /> : (
            <Text style={styles.body}>{selectedAny ? 'Förhandsvisningen visas när de valda uppgifterna är inlästa och sparstatusen är säker.' : 'Välj minst ett avsnitt för att se en förhandsvisning.'}</Text>
          )}
          {selection.healthHistory && <Text style={styles.limitNotice}>Högst 50 senast inlästa utförda poster visas. Äldre uppgifter kan saknas på grund av historikens servergräns.</Text>}
          <Text style={styles.disclaimer}>Uppgifterna är registrerade av hundägaren. Tassla-pass är ingen officiell journal, legitimation eller vaccinationshandling.</Text>
          {visibleSnapshot && <Text style={styles.createdOn}>Skapad {visibleSnapshot.createdOn}</Text>}
        </View>
        {statusMessage ? <MessageCard tone={statusError ? 'error' : 'neutral'}>{statusMessage}</MessageCard> : null}
        <PrimaryButton title={exporting ? 'Skapar PDF…' : 'Skapa PDF och öppna delning'} disabled={!ready || !snapshot || busy || !selectedAny} onPress={() => { void createAndShare(); }} />
        {props.weightLoadState === 'error' && <QuietButton title="Försök hämta vikterna igen" disabled={busy} onPress={props.onRetryWeights ?? (() => undefined)} />}
        {props.historyLoadState === 'error' && <QuietButton title="Försök hämta hälsoposter igen" disabled={busy} onPress={props.onRetryHistory ?? (() => undefined)} />}
      </>}
    </View>
  );
}

function SelectionRow({ iconsLoaded, icon, title, detail, checked, disabled, onPress }: {
  iconsLoaded: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; title: string; detail: string; checked: boolean; disabled: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={[styles.selectionRow, disabled && styles.disabled]}>
    <View style={styles.selectionIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {iconsLoaded ? <Ionicons name={icon} size={21} color={theme.colors.accent} /> : <Text style={styles.fallback}>•</Text>}
    </View>
    <View style={styles.selectionCopy}><Text style={styles.selectionTitle}>{title}</Text><Text style={styles.body}>{detail}</Text></View>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}><Text style={[styles.checkmark, checked && styles.checkmarkChecked]}>{checked ? '✓' : ''}</Text></View>
  </Pressable>;
}

function SnapshotPreview({ snapshot }: { snapshot: PassportSnapshot }) {
  return <View>
    {snapshot.selected.profile && <View style={styles.snapshotSection}>
      <Text style={styles.snapshotHeading}>Hund</Text>
      {snapshot.dog ? <>
        <PreviewValue label="Namn" value={snapshot.dog.name} />
        <PreviewValue label="Ras" value={snapshot.dog.breed} />
        <PreviewValue label="Född" value={snapshot.dog.birthDate} />
      </> : <Text style={styles.body}>Hunduppgifter saknas.</Text>}
    </View>}
    {snapshot.selected.latestWeight && <View style={styles.snapshotSection}>
      <Text style={styles.snapshotHeading}>Senaste registrerade vikt</Text>
      {snapshot.latestWeight ? <Text style={styles.previewValue}>{snapshot.latestWeight.weightKg.toLocaleString('sv-SE', { maximumFractionDigits: 3 })} kg · {snapshot.latestWeight.occurredOn}</Text> : <Text style={styles.body}>Ingen vikt har registrerats.</Text>}
      <Text style={styles.body}>Ägarregistrerad uppgift.</Text>
    </View>}
    {snapshot.selected.healthHistory && <View style={styles.snapshotSection}>
      <Text style={styles.snapshotHeading}>Utförda hälsoposter</Text>
      {snapshot.healthHistory.length ? snapshot.healthHistory.map((row, index) => <View key={`${row.type}-${row.occurredOn}-${index}`} style={styles.historyRow}>
        <Text style={styles.previewValue}>{row.type} · {row.occurredOn}</Text>
        <Text style={styles.body}>{row.note || 'Ingen anteckning har lagts till.'}</Text>
      </View>) : <Text style={styles.body}>Ingen utförd hälsopost finns bland de inlästa uppgifterna.</Text>}
    </View>}
  </View>;
}

function PreviewValue({ label, value }: { label: string; value: string }) {
  return <View style={styles.previewValueRow}><Text style={styles.previewLabel}>{label}</Text><Text style={styles.previewValue}>{value}</Text></View>;
}

function exportMessage(result: PassportExportResult): { text: string; error: boolean } {
  if (result.status === 'dialog-closed') return { text: 'Delningsdialogen har stängts. Tassla kan inte se om eller till vem filen delades.', error: false };
  if (result.status === 'unavailable') return { text: 'PDF:en kunde skapas, men delning är inte tillgänglig på den här enheten.', error: true };
  if (result.status === 'busy') return { text: 'En PDF håller redan på att skapas.', error: true };
  return { text: 'PDF:en kunde inte skapas eller öppnas för delning. Kontrollera att du fortfarande har åtkomst och försök igen.', error: true };
}

const styles = StyleSheet.create({
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.card, backgroundColor: '#E8EFE8', padding: 16 },
  heroIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: theme.colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { color: theme.colors.mutedText, fontSize: 15, lineHeight: 22, marginTop: 4 },
  fallback: { color: theme.colors.accent, fontSize: 19, fontWeight: '800' },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 23, marginBottom: 10 },
  selectionRow: { minHeight: 78, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  selectionIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center' },
  selectionCopy: { flex: 1 },
  selectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: theme.colors.accent },
  checkmark: { color: theme.colors.accent, fontWeight: '900', fontSize: 17, lineHeight: 19 },
  checkmarkChecked: { color: theme.colors.onAccent },
  disabled: { opacity: 0.6 },
  previewCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17, marginTop: 22 },
  previewHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  previewTag: { color: theme.colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginTop: 22 },
  snapshotSection: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 12 },
  snapshotHeading: { color: theme.colors.accent, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  previewValueRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  previewLabel: { width: 68, color: theme.colors.mutedText, fontSize: 15 },
  previewValue: { color: theme.colors.text, fontSize: 16, lineHeight: 22, fontWeight: '700', marginTop: 4 },
  historyRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 7, marginTop: 7 },
  limitNotice: { color: theme.colors.text, fontSize: 14, lineHeight: 20, borderRadius: 12, backgroundColor: '#F7F1E7', padding: 12, marginTop: 14 },
  disclaimer: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 13 },
  createdOn: { color: theme.colors.mutedText, fontSize: 14, fontWeight: '700', marginTop: 11 },
});
