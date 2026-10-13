import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard } from '../../components/AppPrimitives';
import { SupportScreenHeader } from '../../components/ui';
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
    <SupportScreenHeader title="Information" backLabel="Tillbaka till Konto" accent="account" onBack={onBack} />
    <View style={styles.hero}>
      <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={styles.intro}>Tassla hjälper dig samla uppgifter om hundens vardag.</Text>
    </View>
    <Text style={styles.sectionTitle} accessibilityRole="header">Uppgifter i Tassla</Text>
    <MessageCard>Du väljer själv att spara hundprofil, vardagslogg, vikt, utförda vaccinationer och veterinärbesök, planerade vårdbesök och träningssteg. Lokala påminnelser är frivilliga och av från början. Tassla-passet skapas bara när du väljer att exportera det.</MessageCard>
    <Text style={styles.sectionTitle} accessibilityRole="header">Om betaversionen</Text>
    <MessageCard>Det här är betainformation, inte en fullständig publicerad integritetspolicy. Uppgifter om leverantörer och övrig driftinformation behöver färdigställas innan betan öppnas för egna konton och sparade uppgifter.</MessageCard>
    <Text style={styles.sectionTitle} accessibilityRole="header">Radering av uppgifter</Text>
    <MessageCard>För betan är beslutet att gallra uppgifter senast 30 dagar efter att betan avslutats. Du kan också begära individuell kontoradering här under Kontoinställningar. Informationen beskriver beslutet; den tekniska gallringen har inte verifierats.</MessageCard>
    <Text style={styles.sectionTitle} accessibilityRole="header">Företag och support</Text>
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
  intro: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  hero: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.account.bg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  company: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.md },
  companyName: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  email: { minHeight: tokens.size.touchMin, justifyContent: 'center', marginTop: tokens.spacing.xs },
  emailText: { ...tokens.typography.body, color: tokens.colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.75 },
});
