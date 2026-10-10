import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import type { Dog } from '../onboarding/dog';
import { formatDogAge, localDate } from '../onboarding/dog';

export function PreviewHomeScreen({
  dog,
  onEditProfile,
  onOpenLog,
  onOpenTraining,
  trainingShortcut,
}: {
  dog: Dog;
  onEditProfile: () => void;
  onOpenLog: () => void;
  onOpenTraining: () => void;
  trainingShortcut: { programTitle: string; stepTitle: string; stepNumber: number; completedCount: number; totalCount: number } | null;
}) {
  const age = formatDogAge(dog.birthDate, localDate());
  return (
    <View>
      <PageHeading title={`Hej, ${dog.name}!`} description="En lugn överblick för er vardag." />
      <View style={styles.dogCard}>
        <View style={styles.dogIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="paw" size={tokens.size.iconMd} color={tokens.colors.primary} />
        </View>
        <View style={styles.dogCopy}>
          <Text style={styles.dogName}>{dog.name}</Text>
          <Text style={styles.dogMeta}>{age}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle} accessibilityRole="header">Idag för {dog.name}</Text>
      <MessageCard>Inget publicerat innehåll visas i det lokala testläget.</MessageCard>
      <PrimaryButton title="Öppna Vardagslogg" onPress={onOpenLog} />
      <View style={styles.trainingShortcut}>
        <Text style={styles.shortcutEyebrow}>TRÄNING · LOKALT TESTLÄGE</Text>
        {trainingShortcut ? (
          <>
            <Text style={styles.shortcutTitle}>{trainingShortcut.programTitle}</Text>
            <Text style={styles.shortcutDetail}>Nästa: steg {trainingShortcut.stepNumber} · {trainingShortcut.stepTitle}</Text>
            <Text style={styles.shortcutProgress}>{trainingShortcut.completedCount} av {trainingShortcut.totalCount} steg registrerade</Text>
            <QuietButton title="Öppna nästa steg" onPress={onOpenTraining} />
          </>
        ) : (
          <>
            <Text style={styles.shortcutTitle}>Stegen är registrerade</Text>
            <Text style={styles.shortcutDetail}>Registrering bekräftar inte att hunden behärskar något. Du kan läsa programmen igen.</Text>
            <QuietButton title="Läs träningsprogram igen" onPress={onOpenTraining} />
          </>
        )}
      </View>
      <QuietButton title="Redigera hundprofil" onPress={onEditProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  dogCard: { minHeight: tokens.size.touchMin * 2, borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.xl },
  dogIcon: { width: tokens.size.chipLg, height: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.successSurface, marginRight: tokens.spacing.md },
  dogCopy: { flex: 1 },
  dogName: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  dogMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  sectionTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.md },
  trainingShortcut: { borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginTop: tokens.spacing.md },
  shortcutEyebrow: { ...tokens.typography.label, color: tokens.colors.primary },
  shortcutTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  shortcutDetail: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  shortcutProgress: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700', marginTop: tokens.spacing.sm },
});
