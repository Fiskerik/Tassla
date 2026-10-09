import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Card, InfoBanner, ListRow, SectionHeader } from '../../components/ui';
import { tokens } from '../../theme/tokens';

export function BetaInfoScreen(props: { onBack: () => void }) {
  void props.onBack;
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
    <SectionHeader title="Information om betan" />
    <Text style={styles.caption}>Tassla hjälper dig samla uppgifter om hundens vardag.</Text>
    <Card accessibilityLabel="Vad du själv väljer att spara"><Text style={styles.body}>Du väljer själv att spara hundprofil, vardagslogg, vikt, utförda vaccinationer och veterinärbesök, planerade vårdbesök och träningssteg. Lokala påminnelser är frivilliga och av från början. Tassla-passet skapas bara när du väljer att exportera det.</Text></Card>
    <Card accessibilityLabel="Betainformation"><Text style={styles.body}>Det här är betainformation, inte en fullständig publicerad integritetspolicy. Uppgifter om leverantörer och övrig driftinformation behöver färdigställas innan betan öppnas för egna konton och sparade uppgifter.</Text></Card>
    <Card accessibilityLabel="Gallring"><Text style={styles.body}>För betan är beslutet att gallra uppgifter senast 30 dagar efter att betan avslutats. Du kan också begära individuell kontoradering under Kontoinställningar. Informationen beskriver beslutet; den tekniska gallringen har inte verifierats.</Text></Card>
    <View style={styles.company}>
      <Text style={styles.companyName}>EriMali AB</Text>
      <Text style={styles.detail}>Stenvallavägen 1</Text>
      <Text style={styles.detail}>186 34 Vallentuna</Text>
      <ListRow category="veterinary" title="Kontakta support" detail="erimali.ab@gmail.com" onPress={() => { void openEmail(); }} />
    </View>
    {linkError && <InfoBanner>E-postlänken kunde inte öppnas. Skriv själv till erimali.ab@gmail.com.</InfoBanner>}
  </View>;
}

const styles = StyleSheet.create({
  company: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, marginTop: tokens.spacing.md },
  companyName: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  caption: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginBottom: tokens.spacing.md },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary },
});
