import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard } from '../../components/AppPrimitives';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Button } from '../../components/ui/Button';
import type { BreedOption } from '../../data/app-data';
import { tokens } from '../../theme/tokens';

type BreedLoadState = 'loading' | 'ready' | 'error';

export function BreedPickerField({
  label,
  value,
  breeds,
  state,
  disabled = false,
  onChange,
  onRetry,
}: {
  label: string;
  value: string;
  breeds: readonly BreedOption[];
  state: BreedLoadState;
  disabled?: boolean;
  onChange: (breed: BreedOption) => void;
  onRetry: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selectedBreed = breeds.find((breed) => breed.id === value);
  const missingSavedBreed = state === 'ready' && Boolean(value) && !selectedBreed;
  const filteredBreeds = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return breeds;
    return breeds.filter((breed) => breed.name.toLowerCase().includes(search));
  }, [breeds, query]);
  const unknownBreed = breeds.find((breed) => breed.id === 'unknown');

  function close() {
    Keyboard.dismiss();
    setVisible(false);
  }

  function choose(breed: BreedOption) {
    onChange(breed);
    setQuery('');
    close();
  }

  function open() {
    if (disabled || state !== 'ready') return;
    setQuery('');
    setVisible(true);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {state === 'loading' ? (
        <View accessibilityRole="progressbar" accessibilityLabel="Hämtar raslistan" style={styles.loading}>
          <ActivityIndicator color={tokens.colors.primary} />
          <Text style={styles.supportText}>Hämtar raslistan…</Text>
        </View>
      ) : state === 'error' ? (
        <View style={styles.errorState}>
          <MessageCard tone="error">Raslistan kunde inte hämtas. Kontrollera anslutningen och försök igen.</MessageCard>
          <Button variant="secondary" label="Försök igen" accessibilityLabel="Hämta raslistan igen" onPress={onRetry} />
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={selectedBreed ? `${label}: ${selectedBreed.name}` : `${label}: ${value ? 'Ras saknas i listan' : 'Välj ras'}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={open}
            style={({ pressed }) => [styles.trigger, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
            testID="breed-picker-trigger"
          >
            <Text style={[styles.triggerValue, !selectedBreed && styles.placeholder]}>
              {selectedBreed?.name ?? (value ? 'Ras saknas i listan' : 'Välj ras')}
            </Text>
            <Ionicons name="chevron-down" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          </Pressable>
          {missingSavedBreed ? <Text style={styles.supportText}>Den sparade rasen saknas i listan. Välj en ny ras eller behåll den för att spara andra ändringar.</Text> : null}
        </>
      )}
      <BottomSheet
        visible={visible}
        title="Välj ras"
        keyboardAware
        scrollContent={false}
        onRequestClose={close}
      >
        <View style={styles.sheetBody}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <TextInput
              accessibilityLabel="Sök hundras"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setQuery}
              placeholder="Sök ras"
              placeholderTextColor={tokens.colors.textSecondary}
              returnKeyType="search"
              style={styles.searchInput}
              testID="breed-search-input"
              value={query}
            />
            {query.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Rensa sökning" onPress={() => setQuery('')} style={styles.clearSearch}>
                <Ionicons name="close-circle" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <FlatList
            accessibilityLabel="Rasalternativ"
            contentContainerStyle={styles.listContent}
            data={filteredBreeds}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={(breed) => breed.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={(
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{query.trim() ? 'Ingen ras hittades' : 'Raslistan är tom'}</Text>
                {query.trim() ? <Text style={styles.supportText}>{unknownBreed ? 'Prova ett annat namn eller välj Okänd ras.' : 'Prova ett annat namn.'}</Text> : <Text style={styles.supportText}>Det finns inga raser att välja just nu.</Text>}
                {query.trim() && unknownBreed ? (
                  <Button variant="secondary" label="Välj Okänd ras" accessibilityLabel="Välj Okänd ras" onPress={() => choose(unknownBreed)} />
                ) : null}
              </View>
            )}
            renderItem={({ item }) => {
              const selected = item.id === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected }}
                  aria-checked={selected}
                  onPress={() => choose(item)}
                  style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
                  testID={`breed-option-${item.id}`}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.name}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
                </Pressable>
              );
            }}
            style={styles.list}
            testID="breed-options-list"
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: tokens.spacing.md },
  label: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm },
  trigger: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  triggerValue: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, flexShrink: 1 },
  placeholder: { color: tokens.colors.textSecondary },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.58 },
  loading: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  errorState: { gap: tokens.spacing.sm },
  supportText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  sheetBody: { flex: 1, minHeight: 0, gap: tokens.spacing.md },
  searchField: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingLeft: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.borderStrong, backgroundColor: tokens.colors.surface },
  searchInput: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, minHeight: tokens.size.buttonHeight, paddingVertical: tokens.spacing.sm },
  clearSearch: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingBottom: tokens.spacing.md, flexGrow: 1 },
  separator: { height: tokens.size.stroke, backgroundColor: tokens.colors.border, marginLeft: tokens.spacing.md },
  option: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderRadius: tokens.radius.sm },
  optionSelected: { backgroundColor: tokens.colors.selectedSurface },
  optionText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, flexShrink: 1 },
  optionTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
  emptyState: { flex: 1, minHeight: tokens.size.buttonHeight * 2, justifyContent: 'center', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.spacing.md },
  emptyTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, textAlign: 'center' },
});
