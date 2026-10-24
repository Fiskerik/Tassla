import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppScreen, PageHeading, PrimaryButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';

export function AuthCallbackView({ mode, pendingMessage, onReturn }: {
  mode: 'pending' | 'error' | 'preview';
  pendingMessage?: string;
  onReturn: () => void;
}) {
  if (mode === 'preview') return <AppScreen>
    <PageHeading title="Förhandsvisning" description="Inloggning är inte tillgänglig här." />
    <View style={styles.statusCard}>
      <View style={[styles.statusIcon, styles.infoIcon]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="information-circle-outline" size={tokens.size.iconMd} color={tokens.colors.support.account.fg} />
      </View>
      <Text style={styles.pendingText}>Granskningsdata · sparas lokalt</Text>
    </View>
    <PrimaryButton title="Till Hem" onPress={onReturn} />
  </AppScreen>;

  const isError = mode === 'error';
  return <AppScreen>
    <PageHeading title={isError ? 'Länken fungerar inte' : 'Välkommen till Tassla'}
      description={isError ? 'Gå tillbaka till inloggningen för att försöka igen.' : 'Vi öppnar din trygga plats för livet med hund.'} />
    <View style={[styles.statusCard, isError && styles.errorCard]}>
      <View style={[styles.statusIcon, isError ? styles.errorIcon : styles.infoIcon]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={isError ? 'alert-circle-outline' : 'paw-outline'} size={tokens.size.iconMd}
          color={isError ? tokens.colors.danger : tokens.colors.support.account.fg} />
      </View>
      <Text style={styles.pendingText}>{isError ? 'Länken kan ha gått ut eller vara ogiltig. Begär en ny och öppna den på den här enheten.' : pendingMessage}</Text>
    </View>
    {isError && <PrimaryButton title="Till inloggningen" onPress={onReturn} />}
  </AppScreen>;
}

const styles = StyleSheet.create({
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.support.account.bg },
  errorCard: { backgroundColor: tokens.colors.dangerSurface, borderColor: tokens.colors.dangerBorder },
  statusIcon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface },
  infoIcon: { backgroundColor: tokens.colors.surface },
  errorIcon: { backgroundColor: tokens.colors.surface },
  pendingText: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1 },
});
