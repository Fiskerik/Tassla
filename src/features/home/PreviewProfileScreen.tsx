import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormField, MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import type { Dog } from '../onboarding/dog';
import { ageInWeeks, localDate } from '../onboarding/dog';
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
  const validName = name.trim().length > 0 && name.trim().length <= 80;
  const validBirthDate = isValidBirthDate(birthDate);

  return (
    <View style={styles.screen}>
      <PageHeading title="Hundprofil" description="Ändra uppgifterna för att granska namn och ålder på Hem." />
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
        onPress={() => onSave({ ...dog, name: name.trim(), birthDate: birthDate.trim() })}
      />
      <QuietButton title="Tillbaka hem" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  fields: { gap: tokens.spacing.sm },
});

function isValidBirthDate(value: string): boolean {
  try {
    ageInWeeks(value.trim(), localDate());
    return true;
  } catch {
    return false;
  }
}
