import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DatePickerField, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import type { DogSex } from '../../content/article-targeting';

export function DogArticleProfileFields({ date, sex, disabled = false, onDate, onSex }: {
  date: string;
  sex: DogSex | null;
  disabled?: boolean;
  onDate: (value: string) => void;
  onSex: (value: DogSex | null) => void;
}) {
  return <View style={styles.fields}>
    <DatePickerField label="Förväntad hemkomst (valfritt)" value={date} onChangeText={onDate} disabled={disabled} />
    <Text style={styles.help}>När tror du att hunden kommer hem till dig? Datumet styr när förberedande artiklar visas. Du kan ändra eller ta bort det.</Text>
    {date !== '' ? <QuietButton title="Ta bort förväntat hemkomstdatum" disabled={disabled} onPress={() => onDate('')} /> : null}
    <Text style={styles.label}>Kön (valfritt)</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Hundens kön" style={styles.options}>
      {([{ value: null, label: 'Inte angivet' }, { value: 'male', label: 'Hane' }, { value: 'female', label: 'Tik' }] as const).map((option) =>
        <Pressable key={option.label} accessibilityRole="radio" accessibilityLabel={option.label}
          accessibilityState={{ checked: sex === option.value, disabled }} aria-checked={sex === option.value} disabled={disabled}
          onPress={() => onSex(option.value)} style={({ pressed }) => [styles.option, sex === option.value && styles.selected, pressed && styles.pressed]}>
          <Text style={styles.optionText}>{option.label}</Text>
        </Pressable>)}
    </View>
    <Text style={styles.help}>Används för han eller hon i artiklar. Om du inte anger kön använder vi hundens namn.</Text>
  </View>;
}
const styles = StyleSheet.create({
  fields: { gap: tokens.spacing.sm, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.md },
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  help: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  option: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.surface },
  selected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  optionText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  pressed: { opacity: 0.75 },
});
