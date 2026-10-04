import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';

export function HealthScreen({ onBack }: { onBack: () => void }) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Hälsa" description="En lugn plats för hundens hälsouppgifter." />
      <View style={styles.card}>
        <View style={styles.iconCircle}>{iconsLoaded ? <Ionicons name="medkit-outline" size={27} color={theme.colors.accent} /> : <Text style={styles.fallback}>H</Text>}</View>
        <View style={styles.copy}>
          <Text style={styles.cardTitle}>Hälsan får ta plats i sin egen takt.</Text>
          <Text style={styles.cardBody}>Här visas inga hälsodata, påminnelser eller vårdscheman ännu.</Text>
        </View>
      </View>
      <MessageCard>Den här delen är en grund för framtida funktioner. Den ger inga råd om symtom eller vård.</MessageCard>
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
