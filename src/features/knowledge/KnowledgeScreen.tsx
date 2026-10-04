import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';

export function KnowledgeScreen({ onBack, items = [] }: { onBack: () => void; items?: readonly HomeContent[] }) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  return (
    <View>
      <QuietButton title="Tillbaka till Mer" onPress={onBack} />
      <PageHeading title="Kunskap" description="Granskade guider och checklistor för hundens vardag." />
      {items.length === 0
        ? <MessageCard>Det finns inga publicerade guider som passar just nu. Här visas bara innehåll som publicerats efter granskning.</MessageCard>
        : items.map((item) => <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            {iconsLoaded && <Ionicons name={item.contentType === 'checklist' ? 'checkbox-outline' : 'book-outline'} size={20} color={theme.colors.accent} />}
            <Text style={styles.type}>{item.contentType === 'article' ? 'KUNSKAP' : item.contentType === 'guide' ? 'GUIDE' : 'CHECKLISTA'}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 17, marginTop: 10 },
  type: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: theme.colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800', marginTop: 7 },
  body: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 21, marginTop: 7 },
});
