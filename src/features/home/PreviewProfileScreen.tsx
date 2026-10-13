import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField, MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { AppBar } from '../../components/ui';
import type { Dog } from '../onboarding/dog';
import { ageInWeeks, localDate } from '../onboarding/dog';
import type { AgeDisplayUnit } from '../../data/app-data';
import { tokens } from '../../theme/tokens';

export function PreviewProfileScreen({
  dog,
  onSave,
  onCancel,
}: {
  dog: Dog;
  onSave: (dog: Dog) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dog.name);
  const [birthDate, setBirthDate] = useState(dog.birthDate);
  const [ageDisplayUnit, setAgeDisplayUnit] = useState<AgeDisplayUnit>(dog.ageDisplayUnit ?? 'weeks');
  const validName = name.trim().length > 0 && name.trim().length <= 80;
  const validBirthDate = isValidBirthDate(birthDate);

  return (
    <View style={styles.screen}>
      <AppBar mode="Back" title="Hundprofil" actionLabel="Tillbaka hem" onAction={onCancel} />
      <Text style={styles.description}>Ändra uppgifterna för att granska namn och ålder på Hem.</Text>
      <View style={styles.fields}>
        <FormField label="Hundens namn" onChangeText={setName} placeholder="Exempelhund" value={name} />
        <FormField
          autoCapitalize="none"
          autoComplete="off"
          label="Födelsedatum"
          onChangeText={setBirthDate}
          placeholder="ÅÅÅÅ-MM-DD"
          value={birthDate}
        />
      </View>
      <Text style={styles.label}>Visa ålder som</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Visa ålder som" style={styles.ageOptions}>
        {AGE_DISPLAY_OPTIONS.map((option) => {
          const selected = ageDisplayUnit === option.value;
          return <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
            accessibilityState={{ selected }} onPress={() => setAgeDisplayUnit(option.value)}
            style={[styles.ageOption, selected && styles.ageOptionSelected]}>
            <Text style={[styles.ageOptionText, selected && styles.ageOptionTextSelected]}>{option.label}</Text>
          </Pressable>;
        })}
      </View>
      {(!validName || !validBirthDate) && (
        <MessageCard tone="error">
          {!validName ? 'Ange ett namn på högst 80 tecken. ' : ''}
          {!validBirthDate ? 'Ange ett giltigt datum i formatet ÅÅÅÅ-MM-DD som inte ligger i framtiden.' : ''}
        </MessageCard>
      )}
      <MessageCard>Det här är syntetiska uppgifter. Ändringar finns bara i minnet och försvinner när appen stängs.</MessageCard>
      <PrimaryButton
        title="Visa Hem"
        disabled={!validName || !validBirthDate}
        onPress={() => onSave({ ...dog, name: name.trim(), birthDate: birthDate.trim(), ageDisplayUnit })}
      />
    </View>
  );
}

const AGE_DISPLAY_OPTIONS: readonly { value: AgeDisplayUnit; label: string }[] = [
  { value: 'weeks', label: 'Veckor' },
  { value: 'months', label: 'Månader' },
  { value: 'years', label: 'År' },
];

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  description: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  fields: { gap: tokens.spacing.sm },
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  ageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm },
  ageOption: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin * 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.full, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  ageOptionSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  ageOptionText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  ageOptionTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
});

function isValidBirthDate(value: string): boolean {
  try {
    ageInWeeks(value.trim(), localDate());
    return true;
  } catch {
    return false;
  }
}
