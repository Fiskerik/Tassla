import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function LoadingState({ label = 'Laddar innehåll…' }: { label?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.state}><ActivityIndicator color={tokens.colors.primary} /><Text style={styles.label}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  state: { alignSelf: 'stretch', minHeight: tokens.size.buttonHeight, padding: tokens.spacing.lg, gap: tokens.spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  label: { ...tokens.typography.body, color: tokens.colors.textSecondary },
});
