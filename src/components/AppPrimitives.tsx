import type { ReactNode, RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { tokens } from '../theme/tokens';

export function AppScreen({ children, footer, showBrand = true }: { children: ReactNode; footer?: ReactNode; showBrand?: boolean }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenLayout}>
        <KeyboardAvoidingView style={styles.keyboardLayout} behavior="padding">
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.page} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
            {showBrand ? <>
              <View style={styles.brandMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text style={styles.brandMarkText}>T</Text>
              </View>
              <Text style={styles.brandName}>tassla</Text>
            </> : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </SafeAreaView>
  );
}

export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && (reduceMotion ? styles.buttonReducedPressed : styles.buttonPressed)]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export function QuietButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.quietButton, pressed && !disabled && (reduceMotion ? styles.quietButtonReducedPressed : styles.quietButtonPressed)]}
    >
      <Text style={styles.quietButtonText}>{title}</Text>
    </Pressable>
  );
}

function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  return reduceMotion;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'off';
  textContentType?: 'emailAddress' | 'none';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={() => {
          onSubmitEditing?.();
          if (returnKeyType === 'done') Keyboard.dismiss();
        }}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.textSecondary}
        returnKeyType={returnKeyType}
        style={styles.input}
        textContentType={textContentType}
        value={value}
      />
    </View>
  );
}

export function MessageCard({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'error' }) {
  return (
    <View style={[styles.messageCard, tone === 'error' && styles.errorCard]} accessibilityLiveRegion="polite">
      <Text style={[styles.messageText, tone === 'error' && styles.errorText]}>{children}</Text>
    </View>
  );
}

function focusAccessibilityNode(ref: RefObject<Text | null>) {
  const handle = findNodeHandle(ref.current);
  if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
}

export function InfoModal({ visible, title, children, onClose, onDismiss }: {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onDismiss?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const headingRef = useRef<Text>(null);
  return <Modal
    visible={visible}
    transparent
    animationType={reduceMotion || Platform.OS === 'android' ? 'none' : 'fade'}
    onShow={() => focusAccessibilityNode(headingRef)}
    onRequestClose={onClose}
    onDismiss={onDismiss}
    accessibilityViewIsModal
  >
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <Text ref={headingRef} accessible accessibilityRole="header" style={styles.modalTitle}>{title}</Text>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>{children}</ScrollView>
        <QuietButton title="Stäng information" onPress={onClose} />
      </View>
    </View>
  </Modal>;
}

export function ActionFeedbackModal({ visible, message, onClose, onShown, autoDismiss = true }: {
  visible: boolean;
  message: string;
  onClose: () => void;
  onShown?: (message: string) => void;
  autoDismiss?: boolean;
}) {
  const headingRef = useRef<Text>(null);
  const closeRef = useRef(onClose);
  const shownRef = useRef(onShown);
  useEffect(() => {
    closeRef.current = onClose;
    shownRef.current = onShown;
  }, [onClose, onShown]);
  useEffect(() => {
    if (!visible) return;
    shownRef.current?.(message);
    if (!autoDismiss) return;
    const timeout = setTimeout(() => closeRef.current(), 4000);
    return () => clearTimeout(timeout);
  }, [message, visible, autoDismiss]);
  if (!visible) return null;
  return <View style={styles.feedbackCard} accessibilityLiveRegion="polite">
    <Text ref={headingRef} accessible accessibilityRole="alert" style={styles.messageText}>{message}</Text>
    <QuietButton title="Stäng" onPress={onClose} />
  </View>;
}

export function DatePickerField({ label, value, onChangeText, disabled = false }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const parsed = parseDateValue(value) ?? new Date();
  const [month, setMonth] = useState(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  const days = calendarDays(month);
  return <View style={styles.datePickerField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.datePickerRow}>
      <TextInput accessibilityLabel={`${label}, år-månad-dag`} editable={!disabled} keyboardType="numbers-and-punctuation"
        onChangeText={onChangeText} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={tokens.colors.textSecondary}
        returnKeyType="done" style={styles.datePickerInput} value={value} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Välj ${label.toLowerCase()} i kalender`} disabled={disabled}
        onPress={() => { const next = parseDateValue(value); if (next) setMonth(new Date(next.getFullYear(), next.getMonth(), 1)); setVisible(true); }} style={styles.pickerButton}>
        <Text style={styles.pickerButtonText}>Kalender</Text>
      </Pressable>
    </View>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.modalBackdrop}><View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{label}</Text>
        <View style={styles.calendarHeader}><QuietButton title="Föregående" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} /><Text style={styles.calendarMonth}>{month.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}</Text><QuietButton title="Nästa" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} /></View>
        <View style={styles.calendarGrid}>{days.map((day, index) => day ? <Pressable key={`${day}-${index}`} accessibilityRole="button" accessibilityLabel={formatDateValue(day)} onPress={() => { onChangeText(formatDateValue(day)); setVisible(false); }} style={styles.calendarDay}><Text style={styles.calendarDayText}>{day.getDate()}</Text></Pressable> : <View key={`empty-${index}`} style={styles.calendarDay} />)}</View>
        <TextInput accessibilityLabel="Manuellt datum, år-månad-dag" keyboardType="numbers-and-punctuation" onChangeText={onChangeText} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={tokens.colors.textSecondary} style={styles.input} value={value} />
        <QuietButton title="Stäng kalender" onPress={() => setVisible(false)} />
      </View></View>
    </Modal>
  </View>;
}

export function TimePickerField({ label, value, onChangeText, disabled = false }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const times = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`);
  return <View style={styles.datePickerField}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.datePickerRow}><TextInput accessibilityLabel={`${label}, timmar och minuter`} editable={!disabled} keyboardType="numbers-and-punctuation" maxLength={5}
      onChangeText={onChangeText} placeholder="09:00" placeholderTextColor={tokens.colors.textSecondary} returnKeyType="done" style={styles.datePickerInput} value={value} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Välj ${label.toLowerCase()} från tider`} disabled={disabled} onPress={() => setVisible(true)} style={styles.pickerButton}><Text style={styles.pickerButtonText}>Välj tid</Text></Pressable>
    </View>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)} accessibilityViewIsModal>
      <View style={styles.timeModalBackdrop}>
        <KeyboardAvoidingView style={styles.timeModalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.timeModalCard}>
            <View style={styles.timeModalHandle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle} accessibilityRole="header">{label}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Stäng tider" onPress={() => setVisible(false)} style={styles.timeModalClose}>
                <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
              </Pressable>
            </View>
            <Text style={styles.timeModalCaption}>Vald tid</Text>
            <TextInput accessibilityLabel="Manuell tid, timmar och minuter" keyboardType="numbers-and-punctuation" maxLength={5}
              onChangeText={onChangeText} placeholder="HH:MM" placeholderTextColor={tokens.colors.textSecondary}
              returnKeyType="done" style={styles.timeModalInput} value={value} />
            <Text style={styles.timeModalCaption}>Eller välj en tid</Text>
            <ScrollView style={styles.timeModalList} keyboardShouldPersistTaps="handled">
              {times.map((time) => <Pressable key={time} accessibilityRole="button" accessibilityLabel={`Välj ${time}`}
                accessibilityState={{ selected: value === time }} onPress={() => { onChangeText(time); setVisible(false); }}
                style={({ pressed }) => [styles.timeOption, value === time && styles.timeOptionSelected, pressed && styles.pressed]}>
                <Text style={[styles.timeOptionText, value === time && styles.timeOptionTextSelected]}>{time}</Text>
              </Pressable>)}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  </View>;
}

function parseDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}
function formatDateValue(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function calendarDays(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: tokens.colors.background },
  screenLayout: { flex: 1, width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center' },
  keyboardLayout: { flex: 1 },
  scrollArea: { flex: 1 },
  page: { flexGrow: 1, width: '100%', maxWidth: tokens.layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: tokens.layout.pageInset, paddingTop: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  footer: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  brandMark: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.primary, alignSelf: 'center' },
  brandMarkText: { color: tokens.colors.onPrimary, ...tokens.typography.title },
  brandName: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center', marginTop: tokens.spacing.sm },
  heading: { marginTop: tokens.spacing.xxl, marginBottom: tokens.spacing.xl },
  title: { color: tokens.colors.textPrimary, ...tokens.typography.title },
  description: { color: tokens.colors.textSecondary, ...tokens.typography.body, marginTop: tokens.spacing.md },
  fieldGroup: { marginBottom: tokens.spacing.lg },
  fieldLabel: { color: tokens.colors.textPrimary, ...tokens.typography.caption, fontWeight: '700', marginBottom: tokens.spacing.sm },
  input: { minHeight: tokens.size.buttonHeight, paddingHorizontal: tokens.spacing.lg, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.body },
  button: { minHeight: tokens.size.buttonHeight, borderRadius: tokens.radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.lg, backgroundColor: tokens.colors.primary, marginTop: tokens.spacing.sm, shadowColor: tokens.colors.textPrimary, shadowOpacity: tokens.opacity.shadow, shadowRadius: tokens.spacing.sm, shadowOffset: { width: 0, height: tokens.size.progress }, elevation: tokens.spacing.xs },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { backgroundColor: tokens.colors.primaryPressed, transform: [{ scale: 0.985 }] },
  buttonReducedPressed: { backgroundColor: tokens.colors.primaryPressed, opacity: tokens.opacity.pressed },
  buttonText: { color: tokens.colors.onPrimary, ...tokens.typography.label },
  quietButton: { minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.sm },
  quietButtonPressed: { opacity: 0.65 },
  quietButtonReducedPressed: { opacity: 0.7 },
  quietButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '700' },
  messageCard: { padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.warningSurface, marginTop: tokens.spacing.lg },
  messageText: { color: tokens.colors.textPrimary, ...tokens.typography.caption },
  errorCard: { borderColor: tokens.colors.dangerBorder, backgroundColor: tokens.colors.dangerSurface },
  errorText: { color: tokens.colors.danger },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: tokens.spacing.lg, backgroundColor: tokens.colors.overlay },
  modalCard: { maxHeight: tokens.size.modalMaxHeight, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  modalTitle: { color: tokens.colors.textPrimary, ...tokens.typography.heading, marginBottom: tokens.spacing.md },
  modalScroll: { flexShrink: 1 },
  modalContent: { paddingBottom: tokens.spacing.sm },
  feedbackCard: { padding: tokens.spacing.md, marginTop: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.successSurface },
  datePickerField: { marginBottom: tokens.spacing.lg },
  datePickerRow: { minHeight: tokens.size.touchMin + tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  datePickerInput: { flex: 1, minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, color: tokens.colors.textPrimary, ...tokens.typography.body },
  pickerButton: { minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, justifyContent: 'center', borderLeftWidth: tokens.size.stroke, borderLeftColor: tokens.colors.border },
  pickerButtonText: { color: tokens.colors.primary, ...tokens.typography.caption, fontWeight: '800' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarMonth: { color: tokens.colors.textPrimary, ...tokens.typography.label, textTransform: 'capitalize' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: tokens.spacing.md },
  calendarDay: { width: '14.285%', minHeight: tokens.size.calendarDay, alignItems: 'center', justifyContent: 'center' },
  calendarDayText: { color: tokens.colors.textPrimary, ...tokens.typography.label },
  timeModalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.colors.overlay },
  timeModalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  timeModalCard: { width: '100%', maxHeight: tokens.size.modalMaxHeight, padding: tokens.spacing.lg, gap: tokens.spacing.md, borderTopLeftRadius: tokens.radius.lg, borderTopRightRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  timeModalHandle: { width: tokens.spacing.xl + tokens.spacing.md, height: tokens.size.progress, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.border, alignSelf: 'center' },
  timeModalHeader: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  timeModalClose: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  timeModalTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  timeModalCaption: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  timeModalInput: { minHeight: tokens.size.touchMin + tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, color: tokens.colors.textPrimary, ...tokens.typography.heading },
  timeModalList: { maxHeight: tokens.size.buttonHeight * 4, flexShrink: 1 },
  timeOption: { minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  timeOptionSelected: { backgroundColor: tokens.colors.successSurface },
  timeOptionText: { ...tokens.typography.body, color: tokens.colors.textPrimary, textAlign: 'center' },
  timeOptionTextSelected: { color: tokens.colors.primary, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
