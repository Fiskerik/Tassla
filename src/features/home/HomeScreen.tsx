import { StyleSheet, Text, View } from 'react-native';
import { Button, DogCard, EmptyState, HeroCard, InfoBanner, ListRow, SectionHeader, Skeleton } from '../../components/ui';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { PublishedTrainingProgram, PlannedHealthRecord } from '../../data/workspace-data';
import type { LogEvent, LogEventType } from '../puppy-log/log-model';
import { getGuidePreviewText } from '../knowledge/guide-body';
import { tokens } from '../../theme/tokens';

type Page = 'log' | 'training' | 'health' | 'more';

export function HomeScreen({ dog, ageWeeks, latestEvent, nextProgram, nextStep, plannedHealth, plannedHealthState, content, contentState, trainingState, onGo, onOpenContent, onOpenKnowledge, onRetryContent }: {
  dog: OwnedDog;
  ageWeeks: number;
  latestEvent: LogEvent | null;
  nextProgram: PublishedTrainingProgram | null;
  nextStep: PublishedTrainingProgram['steps'][number] | null;
  plannedHealth: PlannedHealthRecord[];
  plannedHealthState: 'loading' | 'ready' | 'error';
  content: HomeContent[];
  contentState: 'loading' | 'ready' | 'error';
  trainingState: 'loading' | 'ready' | 'error';
  onGo: (page: Page) => void;
  onOpenContent: (contentId: string) => void;
  onOpenKnowledge: () => void;
  onRetryContent: () => void;
}) {
  const nextHealth = plannedHealth
    .filter((record) => record.due_on >= new Date().toISOString().slice(0, 10))
    .sort((left, right) => left.due_on.localeCompare(right.due_on))[0] ?? null;

  return <View style={styles.screen}>
    <DogCard name={dog.name} breed={dog.breed_id} age={formatDogAge(dog.birth_date, ageWeeks)} />

    <SectionHeader title="Idag" />
    <ListRow category={latestEvent ? eventCategory(latestEvent.type) : 'pee'} title={latestEvent ? latestEvent.note || logTypeText(latestEvent.type) : 'Ingen logg ännu'} detail={latestEvent ? formatTime(latestEvent.occurredAt) : `Lägg till en händelse för ${dog.name}`} onPress={() => onGo('log')} />
    {trainingState === 'loading' && <Skeleton shape="row" />}
    {trainingState === 'error' && <ListRow category="training" title="Träningen kunde inte hämtas" detail="Försök igen under Träning" onPress={() => onGo('training')} />}
    {trainingState === 'ready' && nextProgram && nextStep && <ListRow category="training" title={nextStep.title} detail={nextProgram.title} onPress={() => onGo('training')} />}
    {trainingState === 'ready' && (!nextProgram || !nextStep) && <ListRow category="training" title="Inget nästa steg ännu" detail="Publicerade program visas här" onPress={() => onGo('training')} />}
    {plannedHealthState === 'loading' && <Skeleton shape="row" />}
    {plannedHealthState === 'error' && <ListRow category="veterinary" title="Hälsodatum kunde inte hämtas" detail="Försök igen under Hälsa" onPress={() => onGo('health')} />}
    {plannedHealthState === 'ready' && nextHealth && <ListRow category={nextHealth.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={nextHealth.description || (nextHealth.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök')} detail={formatDate(nextHealth.due_on)} onPress={() => onGo('health')} />}
    {plannedHealthState === 'ready' && !nextHealth && <ListRow category="veterinary" title="Inga planerade hälsohändelser" detail="Lägg till under Hälsa" onPress={() => onGo('health')} />}

    <SectionHeader title={`För dig och ${dog.name}`} />
    {contentState === 'loading' && <Skeleton shape="card" lines={3} />}
    {contentState === 'error' && <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" onPress={onRetryContent} />}>Publicerat innehåll kunde inte hämtas.</InfoBanner>}
    {contentState === 'ready' && content.length === 0 && <EmptyState title={`Inga guider för ${dog.name} ännu`} actionLabel="Öppna Kunskap" onAction={onOpenKnowledge} />}
    {contentState === 'ready' && content.slice(0, 2).map((item) => <HeroCard key={item.id} title={item.title} meta={getGuidePreviewText(item.body)} onPress={() => onOpenContent(item.id)} />)}

    <Text style={styles.caption}>Innehåll visas endast när det är publicerat och relevant för {dog.name}.</Text>
  </View>;
}

function eventCategory(type: LogEventType): 'pee' | 'poop' | 'food' | 'sleep' | 'awake' | 'walk' {
  return type;
}

function logTypeText(type: LogEventType): string {
  return type === 'pee' ? 'Kiss' : type === 'poop' ? 'Bajs' : type === 'food' ? 'Mat' : type === 'sleep' ? 'Sömn' : type === 'awake' ? 'Vaken' : 'Promenad';
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`));
}

function formatDogAge(birthDate: string, weeks: number): string {
  if (weeks < 8) return `${weeks} ${weeks === 1 ? 'vecka' : 'veckor'} gammal`;
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years > 0 && remainingMonths > 0) return `${years} år och ${remainingMonths} ${remainingMonths === 1 ? 'månad' : 'månader'} gammal`;
  if (years > 0) return `${years} år gammal`;
  return `${Math.max(1, months)} ${months === 1 ? 'månad' : 'månader'} gammal`;
}

const styles = StyleSheet.create({
  screen: { alignSelf: 'stretch', gap: tokens.spacing.sm },
  caption: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
});
