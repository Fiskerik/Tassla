import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

export function ActionMenu({ visible, onOpen, onClose, onEdit, onDelete, label = 'Fler val' }: { visible: boolean; onOpen: () => void; onClose: () => void; onEdit: () => void; onDelete: () => void; label?: string }) {
  return <View style={styles.root}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onOpen} style={styles.trigger}><Ionicons name="ellipsis-horizontal" size={tokens.size.iconMd} color={tokens.colors.textPrimary} /></Pressable>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <Pressable accessibilityRole="button" accessibilityLabel="Stäng meny" onPress={onClose} style={styles.backdrop}>
        <View accessibilityRole="menu" accessibilityLabel="Åtgärder" style={styles.menu}>
          <Pressable accessibilityRole="menuitem" accessibilityLabel="Ändra" onPress={() => { onClose(); onEdit(); }} style={styles.menuItem}><Text style={styles.menuText}>Ändra</Text></Pressable>
          <Pressable accessibilityRole="menuitem" accessibilityLabel="Radera" onPress={() => { onClose(); onDelete(); }} style={styles.menuItem}><Text style={styles.deleteText}>Radera</Text></Pressable>
        </View>
      </Pressable>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  trigger: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  backdrop: { flex: 1, alignItems: 'flex-end', padding: tokens.spacing.lg, backgroundColor: tokens.colors.overlay },
  menu: { minWidth: tokens.size.chipLg * 4, padding: tokens.spacing.xs, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong },
  menuItem: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md },
  menuText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  deleteText: { ...tokens.typography.body, color: tokens.colors.danger },
});
