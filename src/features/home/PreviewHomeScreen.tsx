import { StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import type { Dog } from '../onboarding/dog';
import { ageInWeeks, localDate } from '../onboarding/dog';

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
  const age = ageInWeeks(dog.birthDate, localDate());
  return (
    <View>
      <PageHeading title={`Hej, ${dog.name}!`} description="En lugn överblick för er vardag." />
      <View style={styles.dogCard}>
        <View style={styles.dogIcon}><Text style={styles.dogIconText}>✦</Text></View>
        <View style={styles.dogCopy}>
          <Text style={styles.dogName}>{dog.name}</Text>
          <Text style={styles.dogMeta}>Syntetisk profil · {age} {age === 1 ? 'vecka gammal' : 'veckor gammal'}</Text>
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
  dogCard: { minHeight: 110, borderRadius: theme.radius.card, backgroundColor: theme.colors.accent, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 30 },
  dogIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B805F' },
  dogIconText: { color: '#FFF0D2', fontSize: 29, lineHeight: 34, fontWeight: '700' },
  dogCopy: { flex: 1 },
  dogName: { color: theme.colors.onAccent, fontSize: 20, fontWeight: '800' },
  dogMeta: { color: '#DDECE2', fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: theme.colors.text, fontSize: 21, fontWeight: '800' },
  trainingShortcut: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, marginTop: 14 },
  shortcutEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  shortcutTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 8 },
  shortcutDetail: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 },
  shortcutProgress: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', marginTop: 8 },
});
