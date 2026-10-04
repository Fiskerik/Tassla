import { View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';

export function HealthScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Hälsa" description="En lugn plats för hundens hälsouppgifter." />
      <MessageCard>Den här vyn är en visuell grund. Inga hälsodata eller vårdscheman visas.</MessageCard>
    </View>
  );
}
