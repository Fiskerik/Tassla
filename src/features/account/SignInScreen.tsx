import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { AppScreen, FormField, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import { useAuth } from './AuthProvider';

export function SignInScreen() {
  const { cancelGoogleSignIn, googlePending, sendMagicLink, signInWithGoogle, signOutWarning, status } = useAuth();
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

  return (
    <AppScreen>
      <PageHeading
        title="Välkommen till Tassla"
        description="Logga in med Google eller få en säker inloggningslänk via e-post."
      />
      {signOutWarning && <MessageCard tone="error">{signOutWarning}</MessageCard>}
      <PrimaryButton title={busy ? 'Öppnar Google…' : 'Fortsätt med Google'} disabled={busy || googlePending || status === 'unavailable'} onPress={() => { void requestGoogle(); }} />
      {googlePending && <MessageCard>Google-inloggningen väntar på att du återvänder från webbläsaren. Om du har avbrutit kan du stänga försöket här.</MessageCard>}
      {googlePending && <PrimaryButton title="Avbryt Google-inloggning" onPress={cancelGoogleSignIn} />}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ELLER MED E-POST</Text>
        <View style={styles.dividerLine} />
      </View>
      <FormField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label="E-postadress"
        onChangeText={(value) => { setEmail(value); setMessage(null); }}
        onSubmitEditing={requestLink}
        placeholder="namn@exempel.se"
        returnKeyType="done"
        textContentType="emailAddress"
        value={email}
      />
      <PrimaryButton title={busy ? 'Skickar länk…' : 'Skicka inloggningslänk'} disabled={!validEmail || busy || googlePending || status === 'unavailable'} onPress={() => { void requestLink(); }} />
      {message === 'sent' && <MessageCard>Om adressen kan ta emot mejl kommer en inloggningslänk strax. Öppna den på den här enheten.</MessageCard>}
      {message === 'error' && <MessageCard tone="error">Det gick inte att skicka länken just nu. Kontrollera adressen och försök igen om en stund.</MessageCard>}
      {message === 'google-opened' && <MessageCard>Fortsätt i webbläsaren och återvänd hit när du är klar. Om du avbryter kan du försöka igen eller använda e-postlänken.</MessageCard>}
      {message === 'google-error' && <MessageCard tone="error">Google-inloggningen kunde inte startas. Försök igen eller använd e-postlänken.</MessageCard>}
      {status === 'unavailable' && <MessageCard tone="error">Inloggningen är inte tillgänglig just nu. Försök igen senare.</MessageCard>}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.mutedText, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});
