import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppScreen, FormField, MessageCard, PrimaryButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';

export function SignInScreenView({ cancelGoogleSignIn, googlePending, sendMagicLink, signInWithGoogle, signOutWarning, status }: {
  cancelGoogleSignIn: () => void;
  googlePending: boolean;
  sendMagicLink: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOutWarning: string | null;
  status: 'loading' | 'signedOut' | 'signedIn' | 'unavailable';
}) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'sent' | 'error' | 'google-opened' | 'google-error' | null>(null);
  const operationInFlight = useRef(false);
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  async function requestLink() {
    if (!validEmail || operationInFlight.current) return;
    operationInFlight.current = true;
    Keyboard.dismiss();
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await sendMagicLink(email) ? 'sent' : 'error');
    } catch {
      setMessage('error');
    } finally {
      operationInFlight.current = false;
      setBusy(false);
    }
  }

  async function requestGoogle() {
    if (operationInFlight.current || status === 'unavailable') return;
    operationInFlight.current = true;
    Keyboard.dismiss();
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await signInWithGoogle() ? 'google-opened' : 'google-error');
    } catch {
      setMessage('google-error');
    } finally {
      operationInFlight.current = false;
      setBusy(false);
    }
  }

  return <AppScreen>
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="paw-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} />
      </View>
      <View style={styles.welcomeCopy}>
        <Text accessibilityRole="header" style={styles.welcomeTitle}>Välkommen till Tassla</Text>
        <Text style={styles.welcomeDescription}>Logga in med Google eller få en säker inloggningslänk via e-post.</Text>
      </View>
    </View>
    {signOutWarning && <MessageCard tone="error">{signOutWarning}</MessageCard>}
    <PrimaryButton title={busy ? 'Öppnar Google…' : 'Fortsätt med Google'} disabled={busy || googlePending || status === 'unavailable'} onPress={() => { void requestGoogle(); }} />
    {googlePending && <MessageCard>Google-inloggningen väntar på att du återvänder från webbläsaren. Om du har avbrutit kan du stänga försöket här.</MessageCard>}
    {googlePending && <SecondaryButton title="Avbryt Google-inloggning" onPress={cancelGoogleSignIn} />}
    <View style={styles.emailCard}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ELLER</Text>
        <View style={styles.dividerLine} />
      </View>
      <FormField autoCapitalize="none" autoComplete="email" keyboardType="email-address" label="E-postadress"
        onChangeText={(value) => { setEmail(value); setMessage(null); }} onSubmitEditing={requestLink}
        placeholder="namn@exempel.se" returnKeyType="done" textContentType="emailAddress" value={email} />
      <SecondaryButton title={busy ? 'Skickar länk…' : 'Skicka inloggningslänk'} disabled={!validEmail || busy || googlePending || status === 'unavailable'} onPress={() => { void requestLink(); }} />
    </View>
    {message === 'sent' && <MessageCard>Om adressen kan ta emot mejl kommer en inloggningslänk strax. Öppna den på den här enheten.</MessageCard>}
    {message === 'error' && <MessageCard tone="error">Det gick inte att skicka länken just nu. Kontrollera adressen och försök igen om en stund.</MessageCard>}
    {message === 'google-opened' && <MessageCard>Fortsätt i webbläsaren och återvänd hit när du är klar. Om du avbryter kan du försöka igen eller använda e-postlänken.</MessageCard>}
    {message === 'google-error' && <MessageCard tone="error">Google-inloggningen kunde inte startas. Försök igen eller använd e-postlänken.</MessageCard>}
    {status === 'unavailable' && <MessageCard tone="error">Inloggningen är inte tillgänglig just nu. Försök igen senare.</MessageCard>}
  </AppScreen>;
}

function SecondaryButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.secondaryButton, disabled && styles.secondaryDisabled, pressed && !disabled && styles.secondaryPressed]}>
    <Text style={styles.secondaryText}>{title}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, marginBottom: tokens.spacing.md, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.support.account.bg },
  welcomeIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface },
  welcomeCopy: { flex: 1 },
  welcomeTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  welcomeDescription: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  emailCard: { marginTop: tokens.spacing.lg, padding: tokens.spacing.lg, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  divider: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg },
  dividerLine: { flex: 1, height: tokens.size.stroke, backgroundColor: tokens.colors.border },
  dividerText: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700' },
  secondaryButton: { minHeight: tokens.size.buttonHeight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.lg, borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.primary, backgroundColor: tokens.colors.surface },
  secondaryDisabled: { opacity: 0.5 },
  secondaryPressed: { backgroundColor: tokens.colors.selectedSurface },
  secondaryText: { ...tokens.typography.label, color: tokens.colors.primary, textAlign: 'center' },
});
