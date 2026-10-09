import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { tokens } from '../../theme/tokens';
import { Button, type ButtonVisualState } from './Button';
export type SheetState = 'default' | 'loading' | 'disabled' | 'success' | 'error';
export function BottomSheet({ visible, title, children, onRequestClose, onPrimaryAction, primaryLabel = 'Klar', state = 'default', primaryState = 'default' }: { visible: boolean; title: string; children: ReactNode; onRequestClose: () => void; onPrimaryAction?: () => void; primaryLabel?: string; state?: SheetState; primaryState?: ButtonVisualState }) {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  const unavailable = state === 'loading' || state === 'disabled';
  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={onRequestClose} accessibilityViewIsModal><View style={styles.backdrop}><Pressable accessibilityRole="button" accessibilityLabel="Stäng" disabled={unavailable} onPress={onRequestClose} style={styles.dismissArea} /><View accessibilityRole="summary" accessibilityLabel={title} accessibilityState={{ busy: state === 'loading', disabled: state === 'disabled' }} style={[styles.sheet, state === 'success' && styles.success, state === 'error' && styles.error, unavailable && styles.disabled]}><View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Stäng" disabled={unavailable} onPress={onRequestClose} style={styles.close}><Ionicons name="close" size={tokens.size.iconMd} color={state === 'error' ? tokens.colors.danger : tokens.colors.textPrimary} /></Pressable></View><ScrollView style={styles.scroll} contentContainerStyle={styles.content}>{children}</ScrollView>{onPrimaryAction ? <Button label={primaryLabel} accessibilityLabel={primaryLabel} onPress={onPrimaryAction} state={state === 'loading' ? 'loading' : state === 'disabled' ? 'disabled' : primaryState} /> : null}</View></View></Modal>;
}
const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.colors.overlay }, dismissArea: { flex: 1 }, sheet: { alignSelf: 'stretch', maxHeight: tokens.size.modalMaxHeight, padding: tokens.spacing.lg, gap: tokens.spacing.md, borderTopLeftRadius: tokens.radius.lg, borderTopRightRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, success: { borderColor: tokens.colors.success, borderWidth: tokens.size.stroke }, error: { borderColor: tokens.colors.danger, borderWidth: tokens.size.stroke }, disabled: { opacity: tokens.opacity.disabled }, heading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }, title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 }, close: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' }, scroll: { flexShrink: 1 }, content: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.md } });
