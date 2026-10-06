import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import * as ExpoCrypto from 'expo-crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import {
  deleteDogEvent,
  deleteTrainingProgress,
  fetchDogEventById,
  fetchDogEvents,
  fetchHomeContent,
  fetchTrainingWorkspace,
  insertDogEvent,
  insertTrainingProgress,
  updateDogEvent,
  type DogEventOperation,
  type DogEventRecord,
  type PublishedTrainingProgram,
  type PausedTrainingProgress,
  type WriteOutcome,
} from '../../data/workspace-data';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import { ageInWeeks, localDate } from '../onboarding/dog';
import { HealthScreen } from '../health/HealthScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { LogScreen } from '../puppy-log/LogScreen';
import { type LogEvent, type LogEventChanges, type LogEventType } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { PublishedTrainingScreen } from '../training/PublishedTrainingScreen';
import { theme } from '../../theme/tokens';
import { useAuth } from '../account/AuthProvider';

type ProductPage = 'home' | 'log' | 'training' | 'more' | 'health' | 'knowledge' | 'passport' | 'profile';
type PendingLogMutation =
  | { kind: 'insert'; operation: DogEventOperation }
  | { kind: 'update'; id: string; changes: { event_type: LogEventType; occurred_at: string; duration_minutes: number | null; description: string | null } }
  | { kind: 'delete'; id: string };

const PAGE_SIZE = 40;

export function ProductWorkspace({ client, dog }: { client: SupabaseClient; dog: OwnedDog }) {
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [page, setPage] = useState<ProductPage>('home');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [pageOpacity] = useState(() => new Animated.Value(1));
  const [content, setContent] = useState<HomeContent[]>([]);
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [events, setEvents] = useState<DogEventRecord[]>([]);
  const eventRows = useRef<DogEventRecord[]>([]);
  const [logState, setLogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const [logMessage, setLogMessage] = useState('');
  const [logMessageError, setLogMessageError] = useState(false);
  const [training, setTraining] = useState<{ programs: PublishedTrainingProgram[]; paused: PausedTrainingProgress[] }>({ programs: [], paused: [] });
  const [trainingState, setTrainingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [trainingError, setTrainingError] = useState('');
  const [busyStepKey, setBusyStepKey] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const signOutInFlight = useRef(false);
  const pendingLogMutation = useRef<PendingLogMutation | null>(null);
  const logMutationInFlight = useRef(false);
  const trainingMutationInFlight = useRef(false);
  const mounted = useRef(false);
  const eventReadQueue = useRef<Promise<void>>(Promise.resolve());
  const loadMoreInFlight = useRef(false);
  const { signOut } = useAuth();
  const age = ageInWeeks(dog.birth_date, localDate());

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    pageOpacity.stopAnimation();
    if (reduceMotion) {
      pageOpacity.setValue(1);
      return;
    }
    pageOpacity.setValue(0);
    Animated.timing(pageOpacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    return () => pageOpacity.stopAnimation();
  }, [page, pageOpacity, reduceMotion]);

  const serializeEventRead = useCallback(<T,>(read: () => Promise<T>): Promise<T> => {
    const request = eventReadQueue.current.catch(() => undefined).then(read);
    eventReadQueue.current = request.then(() => undefined, () => undefined);
    return request;
  }, []);

  const reloadEvents = useCallback(async (signal?: AbortSignal) => {
    const rows = await serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, signal));
    if (!mounted.current || signal?.aborted) return;
    eventRows.current = rows;
    setEvents(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLogState('ready');
  }, [client, dog.id, serializeEventRead]);

  const reloadTraining = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchTrainingWorkspace(client, dog, age, undefined, signal);
    if (!mounted.current || signal?.aborted) return;
    setTraining(result);
    setTrainingState('ready');
  }, [age, client, dog]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void fetchHomeContent(client, dog, age, undefined, controller.signal).then((items) => {
      if (controller.signal.aborted || !mounted.current) return;
      setContent(items);
      setContentState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current) setContentState('error');
    });
    void serializeEventRead(() => fetchDogEvents(client, dog.id, 0, PAGE_SIZE, undefined, controller.signal)).then((rows) => {
      if (controller.signal.aborted || !mounted.current) return;
      eventRows.current = rows;
      setEvents(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLogState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current) setLogState('error');
    });
    void fetchTrainingWorkspace(client, dog, age, undefined, controller.signal).then((result) => {
      if (controller.signal.aborted || !mounted.current) return;
      setTraining(result);
      setTrainingState('ready');
    }).catch(() => {
      if (!controller.signal.aborted && mounted.current) {
        setTrainingError('Publicerat träningsinnehåll kunde inte hämtas. Inga exempelprogram visas.');
        setTrainingState('error');
      }
    });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [age, client, dog, serializeEventRead]);

  const displayEvents = useMemo(() => events.map(toLogEvent), [events]);
  const latestEvent = events[0];
  const nextProgram = training.programs.find((program) => program.steps.some((step) => !program.completedStepIds.includes(step.id)));
  const nextStep = nextProgram?.steps.find((step) => !nextProgram.completedStepIds.includes(step.id));

  async function loadMoreEvents() {
    if (loadMoreInFlight.current || loadingMore || !hasMore) return;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    try {
      const next = await serializeEventRead(() => fetchDogEvents(client, dog.id, eventRows.current.length, PAGE_SIZE));
      if (!mounted.current) return;
      const merged = [...eventRows.current, ...next.filter((row) => !eventRows.current.some((existing) => existing.id === row.id))];
      eventRows.current = merged;
      setEvents(merged);
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      if (!mounted.current) return;
      setLogMessage('Äldre poster kunde inte hämtas. Försök igen när anslutningen fungerar.');
      setLogMessageError(true);
    } finally {
      loadMoreInFlight.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }

  async function runLogMutation(mutation: PendingLogMutation) {
    if (logMutationInFlight.current) return false;
    logMutationInFlight.current = true;
    setLogBusy(true);
    setLogMessage('');
    setLogMessageError(false);
    let outcome: WriteOutcome<DogEventRecord | null>;
    try {
      if (mutation.kind === 'insert') outcome = await insertDogEvent(client, mutation.operation);
      else if (mutation.kind === 'update') outcome = await updateDogEvent(client, dog.id, mutation.id, mutation.changes);
      else outcome = await deleteDogEvent(client, dog.id, mutation.id);
      if (!mounted.current) return false;
      if (outcome.status === 'saved') {
        pendingLogMutation.current = null;
        setLogMessage('Ändringen är sparad.');
        try {
          await reloadEvents();
        } catch {
          if (mounted.current) {
            setLogMessage('Ändringen är sparad, men logghistoriken kunde inte uppdateras.');
            setLogMessageError(true);
          }
        }
        return true;
      }
      if (outcome.status === 'unknown') {
        pendingLogMutation.current = mutation;
        setLogMessage('Sparstatus är osäker. Kontrollera samma post innan du försöker igen.');
        setLogMessageError(true);
        return false;
      }
      pendingLogMutation.current = null;
      setLogMessage('Ändringen kunde inte sparas. Kontrollera anslutningen och försök igen.');
      setLogMessageError(true);
      return false;
    } catch {
      if (!mounted.current) return false;
      pendingLogMutation.current = mutation;
      setLogMessage('Sparstatus är osäker. Kontrollera samma post innan du försöker igen.');
      setLogMessageError(true);
      return false;
    } finally {
      logMutationInFlight.current = false;
      if (mounted.current) setLogBusy(false);
    }
  }

  function addEvent(type: LogEventType) {
    if (pendingLogMutation.current || logMutationInFlight.current) return;
    const operation: DogEventOperation = {
      id: ExpoCrypto.randomUUID(),
      dog_id: dog.id,
      event_type: type,
      occurred_at: new Date().toISOString(),
      duration_minutes: null,
      description: null,
    };
    const mutation: PendingLogMutation = { kind: 'insert', operation };
    pendingLogMutation.current = mutation;
    void runLogMutation(mutation);
  }

  async function updateEvent(id: string, changes: LogEventChanges): Promise<boolean> {
    if (pendingLogMutation.current || logMutationInFlight.current) return false;
    const previous = events.find((event) => event.id === id);
    if (!previous) return false;
    const eventType = changes.type ?? previous.event_type;
    const mutation: PendingLogMutation = {
      kind: 'update',
      id,
      changes: {
        event_type: eventType,
        occurred_at: changes.occurredAt ?? previous.occurred_at,
        duration_minutes: eventType === 'sleep' || eventType === 'walk' ? previous.duration_minutes : null,
        description: changes.note?.trim() || null,
      },
    };
    pendingLogMutation.current = mutation;
    return runLogMutation(mutation);
  }

  async function deleteEvent(id: string) {
    if (pendingLogMutation.current || logMutationInFlight.current) return;
    const mutation: PendingLogMutation = { kind: 'delete', id };
    pendingLogMutation.current = mutation;
    await runLogMutation(mutation);
  }

  async function retryLogMutation() {
    const mutation = pendingLogMutation.current;
    if (mutation?.kind === 'insert') {
      setLogBusy(true);
      try {
        const found = await fetchDogEventById(client, dog.id, mutation.operation.id);
        if (!mounted.current) return;
        if (found) {
          pendingLogMutation.current = null;
          try {
            await reloadEvents();
            setLogMessage('Posten är sparad och återläst.');
            setLogMessageError(false);
          } catch {
            setLogMessage('Posten är sparad, men logghistoriken kunde inte uppdateras.');
            setLogMessageError(true);
          }
          return;
        }
        await runLogMutation(mutation);
      } catch {
        if (!mounted.current) return;
        setLogMessage('Sparstatus kunde inte kontrolleras. Samma post väntar på en ny kontroll.');
        setLogMessageError(true);
      } finally {
        if (mounted.current) setLogBusy(false);
      }
    } else if (mutation) await runLogMutation(mutation);
    else {
      try {
        await reloadEvents();
        if (!mounted.current) return;
        setLogMessage('Loggen är uppdaterad.');
        setLogMessageError(false);
      } catch {
        if (!mounted.current) return;
        setLogMessage('Loggen kunde inte kontrolleras. Försök igen.');
        setLogMessageError(true);
      }
    }
  }

  async function retryContent() {
    setContentState('loading');
    try {
      const items = await fetchHomeContent(client, dog, age);
      if (!mounted.current) return;
      setContent(items);
      setContentState('ready');
    } catch {
      if (mounted.current) setContentState('error');
    }
  }

  async function retryEvents() {
    setLogState('loading');
    try {
      await reloadEvents();
    } catch {
      if (mounted.current) setLogState('error');
    }
  }

  async function retryTraining() {
    setTrainingState('loading');
    try {
      await reloadTraining();
      if (mounted.current) setTrainingError('');
    } catch {
      if (mounted.current) setTrainingState('error');
    }
  }

  async function completeStep(program: PublishedTrainingProgram, stepId: string): Promise<boolean> {
    if (trainingMutationInFlight.current) return false;
    const key = `${program.id}:${stepId}`;
    trainingMutationInFlight.current = true;
    setBusyStepKey(key);
    setTrainingError('');
    try {
      const outcome = await insertTrainingProgress(client, { dog_id: dog.id, program_version_id: program.id, step_id: stepId });
      if (outcome.status === 'saved') {
        try {
          await reloadTraining();
          if (!mounted.current) return false;
          return true;
        } catch {
          if (!mounted.current) return false;
          setTrainingState('error');
          setTrainingError('Steget är sparat, men programstatus kunde inte hämtas. Läs in programmet igen innan du fortsätter.');
          return false;
        }
      }
      let progressChecked = true;
      try {
        await reloadTraining();
      } catch {
        progressChecked = false;
      }
      if (!mounted.current) return false;
      setTrainingError(!progressChecked
        ? 'Stegets sparstatus kunde inte kontrolleras. Försök läsa programmet igen innan du registrerar på nytt.'
        : outcome.status === 'unknown'
          ? 'Sparstatus är osäker. Programmet har kontrollerats; om steget saknas kan du försöka igen.'
          : 'Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } catch {
      if (!mounted.current) return false;
      setTrainingError('Steget kunde inte registreras. Kontrollera anslutningen och försök igen.');
      return false;
    } finally {
      trainingMutationInFlight.current = false;
      if (mounted.current) setBusyStepKey(null);
    }
  }

  async function resetProgram(program: PublishedTrainingProgram) {
    if (trainingMutationInFlight.current) return;
    trainingMutationInFlight.current = true;
    setBusyStepKey(`${program.id}:reset`);
    setTrainingError('');
    try {
      for (const stepId of program.completedStepIds) {
        const outcome = await deleteTrainingProgress(client, dog.id, program.id, stepId);
        if (!mounted.current) return;
        if (outcome.status !== 'saved') throw new Error('Progress could not be cleared');
      }
      await reloadTraining();
    } catch {
      if (!mounted.current) return;
      try {
        await reloadTraining();
        setTrainingError('Alla registreringar kunde inte rensas. Kontrollera programmet och försök igen.');
      } catch {
        setTrainingState('error');
        setTrainingError('Rensningens status kunde inte läsas in. Hämta programmet igen innan du ändrar det.');
      }
    } finally {
      trainingMutationInFlight.current = false;
      if (mounted.current) setBusyStepKey(null);
    }
  }

  async function handleSignOut() {
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setSigningOut(true);
    let result = { localSessionCleared: false, serverRevocationConfirmed: false };
    try {
      result = await signOut();
    } catch {
      result = { localSessionCleared: false, serverRevocationConfirmed: false };
    } finally {
      if (mounted.current) setSigningOut(false);
      signOutInFlight.current = false;
    }
    if (mounted.current) setSignOutError(!result.localSessionCleared);
  }

  function confirmSignOut() {
    if (signingOut) return;
    Alert.alert('Logga ut?', 'Du kan logga in igen när du vill.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Bekräfta', style: 'destructive', onPress: () => { void handleSignOut(); } },
    ]);
  }

  if (!fontsLoaded && !fontError) return <AppScreen><MessageCard>Laddar Tasslas ikoner…</MessageCard></AppScreen>;
  if (fontError) return <AppScreen><MessageCard tone="error">Ikonerna kunde inte laddas. Starta om appen och försök igen.</MessageCard></AppScreen>;

  const pageContent = renderPage();
  return <AppScreen key={page} footer={<BottomNavigation page={page} onNavigate={setPage} />}>
    <Animated.View style={{ opacity: pageOpacity }}>{pageContent}</Animated.View>
  </AppScreen>;

  function renderPage() {
    if (page === 'home') return <HomePage
      dog={dog}
      ageWeeks={age}
      latestEvent={latestEvent ? toLogEvent(latestEvent) : null}
      nextProgram={nextProgram ?? null}
      nextStep={nextStep ?? null}
      content={content}
      contentState={contentState}
      trainingState={trainingState}
      onGo={setPage}
      onRetryContent={() => { void retryContent(); }}
    />;
    if (page === 'log') return <>
      {logState === 'loading' && <PageHeading title="Vardagslogg" description="Hämtar hundens logg…" />}
      {logState === 'error' && <>
        <PageHeading title="Vardagslogg" description="Loggen kunde inte hämtas." />
        <PrimaryButton title="Försök igen" onPress={() => { void retryEvents(); }} />
      </>}
      {logState === 'ready' && <LogScreen events={displayEvents} onAdd={addEvent} onUpdate={updateEvent} onDelete={deleteEvent}
        mode="cloud" busy={logBusy} statusMessage={logMessage} statusError={logMessageError}
        onRetryPending={() => { void retryLogMutation(); }} hasMore={hasMore} loadingMore={loadingMore}
        onLoadMore={() => { void loadMoreEvents(); }} />}
    </>;
    if (page === 'training') return <>
      {trainingState === 'loading' && <PageHeading title="Träning" description="Hämtar publicerade program…" />}
      {trainingState === 'error' && <>
        <PageHeading title="Träning" description="Programmen kunde inte hämtas." />
        <MessageCard tone="error">{trainingError}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { void retryTraining(); }} />
      </>}
      {trainingState === 'ready' && <PublishedTrainingScreen programs={training.programs} paused={training.paused}
        busyStepKey={busyStepKey} error={trainingError} onCompleteStep={completeStep}
        onContinue={() => setTrainingError('')} onResetProgram={(program) => { void resetProgram(program); }}
        onRetry={() => { void retryTraining(); }} />}
    </>;
    if (page === 'more') return <MorePage onNavigate={setPage} signOutError={signOutError} signingOut={signingOut} onSignOut={confirmSignOut} />;
    if (page === 'health') return <HealthScreen onBack={() => setPage('more')} />;
    if (page === 'knowledge') return <KnowledgeScreen onBack={() => setPage('more')} items={content.filter((item) => item.contentType !== 'training_program')} />;
    if (page === 'passport') return <PassportScreen onBack={() => setPage('more')} />;
    return <DogProfilePage dog={dog} onBack={() => setPage('more')} />;
  }
}

function HomePage({
  dog, ageWeeks, latestEvent, nextProgram, nextStep, content, contentState, trainingState,
  onGo, onRetryContent,
}: {
  dog: OwnedDog;
  ageWeeks: number;
  latestEvent: LogEvent | null;
  nextProgram: PublishedTrainingProgram | null;
  nextStep: PublishedTrainingProgram['steps'][number] | null;
  content: HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  trainingState: 'loading' | 'ready' | 'error';
  onGo: (page: ProductPage) => void;
  onRetryContent: () => void;
}) {
  return <View>
    <View style={styles.homeHeader}>
      <Text style={styles.eyebrow}>ER HUNDRESA</Text>
      <Text style={styles.homeTitle} accessibilityRole="header">Hej, {dog.name}!</Text>
      <Text style={styles.homeSubtitle}>{formatDogAge(dog.birth_date, ageWeeks)}</Text>
    </View>
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeCopy}>
        <Text style={styles.welcomeEyebrow}>TILLSAMMANS</Text>
        <Text style={styles.welcomeTitle}>En dag i taget.</Text>
        <Text style={styles.welcomeBody}>Små minnen och trygga steg i hundens vardag.</Text>
      </View>
      <Image source={require('../../../assets/images/dog-welcome.png')} style={styles.welcomeImage} accessibilityLabel="Dekorativ bild av en hund i ett varmt hem" />
    </View>
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle} accessibilityRole="header">För er just nu</Text><Ionicons name="sparkles-outline" size={22} color={theme.colors.accent} /></View>
    {contentState === 'loading' && <MessageCard>Hämtar publicerat innehåll…</MessageCard>}
    {contentState === 'error' && <>
      <MessageCard tone="error">Innehållet kunde inte hämtas. Vi visar inget tills anslutningen fungerar igen.</MessageCard>
      <PrimaryButton title="Försök igen" onPress={onRetryContent} />
    </>}
    {contentState === 'ready' && content.length === 0 && <MessageCard>Det finns inget publicerat innehåll för {dog.name}s ålder och ras ännu. Nya guider visas här när de är klara.</MessageCard>}
    {contentState === 'ready' && content.slice(0, 2).map((item) => <View key={item.id} style={styles.contentCard}>
      <Text style={styles.cardEyebrow}>{contentTypeLabel(item.contentType)}</Text>
      <Text style={styles.contentTitle}>{item.title}</Text>
      <Text style={styles.contentBody}>{item.body}</Text>
    </View>)}
    <View style={styles.sectionHeading}><Text style={styles.sectionTitle} accessibilityRole="header">Hundens vardag</Text><Ionicons name="calendar-outline" size={22} color={theme.colors.accent} /></View>
    <View style={styles.summaryCard}>
      <Text style={styles.cardEyebrow}>SENASTE I LOGGEN</Text>
      {latestEvent
        ? <Text style={styles.summaryText}>{latestEvent.note || logTypeText(latestEvent.type)} · {new Date(latestEvent.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        : <Text style={styles.summaryText}>Inga loggposter ännu. Lägg till en liten händelse när ni vill.</Text>}
      <QuietButton title="Öppna loggen" onPress={() => onGo('log')} />
    </View>
    <View style={styles.summaryCard}>
      <Text style={styles.cardEyebrow}>NÄSTA TRÄNINGSSTEG</Text>
      {trainingState === 'loading' && <Text style={styles.summaryText}>Hämtar publicerade program…</Text>}
      {trainingState === 'error' && <Text style={styles.summaryText}>Programmen kunde inte hämtas just nu.</Text>}
      {trainingState === 'ready' && nextProgram && nextStep && <>
        <Text style={styles.summaryTitle}>{nextProgram.title}</Text>
        <Text style={styles.summaryText}>{nextStep.title}</Text>
        <QuietButton title="Öppna nästa steg" onPress={() => onGo('training')} />
      </>}
      {trainingState === 'ready' && !nextProgram && <Text style={styles.summaryText}>Inget publicerat nästa steg ännu. Nya program visas här när de är klara.</Text>}
    </View>
    <View style={styles.shortcuts}>
      <Shortcut icon="create-outline" label="Logga" onPress={() => onGo('log')} />
      <Shortcut icon="school-outline" label="Träning" onPress={() => onGo('training')} />
      <Shortcut icon="ellipsis-horizontal-circle-outline" label="Mer" onPress={() => onGo('more')} />
    </View>
  </View>;
}

function MorePage({ onNavigate, signOutError, signingOut, onSignOut }: { onNavigate: (page: ProductPage) => void; signOutError: boolean; signingOut: boolean; onSignOut: () => void }) {
  return <View>
    <PageHeading title="Mer" description="Fler delar av hundens resa, samlade på ett ställe." />
    <MenuRow icon="book-outline" title="Kunskap" detail="Publicerade guider och checklistor" onPress={() => onNavigate('knowledge')} />
    <MenuRow icon="id-card-outline" title="Tassla-pass" detail="En ärlig överblick, utan export" onPress={() => onNavigate('passport')} />
    <MenuRow icon="paw-outline" title="Hundprofil" detail="Din hunds uppgifter" onPress={() => onNavigate('profile')} />
    {signOutError && <MessageCard tone="error">Det gick inte att logga ut just nu. Försök igen.</MessageCard>}
    <QuietButton title={signingOut ? 'Loggar ut…' : 'Logga ut'} disabled={signingOut} onPress={onSignOut} />
  </View>;
}

function DogProfilePage({ dog, onBack }: { dog: OwnedDog; onBack: () => void }) {
  return <View>
    <QuietButton title="Tillbaka till Mer" onPress={onBack} />
    <PageHeading title="Hundprofil" description="Uppgifterna används för att välja ålders- och rasrelevant innehåll." />
    <View style={styles.profileCard}>
      <Text style={styles.cardEyebrow}>HUNDENS NAMN</Text><Text style={styles.profileValue}>{dog.name}</Text>
      <Text style={styles.cardEyebrow}>RAS</Text><Text style={styles.profileValue}>{dog.breed_id}</Text>
      <Text style={styles.cardEyebrow}>FÖDELSEDATUM</Text><Text style={styles.profileValue}>{dog.birth_date}</Text>
    </View>
    <MessageCard>Profiländring är inte tillgänglig här ännu. Hundens uppgifter har hämtats från ditt konto.</MessageCard>
  </View>;
}

function MenuRow({ icon, title, detail, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
    <Ionicons name={icon} size={23} color={theme.colors.accent} />
    <View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuDetail}>{detail}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.mutedText} />
  </Pressable>;
}

function Shortcut({ icon, label, onPress }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
    <Ionicons name={icon} size={22} color={theme.colors.accent} />
    <Text style={styles.shortcutLabel}>{label}</Text>
  </Pressable>;
}

function BottomNavigation({ page, onNavigate }: { page: ProductPage; onNavigate: (page: ProductPage) => void }) {
  const tabs: { id: ProductPage; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
    { id: 'home', label: 'Hem', icon: page === 'home' ? 'home' : 'home-outline' },
    { id: 'log', label: 'Logg', icon: page === 'log' ? 'create' : 'create-outline' },
    { id: 'training', label: 'Träning', icon: page === 'training' ? 'school' : 'school-outline' },
    { id: 'health', label: 'Hälsa', icon: page === 'health' ? 'heart' : 'heart-outline' },
    { id: 'more', label: 'Mer', icon: ['more', 'knowledge', 'passport', 'profile'].includes(page) ? 'grid' : 'grid-outline' },
  ];
  return <View style={styles.bottomNavigation}>
    {tabs.map((tab) => {
      const selected = tab.id === page || (tab.id === 'more' && ['knowledge', 'passport', 'profile'].includes(page));
      return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label}
        onPress={() => onNavigate(tab.id)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
        <Ionicons name={tab.icon} size={22} color={selected ? theme.colors.accent : theme.colors.mutedText} />
        <Text style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
}

function toLogEvent(row: DogEventRecord): LogEvent {
  return { id: row.id, dogId: row.dog_id, type: row.event_type, occurredAt: row.occurred_at, note: row.description, origin: 'local-test' };
}

function formatDogAge(birthDate: string, weeks: number): string {
  if (weeks < 8) return `${weeks} ${weeks === 1 ? 'vecka' : 'veckor'} gammal`;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date(`${localDate()}T00:00:00`);
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) return `${years} ${years === 1 ? 'år' : 'år'} och ${remainingMonths} ${remainingMonths === 1 ? 'månad' : 'månader'} gammal`;
  if (years > 0) return `${years} ${years === 1 ? 'år' : 'år'} gammal`;
  return `${Math.max(1, months)} ${months === 1 ? 'månad' : 'månader'} gammal`;
}

function contentTypeLabel(type: HomeContent['contentType']): string {
  return type === 'article' ? 'KUNSKAP' : type === 'guide' ? 'GUIDE' : type === 'checklist' ? 'CHECKLISTA' : 'TRÄNING';
}

function logTypeText(type: LogEventType): string {
  return type === 'pee' ? 'Kiss' : type === 'poop' ? 'Bajs' : type === 'food' ? 'Mat' : type === 'sleep' ? 'Sömn' : type === 'awake' ? 'Vaken' : 'Promenad';
}

const styles = StyleSheet.create({
  homeHeader: { marginTop: 30, marginBottom: 20 },
  eyebrow: { color: theme.colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '800' },
  homeTitle: { color: theme.colors.text, fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.7, marginTop: 10 },
  homeSubtitle: { color: theme.colors.mutedText, fontSize: 16, marginTop: 4 },
  welcomeCard: { minHeight: 176, flexDirection: 'row', overflow: 'hidden', borderRadius: theme.radius.card, backgroundColor: '#E8E3D6', marginBottom: 26 },
  welcomeCopy: { flex: 1, justifyContent: 'center', padding: 18 },
  welcomeEyebrow: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  welcomeTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: 8 },
  welcomeBody: { color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 5 },
  welcomeImage: { width: '42%', height: '100%', resizeMode: 'cover' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 10 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  contentCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17, marginTop: 8 },
  cardEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 7 },
  contentTitle: { color: theme.colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  contentBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 21, marginTop: 7 },
  summaryCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, marginTop: 8 },
  summaryTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  summaryText: { color: theme.colors.mutedText, fontSize: 15, lineHeight: 22 },
  shortcuts: { flexDirection: 'row', gap: 9, marginTop: 20 },
  shortcut: { flex: 1, minHeight: 68, borderRadius: theme.radius.button, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center', gap: 5 },
  shortcutLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  menuRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, marginBottom: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  menuDetail: { color: theme.colors.mutedText, fontSize: 13, marginTop: 3 },
  profileCard: { borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 18, borderColor: theme.colors.border, borderWidth: 1 },
  profileValue: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginBottom: 18 },
  bottomNavigation: { minHeight: 68, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 8, paddingTop: 5, paddingBottom: 4 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  tabLabel: { color: theme.colors.mutedText, fontSize: 11, fontWeight: '700', marginTop: 3 },
  selectedTabLabel: { color: theme.colors.accent, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
