import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function InfoBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <View accessibilityRole="summary" style={styles.banner}><Text style={styles.message}>{children}</Text>{action}</View>;
}

const styles = StyleSheet.create({
  banner: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.selectedSurface },
  message: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
});
