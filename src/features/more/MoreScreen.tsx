import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { SectionHeader } from '../../components/ui';
import { tokens } from '../../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Destination = 'health' | 'passport' | 'profile' | 'reminders' | 'account';
type Accent = (typeof tokens.colors.support)[Destination];

const destinationRows: readonly { id: Destination; icon: IconName; title: string; detail: string; color: Accent }[] = [
  { id: 'health', icon: 'heart-outline', title: 'Hälsa', detail: 'Vikt, hälsohistorik och planer', color: tokens.colors.support.health },
  { id: 'passport', icon: 'id-card-outline', title: 'Tassla-pass', detail: 'Hundens uppgifter som PDF', color: tokens.colors.support.passport },
  { id: 'profile', icon: 'paw-outline', title: 'Hundprofil', detail: 'Byt hund eller redigera uppgifter', color: tokens.colors.support.profile },
  { id: 'reminders', icon: 'notifications-outline', title: 'Påminnelser', detail: 'Dina valda påminnelser', color: tokens.colors.support.reminders },
  { id: 'account', icon: 'person-circle-outline', title: 'Konto och support', detail: 'Information och kontohantering', color: tokens.colors.support.account },
];

export function MoreScreen({ onNavigate, signOutError, signingOut, onSignOut }: {
  onNavigate: (destination: Destination) => void;
  signOutError: boolean;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return <View>
    <PageHeading title="Mer" description="Hantera din hund och appinställningar." />
    <SectionHeader title="Din hund" />
    <View style={styles.group}>
      {destinationRows.slice(0, 3).map((row, index) => <DestinationRow key={row.id} {...row} last={index === 2} onPress={() => onNavigate(row.id)} />)}
    </View>
    <SectionHeader title="App och konto" />
    <View style={styles.group}>
      {destinationRows.slice(3).map((row, index) => <DestinationRow key={row.id} {...row} last={index === 1} onPress={() => onNavigate(row.id)} />)}
    </View>
    <View style={styles.signOut}>
      {signOutError && <MessageCard tone="error">Det gick inte att logga ut just nu. Försök igen.</MessageCard>}
      <QuietButton title={signingOut ? 'Loggar ut…' : 'Logga ut'} disabled={signingOut} onPress={onSignOut} />
    </View>
  </View>;
}

function DestinationRow({ icon, title, detail, color, last, onPress }: {
  icon: IconName; title: string; detail: string; color: Accent; last: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`} onPress={onPress}
    style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}>
    <View style={[styles.iconBadge, { backgroundColor: color.bg }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name={icon} size={tokens.size.iconMd} color={color.fg} />
    </View>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
    <Ionicons name="chevron-forward" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
  </Pressable>;
}

const styles = StyleSheet.create({
  group: { overflow: 'hidden', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface },
  row: { minHeight: tokens.size.touchMin + tokens.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.layout.cardPadding, paddingVertical: tokens.spacing.sm },
  rowDivider: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  iconBadge: { width: tokens.size.chipLg, height: tokens.size.chipLg, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  copy: { flex: 1, minWidth: 0 },
  title: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  detail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  signOut: { marginTop: tokens.spacing.md },
  pressed: { backgroundColor: tokens.colors.selectedSurface },
});
