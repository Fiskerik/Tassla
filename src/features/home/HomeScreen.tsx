import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppBar, Button, HeroCard, ListRow, SectionHeader, Skeleton } from '../../components/ui';
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
    <HeroCard
      title={dog.name}
      meta={breed ? `${age} · ${breed}` : age}
      image={require('../../../assets/images/dog-welcome.png')}
      onPress={() => onGo('profile')}
    />
    <HomeCarousel dog={dog} events={events} plans={plans} content={content} contentState={contentState} nextStep={nextStep} onGo={onGo} onOpenContent={onOpenContent} />
    <View style={styles.week} accessibilityRole="tablist" accessibilityLabel="Välj dag">
      {dates.map(({ key, date }) => <MotionPressable key={key} accessibilityRole="tab" accessibilityLabel={date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })} accessibilityState={{ selected: key === selected }} onPress={() => setSelected(key)} style={[styles.day, key === selected && styles.selectedDay]}>
        <Text style={[styles.weekday, key === selected && styles.selectedText]}>{date.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')}</Text>
        <Text style={[styles.date, key === selected && styles.selectedText]}>{date.getDate()}</Text>
        <View style={[styles.dayDot, key === today && (key === selected ? styles.lightDot : styles.todayDot)]} />
      </MotionPressable>)}
    </View>
    <SectionHeader title={selected === today ? `Idag för ${dog.name}` : new Date(`${selected}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })} />
    <ScreenTransition transitionKey={selected}>
      <View style={styles.rows}>
        {logState === 'loading' || planState === 'loading' ? <Skeleton shape="row" lines={2} /> : null}
        {logState === 'error' ? <ListRow category="pee" title="Loggen kunde inte hämtas" meta="Öppna loggen för att försöka igen" onPress={() => onGo('log')} /> : null}
        {planState === 'error' ? <ListRow category="vaccination" title="Planerna kunde inte hämtas" onPress={() => onGo('planned-health')} /> : null}
        {planState === 'ready' && dailyPlans.map((plan) => <ListRow key={plan.id} category={plan.event_type === 'vaccination' ? 'vaccination' : 'veterinary'} title={plan.event_type === 'vaccination' ? 'Vaccination' : 'Veterinärbesök'} meta={plan.description ?? undefined} onPress={() => onGo('planned-health')} />)}
        {selected === today ? <>
          <ListRow category="food" title="Logga en händelse" meta={dailyEvents.length ? `${dailyEvents.length} händelser idag` : 'Mat, sömn och små stunder'} onPress={() => onGo('log')} />
          <ListRow category="training" title={nextStep ?? 'Dags för träning'} meta="Öppna valpprogrammet" onPress={() => onGo('training')} />
          <ListRow category="veterinary" title="Håll koll på hälsan" meta="Vikt, vaccinationer och besök" onPress={() => onGo('health')} />
          {contentState === 'ready' && content[0] ? <ListRow category="sleep" title={content[0].title} meta="Läs i Kunskap" onPress={() => onOpenContent(content[0].id)} /> : null}
        </> : logState === 'ready' && dailyEvents.length === 0 && dailyPlans.length === 0 ? <Text style={styles.empty}>{selected > today ? 'Inget planerat den här dagen.' : 'Inget loggat den här dagen.'}</Text> : null}
        {selected !== today && dailyEvents.map((event) => <ListRow key={event.id} category={event.type} title={LOG_EVENT_LABELS[event.type]} time={localDateTimeParts(event.occurredAt).time} meta={event.note ?? undefined} onPress={() => onGo('log')} />)}
      </View>
    </ScreenTransition>
    {selected === today && dailyEvents[0] ? <>
      <SectionHeader title="Senast i loggen" />
      <ListRow category={dailyEvents[0].type} title={LOG_EVENT_LABELS[dailyEvents[0].type]} time={localDateTimeParts(dailyEvents[0].occurredAt).time} meta={dailyEvents[0].note ?? undefined} onPress={() => onGo('log')} />
    </> : null}
    {contentState === 'error' ? <Button label="Hämta guider igen" accessibilityLabel="Hämta guider igen" variant="tertiary" onPress={onRetryContent} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  week: { flexDirection: 'row', gap: tokens.spacing.sm, marginTop: tokens.spacing.lg },
  day: { flex: 1, minWidth: tokens.size.touchMin, minHeight: tokens.size.buttonHeight, paddingVertical: tokens.spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.surface, gap: tokens.spacing.xs },
  selectedDay: { backgroundColor: tokens.colors.primary },
  weekday: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textTransform: 'capitalize' },
  date: { ...tokens.typography.label, color: tokens.colors.textPrimary }, selectedText: { color: tokens.colors.onPrimary },
  dayDot: { height: tokens.spacing.xs, width: tokens.spacing.xs, borderRadius: tokens.radius.full }, todayDot: { backgroundColor: tokens.colors.primary }, lightDot: { backgroundColor: tokens.colors.onPrimary },
  rows: { gap: tokens.spacing.xs }, empty: { ...tokens.typography.body, color: tokens.colors.textSecondary, paddingVertical: tokens.spacing.lg },
});
