import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
type Mode = 'Home' | 'Back' | 'Close';
export function AppBar({ mode, title, onAction, actionLabel }: { mode: Mode; title: string; onAction?: () => void; actionLabel?: string }) {
  const icon = mode === 'Back' ? 'chevron-back' : mode === 'Close' ? 'close' : 'notifications-outline';
  const label = mode === 'Back' ? 'Tillbaka' : mode === 'Close' ? 'Stäng' : actionLabel ?? 'Notiser';
  return <View style={styles.bar} accessibilityRole="header" accessibilityLabel={title}><View style={styles.side}>{mode === 'Home' ? <Text style={styles.brand}>Tassla</Text> : mode === 'Back' ? <Pressable accessibilityRole="button" accessibilityLabel="Tillbaka" onPress={onAction} style={styles.action}><Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.primary} /></Pressable> : null}</View><Text accessibilityRole="header" style={styles.title}>{title}</Text><View style={[styles.side, styles.right]}>{mode !== 'Back' && onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel ?? label} onPress={onAction} style={styles.action}><Ionicons name={icon} size={tokens.size.iconMd} color={tokens.colors.primary} /></Pressable> : null}</View></View>;
}
const styles = StyleSheet.create({ bar: { alignSelf: 'stretch', minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }, side: { flex: 1, minHeight: tokens.size.touchMin, justifyContent: 'center' }, right: { alignItems: 'flex-end' }, action: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' }, brand: { ...tokens.typography.label, color: tokens.colors.primary }, title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, textAlign: 'center', flexShrink: 1 } });
