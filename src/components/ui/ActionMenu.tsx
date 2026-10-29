import { Ionicons } from '@expo/vector-icons';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { ModalSwipeHandle, useModalSwipeDismiss } from './modal-swipe-dismiss';
import { useReducedMotion } from './Motion';

export function ActionMenu({ visible, onOpen, onClose, onEdit, onDelete, label = 'Fler val', objectLabel = 'posten' }: { visible: boolean; onOpen: () => void; onClose: () => void; onEdit: () => void; onDelete: () => void; label?: string; objectLabel?: string }) {
  const reduced = useReducedMotion();
  const swipe = useModalSwipeDismiss(visible, onClose, reduced);
  return <View style={styles.root}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onOpen} style={styles.trigger}><Ionicons name="ellipsis-horizontal" size={tokens.size.iconMd} color={tokens.colors.textPrimary} /></Pressable>
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Stäng meny" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View pointerEvents="box-none" style={styles.modalFrame}>
        <Animated.View accessibilityRole="menu" accessibilityLabel="Åtgärder" testID="center-modal-action-menu"
          style={[styles.menu, { transform: [{ translateX: swipe.translateX }] }]}>
          <ModalSwipeHandle panHandlers={swipe.panHandlers} />
          <View style={styles.menuActions}>
            <Pressable accessibilityRole="menuitem" accessibilityLabel={`Ändra ${objectLabel}`} onPress={() => { onClose(); onEdit(); }} style={styles.menuItem}><Ionicons name="create-outline" size={tokens.size.iconMd} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /></Pressable>
            <Pressable accessibilityRole="menuitem" accessibilityLabel={`Radera ${objectLabel}`} onPress={() => { onClose(); onDelete(); }} style={[styles.menuItem, styles.deleteItem]}><Ionicons name="trash-outline" size={tokens.size.iconMd} color={tokens.colors.danger} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /></Pressable>
          </View>
        </Animated.View>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  trigger: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: tokens.colors.overlay },
  modalFrame: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: tokens.layout.pageInset },
  menu: { alignSelf: 'center', maxWidth: 560, gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong },
  menuActions: { flexDirection: 'row', justifyContent: 'center', gap: tokens.spacing.sm },
  menuItem: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong },
  deleteItem: { borderColor: tokens.colors.danger },
});
