import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from './Motion';
import { Button } from './Button';
import { createSheetDrag } from './sheet-drag';

export function BottomSheet({ visible, title, children, onRequestClose, onPrimaryAction, primaryLabel = 'Klar', footer, keyboardAware = false, scrollContent = true }: { visible: boolean; title: string; children: ReactNode; onRequestClose: () => void; onPrimaryAction?: () => void; primaryLabel?: string; footer?: ReactNode; keyboardAware?: boolean; scrollContent?: boolean }) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => createSheetDrag(translateY));
  // Commit current guards before the next gesture can run.
  useLayoutEffect(() => { drag.update({ visible, reduced, onRequestClose }); });
  useEffect(() => () => drag.dispose(), [drag]);

  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onRequestClose} accessibilityViewIsModal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' || keyboardAware ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={onRequestClose} style={StyleSheet.absoluteFill} />
        <View pointerEvents="box-none" style={[styles.modalFrame, { paddingTop: Math.max(insets.top, tokens.spacing.md), paddingBottom: Math.max(insets.bottom, tokens.spacing.md) }]}>
        <Animated.View
          accessibilityRole="summary"
          accessibilityLabel={title}
          testID="center-modal-bottom-sheet"
          style={[styles.sheet, keyboardAware && styles.keyboardAwareSheet, { transform: [{ translateY }] }]}
        >
          {/* Keep dragging separate from the scrollable content. */}
          <View {...drag.panHandlers} style={styles.grabArea}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.grabber} />
            <View style={styles.heading}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={onRequestClose} style={styles.close}>
                <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
              </Pressable>
            </View>
          </View>
          {scrollContent
            ? <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={[styles.scroll, keyboardAware && styles.keyboardAwareScroll]} contentContainerStyle={styles.content}>{children}</ScrollView>
            : <View style={styles.childScrollBody}>{children}</View>}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
          {onPrimaryAction ? <Button label={primaryLabel} accessibilityLabel={primaryLabel} onPress={onPrimaryAction} /> : null}
        </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: tokens.colors.overlay },
  modalFrame: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.layout.pageInset },
  sheet: { alignSelf: 'center', width: '100%', maxWidth: 560, maxHeight: '90%', padding: tokens.spacing.lg, gap: tokens.spacing.md, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  keyboardAwareSheet: { height: '90%', minHeight: 0, overflow: 'hidden' },
  grabArea: { marginTop: -tokens.spacing.sm, gap: tokens.spacing.xs },
  grabber: { alignSelf: 'center', width: tokens.size.touchMin, height: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.textSecondary, opacity: 0.35 },
  heading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  close: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  keyboardAwareScroll: { flex: 1, minHeight: 0 },
  childScrollBody: { flex: 1, minHeight: 0 },
  content: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.md },
  footer: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.md, gap: tokens.spacing.sm, backgroundColor: tokens.colors.surface },
});
