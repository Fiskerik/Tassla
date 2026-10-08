import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';

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
      <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
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
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.selectedSurface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  company: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.md },
  companyName: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  email: { minHeight: tokens.size.touchMin, justifyContent: 'center', marginTop: tokens.spacing.xs },
  emailText: { ...tokens.typography.body, color: tokens.colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.75 },
});
