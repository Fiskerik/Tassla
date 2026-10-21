import { useCallback, useEffect, useRef, useState } from 'react';
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
  useWindowDimensions,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BreedOption } from '../../data/app-data';
import { useReducedMotion } from '../../components/ui/Motion';
import { tokens } from '../../theme/tokens';
import { filterBreedsByQuery, findUnknownBreed } from './breed-search';

export function SearchableBreedPicker({ breeds, selectedId, missingValueLabel, disabled = false, onSelect }: {
  breeds: readonly BreedOption[];
  selectedId: string;
  missingValueLabel?: string;
  disabled?: boolean;
  onSelect: (breedId: string) => void;
}) {
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<View>(null);
  const searchRef = useRef<TextInput>(null);
  const focusRestoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedBreed = breeds.find((breed) => breed.id === selectedId);
  const filteredBreeds = filterBreedsByQuery(breeds, query);
  const unknownBreed = filteredBreeds.length === 0 && query.trim() ? findUnknownBreed(breeds) : undefined;

  function focusNode(ref: typeof triggerRef | typeof searchRef) {
    if (Platform.OS === 'web') {
      (ref.current as unknown as { focus?: () => void } | null)?.focus?.();
      return;
    }
    const node = findNodeHandle(ref.current);
    if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
  }

  const restoreFocus = useCallback(() => {
    if (focusRestoreTimer.current) clearTimeout(focusRestoreTimer.current);
    focusRestoreTimer.current = null;
    focusNode(triggerRef);
  }, []);

  const closePicker = useCallback(() => {
    if (focusRestoreTimer.current) clearTimeout(focusRestoreTimer.current);
    setVisible(false);
    setQuery('');
    Keyboard.dismiss();
    focusRestoreTimer.current = setTimeout(restoreFocus, reducedMotion ? 0 : 250);
  }, [reducedMotion, restoreFocus]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, closePicker]);

  function openPicker() {
    if (disabled || breeds.length === 0) return;
    setQuery('');
    setVisible(true);
  }

  function selectBreed(breed: BreedOption) {
    if (disabled) return;
    onSelect(breed.id);
    closePicker();
  }

  function focusSearch() {
    searchRef.current?.focus();
    focusNode(searchRef);
  }

  const label = selectedBreed?.name ?? (selectedId ? missingValueLabel ?? selectedId : 'Välj ras');

  return <>
    <Pressable
      ref={triggerRef}
      accessibilityRole="button"
      accessibilityLabel={`Ras, ${label}`}
      accessibilityHint="Öppnar rasväljaren"
      accessibilityState={{ disabled: disabled || breeds.length === 0 }}
      disabled={disabled || breeds.length === 0}
      onPress={openPicker}
      style={({ pressed }) => [styles.trigger, pressed && !disabled && styles.pressed, (disabled || breeds.length === 0) && styles.disabled]}
    >
      <Text style={[styles.triggerText, !selectedBreed && !selectedId && styles.placeholder]}>{label}</Text>
      <Ionicons name="chevron-down" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    </Pressable>
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion || Platform.OS === 'android' ? 'none' : 'fade'}
      onShow={focusSearch}
      onRequestClose={closePicker}
      onDismiss={restoreFocus}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView style={styles.modalPosition} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalCard, { maxHeight: Math.min(height * 0.9, 640) }]}>
            <View style={styles.modalHeader}>
              <Text accessibilityRole="header" style={styles.title}>Välj ras</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Stäng rasväljaren" onPress={closePicker} style={styles.closeButton}>
                <Text style={styles.closeText}>Stäng</Text>
              </Pressable>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              <TextInput
                ref={searchRef}
                accessibilityLabel="Sök hundras"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key === 'Escape') closePicker();
                }}
                onSubmitEditing={() => Keyboard.dismiss()}
                placeholder="Sök ras"
                placeholderTextColor={tokens.colors.textSecondary}
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
              {query.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Rensa sökning" onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
              </Pressable> : null}
            </View>
            {filteredBreeds.length > 0 ? <FlatList
              accessibilityRole="radiogroup"
              accessibilityLabel="Rasresultat"
              data={filteredBreeds}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(breed) => breed.id}
              renderItem={({ item, index }) => {
                const selected = item.id === selectedId;
                return <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected, disabled }}
                  aria-checked={selected}
                  disabled={disabled}
                  onPress={() => selectBreed(item)}
                  style={({ pressed }) => [styles.breedOption, selected && styles.breedSelected, index < filteredBreeds.length - 1 && styles.breedDivider, pressed && !disabled && styles.pressed]}
                >
                  <Text style={[styles.breedText, selected && styles.breedTextSelected]}>{item.name}</Text>
                  {selected ? <Ionicons name="checkmark" size={tokens.size.iconSm} color={tokens.colors.support.profile.fg} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
                </Pressable>;
              }}
            /> : <View style={styles.emptyState} accessibilityLiveRegion="polite">
              <Text style={styles.emptyText}>Ingen ras hittades.</Text>
              {unknownBreed ? <Pressable accessibilityRole="button" accessibilityLabel="Välj Okänd ras" disabled={disabled} onPress={() => selectBreed(unknownBreed)} style={({ pressed }) => [styles.unknownAction, pressed && !disabled && styles.pressed]}>
                <Text style={styles.unknownText}>Välj Okänd ras</Text>
              </Pressable> : null}
            </View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  triggerText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0 },
  placeholder: { color: tokens.colors.textSecondary },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.72 },
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing.md, backgroundColor: tokens.colors.overlay },
  modalPosition: { width: '100%', maxWidth: 520, justifyContent: 'center' },
  modalCard: { width: '100%', borderRadius: tokens.radius.lg, padding: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flex: 1 },
  closeButton: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin, paddingHorizontal: tokens.spacing.sm, justifyContent: 'center', alignItems: 'center' },
  closeText: { ...tokens.typography.label, color: tokens.colors.primary },
  searchRow: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, marginBottom: tokens.spacing.sm, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  searchInput: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0, paddingVertical: tokens.spacing.xs },
  clearButton: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  breedOption: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.md },
  breedDivider: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  breedSelected: { backgroundColor: tokens.colors.support.profile.bg },
  breedText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, minWidth: 0 },
  breedTextSelected: { color: tokens.colors.support.profile.fg, fontWeight: '700' },
  emptyState: { minHeight: tokens.size.touchMin * 2, alignItems: 'flex-start', justifyContent: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md },
  emptyText: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  unknownAction: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.sm },
  unknownText: { ...tokens.typography.label, color: tokens.colors.primary },
});
