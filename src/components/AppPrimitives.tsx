import type { ReactNode } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { theme } from '../theme/tokens';

export function AppScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screenLayout}>
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.brandMarkText}>T</Text>
          </View>
          <Text style={styles.brandName}>tassla</Text>
          {children}
        </ScrollView>
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
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.mutedText}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  screenLayout: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  scrollArea: { flex: 1 },
  page: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
  footer: { borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  brandMark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, alignSelf: 'center' },
  brandMarkText: { color: theme.colors.onAccent, fontSize: 24, fontWeight: '800' },
  brandName: { color: theme.colors.accent, fontSize: 15, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center', marginTop: 7 },
  heading: { marginTop: 54, marginBottom: 28 },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: '800', lineHeight: 38, letterSpacing: -0.6 },
  description: { color: theme.colors.mutedText, fontSize: 17, lineHeight: 25, marginTop: 12 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 56, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 },
  button: { minHeight: 56, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: theme.colors.accent, marginTop: 10 },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { backgroundColor: '#12543D', transform: [{ scale: 0.985 }] },
  buttonReducedPressed: { backgroundColor: '#12543D', opacity: 0.9 },
  buttonText: { color: theme.colors.onAccent, fontSize: 16, fontWeight: '800' },
  quietButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8 },
  quietButtonPressed: { opacity: 0.65 },
  quietButtonReducedPressed: { opacity: 0.7 },
  quietButtonText: { color: theme.colors.accent, fontSize: 15, fontWeight: '700' },
  messageCard: { padding: 16, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#EFE8DA', marginTop: 18 },
  messageText: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  errorCard: { borderColor: '#D5A5A0', backgroundColor: '#F7EAE7' },
  errorText: { color: theme.colors.error },
});
