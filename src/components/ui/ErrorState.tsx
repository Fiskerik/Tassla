import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';

export function ErrorState({ title = 'Något gick fel', description = 'Försök igen.', actionLabel = 'Försök igen', onRetry }: { title?: string; description?: string; actionLabel?: string; onRetry?: () => void }) {
  return <View accessibilityRole="alert" accessibilityLabel={title} style={styles.state}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>{onRetry ? <Button variant="secondary" state="error" label={actionLabel} accessibilityLabel={actionLabel} onPress={onRetry} /> : null}</View>;
}

const styles = StyleSheet.create({
  state: { alignSelf: 'stretch', padding: tokens.spacing.lg, gap: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.danger, backgroundColor: tokens.colors.dangerSurface },
  title: { ...tokens.typography.heading, color: tokens.colors.danger },
  description: { ...tokens.typography.body, color: tokens.colors.textPrimary },
});
