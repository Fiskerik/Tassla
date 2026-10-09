import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon' | 'destructive';
export type ButtonVisualState = 'default' | 'pressed' | 'disabled' | 'loading' | 'success' | 'error';
type Props = { label: string; onPress: () => void; accessibilityLabel: string; variant?: ButtonVariant; state?: ButtonVisualState; disabled?: boolean; loading?: boolean; iconName?: React.ComponentProps<typeof Ionicons>['name'] };

export function Button({ label, onPress, accessibilityLabel, variant = 'primary', state = 'default', disabled = false, loading = false, iconName = 'ellipsis-horizontal' }: Props) {
  const unavailable = disabled || loading || state === 'disabled' || state === 'loading';
  const busy = loading || state === 'loading';
  const forcedPressed = state === 'pressed' && !unavailable;
  return (
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: unavailable, busy: busy }} disabled={unavailable} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], (pressed || forcedPressed) && !unavailable && styles.pressed, (pressed || forcedPressed) && !unavailable && variant === 'primary' && styles.primaryPressed, (pressed || forcedPressed) && !unavailable && variant === 'secondary' && styles.secondaryPressed, unavailable && styles.disabled, state === 'success' && styles.success, state === 'error' && styles.error, variant === 'icon' && styles.icon]}>
      {busy ? <ActivityIndicator color={variant === 'primary' ? tokens.colors.onPrimary : tokens.colors.primary} /> : variant === 'icon' ? <Ionicons name={iconName} size={tokens.size.iconMd} color={state === 'error' ? tokens.colors.danger : tokens.colors.textPrimary} /> : <Text style={[styles.label, variant === 'primary' && styles.primaryLabel, variant === 'destructive' && styles.destructiveLabel, state === 'error' && styles.errorLabel, state === 'success' && styles.successLabel]}>{label}</Text>}
      {variant === 'icon' ? <View accessible={false} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'stretch', minHeight: tokens.size.buttonHeight, paddingHorizontal: tokens.spacing.lg, borderWidth: tokens.size.stroke, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary, shadowColor: tokens.colors.textPrimary, shadowOpacity: tokens.opacity.shadow, shadowRadius: tokens.spacing.sm, shadowOffset: { width: 0, height: tokens.size.progress }, elevation: tokens.spacing.xs },
  secondary: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderStrong }, tertiary: { backgroundColor: tokens.colors.transparent, borderColor: tokens.colors.transparent },
  destructive: { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderStrong }, icon: { width: tokens.size.touchMin, height: tokens.size.touchMin, minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.sm, alignSelf: 'flex-start', borderColor: tokens.colors.borderStrong },
  pressed: { opacity: tokens.opacity.pressed }, primaryPressed: { backgroundColor: tokens.colors.primaryPressed, borderColor: tokens.colors.primaryPressed }, secondaryPressed: { backgroundColor: tokens.colors.selectedSurface }, disabled: { opacity: tokens.opacity.disabled }, success: { backgroundColor: tokens.colors.successSurface, borderColor: tokens.colors.success }, error: { backgroundColor: tokens.colors.dangerSurface, borderColor: tokens.colors.danger }, label: { ...tokens.typography.label, color: tokens.colors.primary, textAlign: 'center' },
  primaryLabel: { color: tokens.colors.onPrimary }, destructiveLabel: { color: tokens.colors.danger }, errorLabel: { color: tokens.colors.danger }, successLabel: { color: tokens.colors.success },
});
