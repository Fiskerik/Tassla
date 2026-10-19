import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../../theme/tokens';
import type { BreedOption } from '../../data/app-data';
import { filterBreedOptions } from './breed-picker-model';

export function SearchableBreedPicker({
  breeds,
  value,
  onChange,
  disabled = false,
  valueLabelFallback,
}: {
  breeds: readonly BreedOption[];
  value: string;
  onChange: (breedId: string) => void;
  disabled?: boolean;
  valueLabelFallback?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredBreeds = useMemo(() => filterBreedOptions(breeds, query), [breeds, query]);
  const normalizedQuery = query.trim();
  const selectedBreed = breeds.find((breed) => breed.id === value);
  const selectedLabel = selectedBreed?.name ?? valueLabelFallback ?? '';

  const cancelPendingBlur = useCallback(() => {
    if (blurTimeout.current === null) return;
    clearTimeout(blurTimeout.current);
    blurTimeout.current = null;
  }, []);

  const closePicker = useCallback((dismissKeyboard = true) => {
    cancelPendingBlur();
    setExpanded(false);
    setQuery('');
    if (dismissKeyboard) Keyboard.dismiss();
  }, [cancelPendingBlur]);

  useEffect(() => () => cancelPendingBlur(), [cancelPendingBlur]);

  useEffect(() => {
    if (!expanded || Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closePicker();
      inputRef.current?.blur();
      return true;
    });
    return () => subscription.remove();
  }, [closePicker, expanded]);

  function openPicker() {
    if (disabled) return;
    cancelPendingBlur();
    setQuery('');
    setExpanded(true);
  }

  function handleBlur() {
    cancelPendingBlur();
    blurTimeout.current = setTimeout(() => {
      blurTimeout.current = null;
      closePicker(false);
    }, 180);
  }

  function handleChangeText(text: string) {
    cancelPendingBlur();
    setQuery(text);
    setExpanded(true);
  }

  function chooseBreed(breed: BreedOption) {
    cancelPendingBlur();
    onChange(breed.id);
    closePicker();
    inputRef.current?.blur();
  }

  function clearSearch() {
    cancelPendingBlur();
    setQuery('');
    inputRef.current?.focus();
  }

  function togglePicker() {
    if (disabled) return;
    if (expanded) {
      closePicker();
      inputRef.current?.blur();
      return;
    }
    openPicker();
    inputRef.current?.focus();
  }

  function handleKeyPress(event: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (event.nativeEvent.key !== 'Escape' || !expanded) return;
    closePicker();
    inputRef.current?.blur();
  }

  function renderBreed(item: BreedOption) {
    const selected = item.id === value;
    return (
      <Pressable
        key={item.id}
        accessibilityRole="radio"
        accessibilityLabel={item.name}
        accessibilityState={{ selected }}
        onPressIn={cancelPendingBlur}
        onPress={() => chooseBreed(item)}
        style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}
      >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.name}</Text>
        {selected ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
      </Pressable>
    );
  }

  const fallbackOptions = ['unknown', 'mixed']
    .map((id) => breeds.find((breed) => breed.id === id))
    .filter((breed): breed is BreedOption => Boolean(breed));

  return (
    <View style={styles.container}>
      <View style={[styles.field, expanded && styles.fieldExpanded, disabled && styles.disabled]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Ras"
          accessibilityHint={expanded ? 'Skriv för att söka eller välj ett rasförslag nedanför.' : 'Tryck för att visa och söka bland hundraser.'}
          accessibilityState={{ disabled, expanded }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          onFocus={openPicker}
          onKeyPress={handleKeyPress}
          onSubmitEditing={() => Keyboard.dismiss()}
          placeholder={selectedLabel || 'Välj eller sök ras'}
          placeholderTextColor={tokens.colors.textSecondary}
          returnKeyType="search"
          spellCheck={false}
          underlineColorAndroid="transparent"
          style={styles.input}
          value={expanded ? query : selectedLabel}
        />
        {expanded && query.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rensa sökning"
            onPressIn={cancelPendingBlur}
            onPress={clearSearch}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Ionicons name="close-circle" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Stäng raslista' : 'Visa raslista'}
          accessibilityHint="Öppnar eller stänger raslistan."
          accessibilityState={{ disabled, expanded }}
          disabled={disabled}
          onPressIn={cancelPendingBlur}
          onPress={togglePicker}
          style={({ pressed }) => [styles.chevron, pressed && styles.pressed]}
        >
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={tokens.size.iconSm} color={tokens.colors.primary} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.dropdown}>
          <ScrollView
            accessibilityRole="radiogroup"
            accessibilityLabel="Raser"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {filteredBreeds.length > 0 ? filteredBreeds.map(renderBreed) : (
              <View style={styles.empty}>
                <Text accessibilityLiveRegion="polite" style={styles.emptyTitle}>
                  {normalizedQuery ? 'Ingen träff i FCI-listan.' : 'Raslistan är tom just nu.'}
                </Text>
                {normalizedQuery ? (
                  <>
                    <Text style={styles.emptyCopy}>FCI-listan innehåller inte alla raser. Du kan ändå välja ett av alternativen nedan.</Text>
                    {fallbackOptions.map((breed) => (
                      <Pressable key={breed.id} accessibilityRole="radio" accessibilityLabel={breed.name} accessibilityState={{ selected: breed.id === value }} onPressIn={cancelPendingBlur} onPress={() => chooseBreed(breed)} style={({ pressed }) => [styles.option, styles.fallbackOption, pressed && styles.pressed]}>
                        <Text style={styles.optionText}>{breed.name}</Text>
                      </Pressable>
                    ))}
                  </>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 10 },
  field: { minHeight: tokens.size.buttonHeight, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  fieldExpanded: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  input: { flex: 1, minHeight: tokens.size.touchMin - tokens.size.stroke * 2, paddingHorizontal: tokens.spacing.md, paddingVertical: 0, margin: 0, borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', color: tokens.colors.textPrimary, ...tokens.typography.body, textAlignVertical: 'center', outlineWidth: 0, outlineColor: 'transparent' },
  chevron: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.6 },
  dropdown: { maxHeight: tokens.size.touchMin * 6, borderWidth: tokens.size.stroke, borderTopWidth: 0, borderColor: tokens.colors.primary, borderBottomLeftRadius: tokens.radius.md, borderBottomRightRadius: tokens.radius.md, backgroundColor: tokens.colors.surface, overflow: 'hidden' },
  list: { maxHeight: tokens.size.touchMin * 6 },
  listContent: { gap: tokens.spacing.xs, padding: tokens.spacing.xs },
  clearButton: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  option: { minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  optionSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  optionText: { flex: 1, flexShrink: 1, ...tokens.typography.body, color: tokens.colors.textPrimary },
  optionTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
  fallbackOption: { marginTop: tokens.spacing.sm },
  empty: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.sm },
  emptyTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  emptyCopy: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  pressed: { opacity: 0.72 },
});
