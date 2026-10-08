import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
export function EmptyState({ title = 'Inget här än', actionLabel = 'Lägg till den första händelsen', onAction }: { title?: string; actionLabel?: string; onAction: () => void }) {
  return <View accessibilityRole="summary" accessibilityLabel={title} style={styles.state}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Button label={actionLabel} accessibilityLabel={actionLabel} onPress={onAction} /></View>;
}
const styles = StyleSheet.create({ state: { alignSelf: 'stretch', padding: tokens.spacing.lg, gap: tokens.spacing.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, alignItems: 'stretch' }, title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, textAlign: 'center', flexShrink: 1 } });
