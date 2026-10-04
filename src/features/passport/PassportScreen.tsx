import { View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';

export function PassportScreen({ onBack }: { onBack: () => void }) {
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Tassla-pass" description="En överblick som kan vara bra att ha nära till hands." />
      <MessageCard>Det här är en visuell grund. Ingen information exporteras och ingen PDF skapas.</MessageCard>
    </View>
  );
}
