import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { PhotoPlaceholder } from './PhotoPlaceholder';

export function DogCard({ name, breed, age }: { name: string; breed: string; age: string }) {
  return <View accessibilityRole="summary" accessibilityLabel={`${name}, ${breed}, ${age}`} style={styles.card}><PhotoPlaceholder /><View style={styles.copy}><Text style={styles.name}>{name}</Text><Text style={styles.detail}>{breed}</Text><Text style={styles.detail}>{age}</Text></View></View>;
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.lg, padding: tokens.layout.cardPadding, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  copy: { flex: 1, gap: tokens.spacing.xs },
  name: { ...tokens.typography.title, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.body, color: tokens.colors.textSecondary },
});
