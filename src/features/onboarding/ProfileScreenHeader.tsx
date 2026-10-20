import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../../theme/tokens';

export function ProfileScreenHeader({ onBack, backLabel = 'Tillbaka till Mer', disabled = false }: { onBack: () => void; backLabel?: string; disabled?: boolean }) {
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={backLabel} accessibilityState={{ disabled }} disabled={disabled} onPress={onBack}
      style={({ pressed }) => [styles.back, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
    </Pressable>
    <Text accessibilityRole="header" style={styles.title}>Hundprofil</Text>
  </View>;
}

const styles = StyleSheet.create({
  row: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  back: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.support.profile.bg },
  title: { ...tokens.typography.title, color: tokens.colors.textPrimary, flex: 1 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
