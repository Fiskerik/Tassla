import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

const ICONS: Readonly<Record<string, string>> = {
  'before_homecoming': 'home-outline', 'first_days': 'bed-outline', 'by_age': 'calendar-outline',
  'review-v1:faq:first-night': 'moon-outline', 'review-v1:faq:alone-time': 'hourglass-outline',
  'review-v1:faq:child-contact': 'people-outline', 'review-v1:faq:course': 'school-outline',
  '8_12_weeks': 'paw-outline', '3_6_months': 'footsteps-outline', '6_12_months': 'trending-up-outline',
  'over_1_year': 'infinite-outline',
  'review-v1:destination:checklists': 'list-outline', 'review-v1:destination:faq': 'help-circle-outline',
  'safe-space': 'home-outline', supplies: 'bag-handle-outline', 'vet-contact': 'medkit-outline',
  'quiet-start': 'moon-outline', routine: 'time-outline', rest: 'bed-outline', name: 'text-outline',
  handling: 'hand-left-outline', alone: 'hourglass-outline', recall: 'megaphone-outline',
  settle: 'moon-outline', walks: 'footsteps-outline', review: 'refresh-outline', focus: 'eye-outline',
  breaks: 'pause-outline', enjoy: 'heart-outline', adapt: 'options-outline',
};

export function KnowledgeIconBadge({ id }: { id: string }) {
  const icon = ICONS[id];
  if (!icon) return null;
  return <View style={styles.badge} accessible={false}>
    <Ionicons name={icon as never} size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} />
  </View>;
}

const styles = StyleSheet.create({
  badge: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.destination.knowledge.surface },
});
