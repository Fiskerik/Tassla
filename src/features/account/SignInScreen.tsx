import { useState } from 'react';
import { Keyboard } from 'react-native';
import { AppScreen, FormField, MessageCard, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { useAuth } from './AuthProvider';

export function SignInScreen() {
  const { sendMagicLink, status } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'sent' | 'error' | null>(null);
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  async function requestLink() {
    if (!validEmail || busy) return;
    Keyboard.dismiss();
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await sendMagicLink(email) ? 'sent' : 'error');
    } catch {
      setMessage('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppScreen>
      <PageHeading
        title="Välkommen till Tassla"
        description="Skriv din e-post så skickar vi en säker inloggningslänk."
      />
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
      <PrimaryButton title={busy ? 'Skickar länk…' : 'Skicka inloggningslänk'} disabled={!validEmail || busy || status === 'unavailable'} onPress={requestLink} />
      {message === 'sent' && <MessageCard>Om adressen kan ta emot mejl kommer en inloggningslänk strax. Öppna den på den här enheten.</MessageCard>}
      {message === 'error' && <MessageCard tone="error">Det gick inte att skicka länken just nu. Kontrollera adressen och försök igen om en stund.</MessageCard>}
      {status === 'unavailable' && <MessageCard tone="error">Inloggningen är inte tillgänglig just nu. Försök igen senare.</MessageCard>}
    </AppScreen>
  );
}
