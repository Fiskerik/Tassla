import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheet } from '../../components/ui';
import type { OwnedDog } from '../../data/app-data';
import { automaticDogAge, localDate } from '../onboarding/dog';
import { tokens } from '../../theme/tokens';

export function DogProfileSwitcherSheet({ visible, dogs, activeDogId, onRequestClose, onSelectDog, onAddDog }: {
  visible: boolean;
  dogs: readonly OwnedDog[];
  activeDogId: string;
  onRequestClose: () => void;
  onSelectDog: (dogId: string) => void;
  onAddDog: () => void;
}) {
  return <BottomSheet visible={visible} title="Välj hund" onRequestClose={onRequestClose}
    onPrimaryAction={onRequestClose} primaryLabel="Klar">
    <Text style={styles.description}>Välj vilken hund Tassla ska visa information och innehåll för.</Text>
    <View style={styles.list}>
      {dogs.map((dog, index) => {
        const selected = dog.id === activeDogId;
        const age = automaticDogAge(dog.birth_date, localDate());
        return <Pressable key={dog.id} accessibilityRole="radio" accessibilityState={{ selected }}
          accessibilityLabel={`${dog.name}, ${age?.label ?? 'ålder saknas'}${selected ? ', vald hund' : ''}`}
          onPress={() => onSelectDog(dog.id)} style={({ pressed }) => [styles.row, index < dogs.length - 1 && styles.divider, selected && styles.selected, pressed && styles.pressed]}>
          <View style={styles.avatar} accessible={false} importantForAccessibility="no-hide-descendants">
            <Ionicons name="paw" size={tokens.size.iconMd} color={tokens.colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{dog.name}</Text>
            <Text style={styles.age}>{age?.label ?? 'Ålder saknas'}</Text>
          </View>
          {selected ? <Ionicons name="checkmark-circle" size={tokens.size.iconMd} color={tokens.colors.primary} accessibilityElementsHidden /> : null}
        </Pressable>;
      })}
      <Pressable accessibilityRole="button" accessibilityLabel="Lägg till hund" onPress={onAddDog}
        style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
        <View style={styles.addIcon} accessible={false} importantForAccessibility="no-hide-descendants">
          <Ionicons name="add" size={tokens.size.iconMd} color={tokens.colors.primary} />
        </View>
        <Text style={styles.addLabel}>Lägg till hund</Text>
      </Pressable>
    </View>
  </BottomSheet>;
}

const styles = StyleSheet.create({
  description: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  list: { borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden', backgroundColor: tokens.colors.surface },
  row: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.sm },
  divider: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  selected: { backgroundColor: tokens.colors.selectedSurface },
  pressed: { opacity: 0.78 },
  avatar: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.support.profile.bg },
  copy: { flex: 1, minWidth: 0 },
  name: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  age: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  addRow: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  addIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.selectedSurface },
  addLabel: { ...tokens.typography.label, color: tokens.colors.primary },
});
