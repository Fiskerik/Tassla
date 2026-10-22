import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/tokens';
import type { IconCategory } from './IconChip';

export type ThemedIconTone = IconCategory | 'neutral';

export function ThemedIcon({ name, tone = 'neutral', size = 'medium', surface = true, testID, style }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  tone?: ThemedIconTone;
  size?: 'small' | 'medium';
  surface?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === 'neutral' ? null : tokens.colors.category[tone];
  const dimension = size === 'medium' ? tokens.size.chipMd : tokens.size.iconMd + tokens.spacing.xs;
  const glyphSize = size === 'medium' ? tokens.size.iconSm : tokens.size.iconSm - tokens.spacing.xs;
  return <View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.symbol, { width: dimension, height: dimension }, surface && color ? { backgroundColor: color.bg } : null, style]}>
    <Ionicons name={name} size={glyphSize} color={color?.fg ?? tokens.colors.home.textMuted} accessibilityElementsHidden />
  </View>;
}

const styles = StyleSheet.create({
  symbol: { alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
});
