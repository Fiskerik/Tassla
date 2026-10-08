import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
export function HeroCard({ title, meta, onPress }: { title: string; meta?: string; onPress?: () => void }) {
  const content = <><View style={styles.overlayTop} /><View style={styles.overlayMiddle} /><View style={styles.copy}><Text style={styles.title}>{title}</Text>{meta ? <Text style={styles.meta}>{meta}</Text> : null}</View></>;
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={meta ? `${title}. ${meta}` : title} onPress={onPress} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>{content}</Pressable>;
  return <View accessibilityRole="summary" accessibilityLabel={title} style={styles.hero}>{content}</View>;
}
const styles = StyleSheet.create({ hero: { alignSelf: 'stretch', minHeight: tokens.size.heroHeight, borderRadius: tokens.radius.lg, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: tokens.colors.primary }, overlayTop: { ...StyleSheet.absoluteFill, backgroundColor: tokens.colors.overlay, opacity: 0.25 }, overlayMiddle: { ...StyleSheet.absoluteFill, backgroundColor: tokens.colors.primaryPressed, opacity: 0.5 }, copy: { padding: tokens.spacing.lg, gap: tokens.spacing.xs }, title: { ...tokens.typography.heading, color: tokens.colors.onPrimary, flexShrink: 1 }, meta: { ...tokens.typography.caption, color: tokens.colors.onPrimary, flexShrink: 1 }, pressed: { opacity: 0.84 } });
