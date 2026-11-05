import { View } from 'react-native';
import { MessageCard, QuietButton } from '../../components/AppPrimitives';
import { Button } from '../../components/ui';
import type { RoutineNotSelectedNotice as Notice } from './daily-activity-recovery';

export function RoutineNotSelectedNotice({ notice, activeDogId, dogAvailable, onHome, onOpen, onDismiss }: {
  notice: Notice; activeDogId: string; dogAvailable: boolean; onHome: boolean; onOpen?: () => void; onDismiss: () => void;
}) {
  const date = new Date(`${notice.dateKey}T12:00:00Z`);
  const dateLabel = Number.isNaN(date.getTime()) ? notice.dateKey
    : new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const nextStep = !dogAvailable ? 'Hundprofilen är inte tillgänglig.' : !onHome
    ? 'Gå till Hem för att kontrollera checklistan.' : notice.dogId !== activeDogId
      ? `Tryck på hundbilden och välj ${notice.dogName}.` : 'Du kan lägga till den idag.';
  return <View testID="routine-not-selected-notice">
    <MessageCard>Rutinen {notice.routineName} sparades för {notice.dogName}. Vi lade inte till den {dateLabel}. {nextStep}</MessageCard>
    {onOpen ? <Button variant="secondary" label="Öppna rutiner" accessibilityLabel="Öppna rutiner för den valda hunden" onPress={onOpen} /> : null}
    <QuietButton title="Stäng rutinmeddelande" onPress={onDismiss} />
  </View>;
}
