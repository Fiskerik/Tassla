import type { ReactNode } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button, type ButtonVariant } from './Button';
import { ModalSwipeHandle, useModalSwipeDismiss } from './modal-swipe-dismiss';
import { useReducedMotion } from './Motion';
export function Dialog({ visible, title, children, onRequestClose, onConfirm, confirmLabel = 'Radera', confirmVariant = 'destructive', cancelLabel = 'Avbryt', compactActions = false }: { visible: boolean; title: string; children: ReactNode; onRequestClose: () => void; onConfirm: () => void; confirmLabel?: string; confirmVariant?: ButtonVariant; cancelLabel?: string; compactActions?: boolean }) {
  const reduced = useReducedMotion();
  const swipe = useModalSwipeDismiss(visible, onRequestClose, reduced);
  return <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onRequestClose} accessibilityViewIsModal>
    <View style={styles.backdrop}>
      <Animated.View accessibilityRole="alert" accessibilityLabel={title} style={[styles.dialog, { transform: [{ translateX: swipe.translateX }] }]}>
        <ModalSwipeHandle panHandlers={swipe.panHandlers} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {children}
          <View style={[styles.actions, compactActions && styles.compactActions]}>
            <Button compact={compactActions} variant="secondary" label={cancelLabel} accessibilityLabel={cancelLabel} onPress={onRequestClose} />
            <Button compact={compactActions} variant={confirmVariant} label={confirmLabel} accessibilityLabel={confirmLabel} onPress={onConfirm} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'center', padding: tokens.layout.pageInset, backgroundColor: tokens.colors.overlay }, dialog: { alignSelf: 'stretch', maxHeight: '90%', padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface }, content: { gap: tokens.spacing.md }, title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flexShrink: 1 }, actions: { gap: tokens.spacing.sm }, compactActions: { flexDirection: 'row', flexWrap: 'wrap' } });
