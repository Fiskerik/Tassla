import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MessageCard } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import type { OwnedDog } from '../../data/app-data';
import { formatDogAge, localDate } from './dog';
import { DOG_BROAD_PHASE_LABELS, resolveDogLife } from './life-stages';
import { ProfileScreenHeader } from './ProfileScreenHeader';

export function DogProfileScreen({ dog, breed, onBack }: { dog: OwnedDog; breed?: string; onBack: () => void }) {
  const life = resolveDogLife(dog.birth_date, localDate(), { seniorConfirmed: dog.senior_confirmed, endOfLife: dog.end_of_life });
  return <View>
    <ProfileScreenHeader onBack={onBack} />
    <View style={styles.introCard}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="paw-outline" size={tokens.size.iconMd} color={tokens.colors.support.profile.fg} />
      </View>
      <Text style={styles.intro}>Uppgifterna används för att välja ålders- och rasrelevant innehåll.</Text>
    </View>
    <View style={styles.profileCard}>
      <Text style={styles.cardTitle} accessibilityRole="header">Hundens uppgifter</Text>
      <ProfileFact label="Hundens namn" value={dog.name} icon="heart-outline" />
      <ProfileFact label="Ras" value={breed || dog.breed_id} icon="paw-outline" />
      <ProfileFact label="Ålder" value={formatDogAge(dog.birth_date, localDate(), dog.age_display_unit)} icon="hourglass-outline" />
      <ProfileFact label="Åldersperiod" value={life.period.title} icon="hourglass-outline" />
      <ProfileFact label="Livsfas" value={DOG_BROAD_PHASE_LABELS[life.broadPhase]} icon="paw-outline" />
      <ProfileFact label="Födelsedatum" value={dog.birth_date} icon="calendar-outline" last />
    </View>
    <MessageCard>Profiländring är inte tillgänglig här ännu. Hundens uppgifter har hämtats från ditt konto.</MessageCard>
  </View>;
}

function ProfileFact({ label, value, icon, last = false }: { label: string; value: string; icon: 'heart-outline' | 'paw-outline' | 'calendar-outline' | 'hourglass-outline'; last?: boolean }) {
  return <View style={[styles.fact, !last && styles.factBorder]}>
    <View style={styles.factIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ionicons name={icon} size={tokens.size.iconSm} color={tokens.colors.support.profile.fg} />
    </View>
    <View style={styles.factCopy}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  introCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.support.profile.bg, marginBottom: tokens.spacing.md },
  icon: { width: tokens.size.chipLg, minHeight: tokens.size.chipLg, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.surface },
  intro: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1 },
  profileCard: { padding: tokens.layout.cardPadding, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, borderWidth: tokens.size.stroke, marginBottom: tokens.spacing.md },
  cardTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginBottom: tokens.spacing.sm },
  fact: { minHeight: tokens.size.touchMin + tokens.spacing.md, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingVertical: tokens.spacing.sm },
  factBorder: { borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  factIcon: { width: tokens.size.chipMd, minHeight: tokens.size.chipMd, borderRadius: tokens.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.support.profile.bg },
  factCopy: { flex: 1 },
  factLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  factValue: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xs },
});
