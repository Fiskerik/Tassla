import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';

export function PassportScreen({ onBack }: { onBack: () => void }) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Tassla-pass" description="En överblick som kan vara bra att ha nära till hands." />
      <View style={styles.card}>
        <View style={styles.iconCircle}>{iconsLoaded ? <Ionicons name="document-text-outline" size={27} color={theme.colors.accent} /> : <Text style={styles.fallback}>T</Text>}</View>
        <View style={styles.copy}>
          <Text style={styles.cardTitle}>Hundens uppgifter, samlade.</Text>
          <Text style={styles.cardBody}>Tassla-pass visar inget ännu och skapar ingen export eller PDF.</Text>
        </View>
      </View>
      <MessageCard>Det här är en visuell grund. Ingen information lämnar ditt konto från den här vyn.</MessageCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' },
  fallback: { color: theme.colors.accent, fontSize: 19, fontWeight: '800' },
  copy: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: 17, lineHeight: 23, fontWeight: '800' },
  cardBody: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
});
