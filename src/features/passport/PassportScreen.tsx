import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { Toast } from '../../components/ui/Toast';
import { fetchBreeds, type BreedOption, type OwnedDog } from '../../data/app-data';
import type { HealthHistoryRecord, HealthWeightRecord } from '../../data/workspace-data';
import { localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';
import { IconChip } from '../../components/ui/IconChip';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
    if (!statusMessage || statusError) { setToastMessage(null); return; }
    setToastMessage(statusMessage);
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [statusMessage, statusError]);
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
          {iconsLoaded ? <IconChip category="veterinary" size="large" /> : <Text style={styles.fallback}>T</Text>}
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
            <Text style={styles.previewTitle} accessibilityRole="header">Förhandsvisning</Text>
          </View>
          {visibleSnapshot ? <SnapshotPreview snapshot={visibleSnapshot} /> : (
            <Text style={styles.body}>{selectedAny ? 'Förhandsvisningen visas när de valda uppgifterna är inlästa och sparstatusen är säker.' : 'Välj minst ett avsnitt för att se en förhandsvisning.'}</Text>
          )}
          {selection.healthHistory && <Text style={styles.limitNotice}>Högst 50 senast inlästa utförda poster visas. Äldre uppgifter kan saknas på grund av historikens servergräns.</Text>}
          <Text style={styles.disclaimer}>Uppgifterna är registrerade av hundägaren. Tassla-pass är ingen officiell journal, legitimation eller vaccinationshandling.</Text>
          {visibleSnapshot && <Text style={styles.createdOn}>Skapad {visibleSnapshot.createdOn}</Text>}
        </View>
        {statusMessage && statusError ? <MessageCard tone="error">{statusMessage}</MessageCard> : null}
        <PrimaryButton title={exporting ? 'Skapar PDF…' : 'Skapa PDF och öppna delning'} disabled={!ready || !snapshot || busy || !selectedAny} onPress={() => { void createAndShare(); }} />
        {toastMessage ? <Toast tone="neutral" message={toastMessage} /> : null}
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
      {iconsLoaded ? <Ionicons name={icon} size={tokens.size.iconSm} color={tokens.colors.primary} /> : <Text style={styles.fallback}>•</Text>}
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
        {snapshot.showIllustration && <View style={styles.illustrationFallback}><Text style={styles.illustrationMark}>T</Text><Text style={styles.illustrationLabel}>Tassla-illustration · inte hundens foto</Text></View>}
        <PreviewValue label="Namn" value={snapshot.dog.name} />
        <PreviewValue label="Ras" value={snapshot.dog.breed} />
        <PreviewValue label="Född" value={snapshot.dog.birthDate} />
      </> : <Text style={styles.body}>Hunduppgifter saknas.</Text>}
    </View>}
    {snapshot.selected.latestWeight && <View style={styles.snapshotSection}>
      <Text style={styles.snapshotHeading}>Senaste registrerade vikt</Text>
      {snapshot.latestWeight ? <Text style={styles.previewValue}>{snapshot.latestWeight.weightKg.toLocaleString('sv-SE', { maximumFractionDigits: 3 })} kg · {snapshot.latestWeight.occurredOn}</Text> : <Text style={styles.body}>Ingen vikt har registrerats.</Text>}
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
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.selectedSurface, padding: tokens.layout.cardPadding },
  heroIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  body: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.xs },
  fallback: { color: tokens.colors.primary, ...tokens.typography.label },
  sectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginTop: tokens.layout.sectionGap, marginBottom: tokens.layout.headingGap },
  selectionRow: { minHeight: tokens.size.touchMin + tokens.spacing.xxl, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.spacing.md, marginTop: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  selectionIcon: { width: tokens.size.chipMd + tokens.spacing.sm, height: tokens.size.chipMd + tokens.spacing.sm, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface, alignItems: 'center', justifyContent: 'center' },
  selectionCopy: { flex: 1 },
  selectionTitle: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  checkbox: { width: tokens.spacing.xxl, height: tokens.spacing.xxl, borderRadius: tokens.radius.sm, borderWidth: 2, borderColor: tokens.colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: tokens.colors.primary },
  checkmark: { color: tokens.colors.primary, fontWeight: '900', fontSize: 17, lineHeight: 19 },
  checkmarkChecked: { color: tokens.colors.onPrimary },
  disabled: { opacity: 0.6 },
  previewCard: { borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginTop: tokens.layout.sectionGap },
  previewHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  previewTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading },
  snapshotSection: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.md, marginTop: tokens.spacing.md },
  illustrationFallback: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, padding: tokens.spacing.md, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.successSurface, marginBottom: tokens.spacing.md },
  illustrationMark: { width: tokens.size.chipMd, height: tokens.size.chipMd, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.primary, color: tokens.colors.onPrimary, textAlign: 'center', textAlignVertical: 'center', fontSize: 22, fontWeight: '800' },
  illustrationLabel: { flex: 1, color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  snapshotHeading: { color: tokens.colors.primary, ...tokens.typography.label, marginBottom: tokens.spacing.sm },
  previewValueRow: { flexDirection: 'row', gap: tokens.spacing.md, marginTop: tokens.spacing.xs },
  previewLabel: { width: 68, color: tokens.colors.textSecondary, ...tokens.typography.caption },
  previewValue: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginTop: tokens.spacing.xs },
  historyRow: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.sm, marginTop: tokens.spacing.sm },
  limitNotice: { color: tokens.colors.textPrimary, ...tokens.typography.caption, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.background, padding: tokens.spacing.md, marginTop: tokens.spacing.md },
  disclaimer: { color: tokens.colors.textSecondary, ...tokens.typography.caption, marginTop: tokens.spacing.md },
  createdOn: { color: tokens.colors.textSecondary, ...tokens.typography.caption, fontWeight: '700', marginTop: tokens.spacing.md },
});
