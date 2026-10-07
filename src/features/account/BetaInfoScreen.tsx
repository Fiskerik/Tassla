import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';

export function BetaInfoScreen({ onBack }: { onBack: () => void }) {
  const [linkError, setLinkError] = useState(false);
  async function openEmail() {
    setLinkError(false);
    try {
      await Linking.openURL('mailto:erimali.ab@gmail.com');
    } catch {
      setLinkError(true);
    }
  }
  return <View>
    <QuietButton title="Tillbaka till konto" onPress={onBack} />
    <View style={styles.hero}>
      <Ionicons name="information-circle-outline" size={25} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <PageHeading title="Information om betan" description="Tassla hjälper dig samla uppgifter om hundens vardag." />
    </View>
    <MessageCard>Du väljer själv att spara hundprofil, vardagslogg, vikt, utförda vaccinationer och veterinärbesök, planerade vårdbesök och träningssteg. Lokala påminnelser är frivilliga och av från början. Tassla-passet skapas bara när du väljer att exportera det.</MessageCard>
    <MessageCard>Det här är betainformation, inte en fullständig publicerad integritetspolicy. Uppgifter om leverantörer och övrig driftinformation behöver färdigställas innan betan öppnas för egna konton och sparade uppgifter.</MessageCard>
    <MessageCard>För betan är beslutet att gallra uppgifter senast 30 dagar efter att betan avslutats. Du kan också begära individuell kontoradering här under Kontoinställningar. Informationen beskriver beslutet; den tekniska gallringen har inte verifierats.</MessageCard>
    <View style={styles.company}>
      <Text style={styles.companyName}>EriMali AB</Text>
      <Text style={styles.detail}>Stenvallavägen 1</Text>
      <Text style={styles.detail}>186 34 Vallentuna</Text>
      <Pressable accessibilityRole="link" accessibilityLabel="E-post till Tassla support: erimali.ab@gmail.com"
        onPress={() => { void openEmail(); }} style={({ pressed }) => [styles.email, pressed && styles.pressed]}>
        <Text style={styles.emailText}>erimali.ab@gmail.com</Text>
      </Pressable>
    </View>
    {linkError && <MessageCard tone="error">E-postlänken kunde inte öppnas. Skriv själv till erimali.ab@gmail.com.</MessageCard>}
  </View>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, marginBottom: 12 },
  company: { padding: 18, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginTop: 12 },
  companyName: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  detail: { color: theme.colors.mutedText, fontSize: 15, marginTop: 6 },
  email: { paddingVertical: 12, marginTop: 5 },
  emailText: { color: theme.colors.accent, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.75 },
});
