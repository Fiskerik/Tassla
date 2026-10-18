import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { useReducedMotion } from '../../components/ui/Motion';
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
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const openerRef = useRef<View>(null);
  const opened = useRef(false);
  const filteredBreeds = useMemo(() => filterBreedOptions(breeds, query), [breeds, query]);
  const normalizedQuery = query.trim();
  const selectedBreed = breeds.find((breed) => breed.id === value);
  const selectedLabel = selectedBreed?.name ?? valueLabelFallback ?? '';

  useEffect(() => {
    if (visible) {
      opened.current = true;
      return;
    }
    if (!opened.current) return;
    const frame = requestAnimationFrame(() => {
      const trigger = openerRef.current as unknown as { focus?: (options?: FocusOptions) => void } | null;
      if (Platform.OS === 'web') trigger?.focus?.({ preventScroll: true });
      if (Platform.OS !== 'web') {
        const node = findNodeHandle(openerRef.current);
        if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
      }
      opened.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  function openPicker() {
    if (disabled) return;
    setQuery('');
    setVisible(true);
  }

  function closePicker() {
    Keyboard.dismiss();
    setVisible(false);
  }

  function chooseBreed(breed: BreedOption) {
    onChange(breed.id);
    closePicker();
  }

  function focusSearch() {
    searchRef.current?.focus();
    if (Platform.OS !== 'web') {
      const node = findNodeHandle(searchRef.current);
      if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }

  function renderBreed({ item }: ListRenderItemInfo<BreedOption>) {
    const selected = item.id === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.name}
        accessibilityState={{ selected }}
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
    <>
      <Pressable
        ref={openerRef}
        accessibilityRole="button"
        accessibilityLabel={selectedLabel ? 'Ras: ' + selectedLabel + '. Välj ras.' : 'Välj hundras'}
        accessibilityHint="Öppnar en lista där du kan bläddra eller söka."
        accessibilityState={{ disabled, expanded: visible }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [styles.trigger, disabled && styles.disabled, pressed && styles.pressed]}
      >
        <Text numberOfLines={2} style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
          {selectedLabel || 'Välj ras'}
        </Text>
        <Ionicons name="chevron-down" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType={reduceMotion ? 'none' : 'slide'}
        onRequestClose={closePicker}
        onShow={focusSearch}
        accessibilityViewIsModal
      >
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoiding}
          >
            <Pressable accessibilityRole="button" accessibilityLabel="Stäng raslistan" onPress={closePicker} style={styles.dismissArea} />
            <View accessibilityRole="summary" accessibilityLabel="Välj ras" style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}>
              <View style={styles.header}>
                <Text accessibilityRole="header" style={styles.title}>Välj ras</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Stäng raslistan" onPress={closePicker} style={styles.closeButton}>
                  <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
                </Pressable>
              </View>
              <View style={styles.searchRow}>
                <TextInput
                  ref={searchRef}
                  accessibilityLabel="Sök hundras"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setQuery}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder="Sök bland hundraser"
                  placeholderTextColor={tokens.colors.textSecondary}
                  returnKeyType="search"
                  style={styles.search}
                  value={query}
                />
                {query.length > 0 ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Rensa sökning" onPress={() => setQuery('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={tokens.size.iconSm} color={tokens.colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.hint}>Blandras visas först. Du kan söka på hela eller delar av rasnamnet.</Text>
              <FlatList
                accessibilityRole="radiogroup"
                accessibilityLabel="Raser"
                data={filteredBreeds}
                keyExtractor={(breed) => breed.id}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={18}
                maxToRenderPerBatch={24}
                windowSize={7}
                renderItem={renderBreed}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Text accessibilityLiveRegion="polite" style={styles.emptyTitle}>
                      {normalizedQuery ? 'Ingen träff i FCI-listan.' : 'Raslistan är tom just nu.'}
                    </Text>
                    {normalizedQuery ? (
                      <>
                        <Text style={styles.emptyCopy}>FCI-listan innehåller inte alla raser. Du kan ändå välja ett av alternativen nedan.</Text>
                        {fallbackOptions.map((breed) => (
                          <Pressable key={breed.id} accessibilityRole="button" accessibilityLabel={'Välj ' + breed.name} onPress={() => chooseBreed(breed)} style={({ pressed }) => [styles.option, styles.fallbackOption, pressed && styles.pressed]}>
                            <Text style={styles.optionText}>{breed.name}</Text>
                          </Pressable>
                        ))}
                      </>
                    ) : null}
                  </View>
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  triggerText: { flex: 1, ...tokens.typography.body, color: tokens.colors.textPrimary },
  placeholder: { color: tokens.colors.textSecondary },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.72 },
  backdrop: { flex: 1, backgroundColor: tokens.colors.overlay },
  keyboardAvoiding: { flex: 1, justifyContent: 'flex-end' },
  dismissArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: { width: '100%', height: '84%', maxHeight: '90%', minHeight: 260, paddingTop: tokens.spacing.lg, paddingHorizontal: tokens.spacing.lg, gap: tokens.spacing.md, borderTopLeftRadius: tokens.radius.lg, borderTopRightRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  header: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  title: { flex: 1, ...tokens.typography.heading, color: tokens.colors.textPrimary },
  closeButton: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs },
  search: { flex: 1, minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  clearButton: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  hint: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  list: { flex: 1, minHeight: 0 },
  listContent: { gap: tokens.spacing.xs, paddingBottom: tokens.spacing.md },
  option: { minHeight: tokens.size.touchMin, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  optionSelected: { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.selectedSurface },
  optionText: { flex: 1, flexShrink: 1, ...tokens.typography.body, color: tokens.colors.textPrimary },
  optionTextSelected: { color: tokens.colors.primary, fontWeight: '700' },
  fallbackOption: { marginTop: tokens.spacing.sm },
  empty: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.md },
  emptyTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  emptyCopy: { ...tokens.typography.body, color: tokens.colors.textSecondary },
});