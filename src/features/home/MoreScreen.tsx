import { StyleSheet, View } from 'react-native';
import { Button, InfoBanner, ListRow } from '../../components/ui';
import type { WorkspacePage } from './workspace-context';
import { tokens } from '../../theme/tokens';

export function MoreScreen({ onNavigate, signOutError, signingOut, onSignOut, onOpenNotifications, onOpenAccount }: {
  onNavigate: (page: WorkspacePage) => void;
  signOutError: boolean;
  signingOut: boolean;
  onSignOut: () => void;
  onOpenNotifications: () => void;
  onOpenAccount: () => void;
}) {
  return <View style={styles.screen}>
    <ListRow category="training" title="Kunskap" detail="Publicerade guider och checklistor" onPress={() => onNavigate('knowledge')} />
    <ListRow category="veterinary" title="Tassla-pass" detail="En ärlig överblick, utan export" onPress={() => onNavigate('passport')} />
    <ListRow category="awake" title="Hundprofil" detail="Din hunds uppgifter" onPress={() => onNavigate('profile')} />
    <ListRow category="vaccination" title="Påminnelser" detail="Lokala val och enhetens tillstånd" onPress={onOpenNotifications} />
    <ListRow category="food" title="Konto och support" detail="Information och kontohantering" onPress={onOpenAccount} />
    {signOutError && <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" onPress={onSignOut} />}>Det gick inte att logga ut just nu.</InfoBanner>}
    <Button label={signingOut ? 'Loggar ut…' : 'Logga ut'} accessibilityLabel="Logga ut" variant="tertiary" disabled={signingOut} onPress={onSignOut} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { alignSelf: 'stretch', gap: tokens.spacing.sm },
});
