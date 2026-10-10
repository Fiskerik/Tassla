import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppBar, Button, Card, ListRow, SectionHeader, Skeleton } from '../../components/ui';
import { MotionPressable, ScreenTransition } from '../../components/ui/Motion';
import type { HomeContent, OwnedDog } from '../../data/app-data';
import type { PlannedHealthRecord } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';
import { formatDogAge, localDate } from '../onboarding/dog';
import { LOG_EVENT_LABELS, localDateTimeParts, type LogEvent } from '../puppy-log/log-model';
import { HomeCarousel } from './HomeCarousel';

type Destination = 'log' | 'training' | 'health' | 'profile' | 'notification-settings' | 'planned-health' | 'knowledge';
export function HomeScreen({ dog, breed = '', events, plans = [], content, contentState, logState = 'ready', planState = 'ready', nextStep, onGo, onOpenContent, onRetryContent }: {
  dog: OwnedDog; breed?: string; events: readonly LogEvent[]; plans?: readonly PlannedHealthRecord[];
  content: readonly HomeContent[]; contentState: 'loading' | 'ready' | 'error';
  logState?: 'loading' | 'ready' | 'error'; planState?: 'loading' | 'ready' | 'error'; nextStep?: string;
  onGo: (page: Destination) => void; onOpenContent: (id: string) => void; onRetryContent: () => void;
}) {
  const today = localDate();
  const [selected, setSelected] = useState(today);
  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() + index - 2);
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`, date };
  });
  const dailyEvents = events.filter((event) => localDateTimeParts(event.occurredAt).date === selected);
  const dailyPlans = plans.filter((plan) => plan.due_on === selected);
  const age = formatDogAge(dog.birth_date, today);
  return <View>
    <AppBar mode="Home" title="Tassla" onAction={() => onGo('notification-settings')} />
    <Card accessibilityLabel={`${dog.name}. ${age}${breed ? ` · ${breed}` : ''}`}>
      <View style={styles.dogSummary}>
        <Image source={require('../../../assets/images/dog-placeholder.png')} style={styles.dogImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.dogCopy}>
          <Text style={styles.dogName}>{dog.name}</Text>
          <Text style={styles.dogMeta}>{breed ? `${age} · ${breed}` : age}</Text>
        </View>
        <MotionPressable accessibilityRole="button" accessibilityLabel={`Visa ${dog.name}s profil`} onPress={() => onGo('profile')} style={styles.profileButton}>
          <Text style={styles.profileText}>Profil</Text>
        </MotionPressable>
      </View>
    </Card>
    <View style={styles.week} accessibilityRole="tablist" accessibilityLabel="Välj dag">
      {dates.map(({ key, date }) => <MotionPressable key={key} accessibilityRole="tab" accessibilityLabel={date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} accessibilityState={{ selected: key === selected }} onPress={() => setSelected(key)} style={[styles.day, key === selected && styles.selectedDay]}>
        <Text style={[styles.weekday, key === selected && styles.selectedText]}>{date.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')}</Text>
        <Text style={[styles.date, key === selected && styles.selectedText]}>{date.getDate()}</Text>
        <View style={[styles.dayDot, key === today && (key === selected ? styles.lightDot : styles.todayDot)]} />
      </MotionPressable>)}
    </View>
    <SectionHeader title={selected === today ? `Idag för ${dog.name}` : new Date(`${selected}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} />
    {selected === today ? <Button label="Logga nu" accessibilityLabel="Logga en händelse nu" onPress={() => onGo('log')} /> : null}
    <ScreenTransition transitionKey={selected}>
      <View style={styles.rows}>
        {logState === 'loading' || planState === 'loading' ? <Skeleton shape="row" lines={2} /> : null}
        {logState === 'error' ? <ListRow category="pee" title="Loggen kunde inte hämtas" meta="Öppna loggen för att försöka igen" onPress={() => onGo('log')} /> : null}
        {planState === 'error' ? <ListRow category="vaccination" title="Planerna kunde inte hämtas" onPress={() => onGo('planned-health')} /> : null}
        {planState === 'ready' && dailyPlans.map((plan) => <ListRow key={plan.id} category={plan.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={plan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'} meta={plan.description ?? undefined} onPress={() => onGo('planned-health')} />)}
        {logState === 'ready' && planState === 'ready' && dailyEvents.length === 0 && dailyPlans.length === 0 ? <Text style={styles.empty}>{selected > today ? 'Inget planerat den här dagen.' : 'Inget loggat den här dagen.'}</Text> : null}
        {dailyEvents.map((event) => <ListRow key={event.id} category={event.type} title={LOG_EVENT_LABELS[event.type]} time={localDateTimeParts(event.occurredAt).time} meta={event.note ?? undefined} onPress={() => onGo('log')} />)}
      </View>
    </ScreenTransition>
    <HomeCarousel dog={dog} plans={plans} selectedDatePlans={planState === 'ready' ? dailyPlans : []} content={content} contentState={contentState} nextStep={nextStep} onGo={onGo} onOpenContent={onOpenContent} />
    {contentState === 'error' ? <Button label="Hämta guider igen" accessibilityLabel="Hämta guider igen" variant="tertiary" onPress={onRetryContent} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  dogSummary: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  dogImage: { width: tokens.size.quickLogCompactHeight, height: tokens.size.quickLogCompactHeight, borderRadius: tokens.radius.md },
  dogCopy: { flex: 1, gap: tokens.spacing.xs },
  dogName: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  dogMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  profileButton: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.sm },
  profileText: { ...tokens.typography.label, color: tokens.colors.primary },
  week: { flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg },
  day: { flex: 1, minWidth: tokens.size.touchMin, minHeight: tokens.size.buttonHeight, paddingVertical: tokens.spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface, gap: tokens.spacing.xs },
  selectedDay: { backgroundColor: tokens.colors.primary },
  weekday: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textTransform: 'capitalize' },
  date: { ...tokens.typography.label, color: tokens.colors.textPrimary }, selectedText: { color: tokens.colors.onPrimary },
  dayDot: { height: tokens.spacing.xs, width: tokens.spacing.xs, borderRadius: tokens.radius.full }, todayDot: { backgroundColor: tokens.colors.primary }, lightDot: { backgroundColor: tokens.colors.onPrimary },
  rows: { gap: tokens.spacing.xs }, empty: { ...tokens.typography.body, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.lg },
});
