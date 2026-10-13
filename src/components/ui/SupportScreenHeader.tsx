import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../../theme/tokens';

export type SupportAccent = keyof typeof tokens.colors.support;

export function SupportScreenHeader({ title, onBack, backLabel, accent, disabled = false }: {
  title: string;
  onBack: () => void;
  backLabel: string;
  accent: SupportAccent;
  disabled?: boolean;
}) {
  const color = tokens.colors.support[accent];
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onBack}
      style={({ pressed }) => [styles.back, { backgroundColor: color.bg }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
    </Pressable>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  back: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  title: { ...tokens.typography.title, color: tokens.colors.textPrimary, flex: 1 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
