import { View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';

export function KnowledgeScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Kunskap" description="Granskade guider och checklistor för hundens vardag." />
      <MessageCard>Inga publicerade guider är kopplade till den här lokala förhandsvisningen.</MessageCard>
    </View>
  );
}
