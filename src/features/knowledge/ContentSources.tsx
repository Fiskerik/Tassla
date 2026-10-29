import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HorizontalGestureRegion } from '../../components/ui/MainSwipeNavigation';
import { tokens } from '../../theme/tokens';
import { getContentSourceLabel, getContentSourceMetadata, getSafeContentSourceUrl } from './source-links';

export function ContentSources({ sources, onOpenSource, testID = 'content-sources' }: {
  sources: readonly string[];
  onOpenSource: (source: string) => void;
  testID?: string;
}) {
  if (sources.length === 0) return null;
  return <View testID={testID}><HorizontalGestureRegion>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.links}>
      {sources.map((source, index) => {
        const url = getSafeContentSourceUrl(source);
        if (!url) return <Text key={`${index}:${source}`} style={styles.fallback}>{source}</Text>;
        const label = getContentSourceLabel(source);
        const metadata = getContentSourceMetadata(source);
        const title = metadata ? `${metadata.title} · ${metadata.publisher}` : new URL(url).hostname;
        return <Pressable key={`${index}:${source}`} accessibilityRole="link"
          accessibilityLabel={`Öppna källa: ${title}`} accessibilityHint="Öppnar källan i webbläsaren."
          onPress={() => onOpenSource(url)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Ionicons name="open-outline" size={tokens.size.iconSm} color={tokens.colors.primary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <Text style={styles.title}>{label}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </HorizontalGestureRegion></View>;
}

const styles = StyleSheet.create({
  links: { alignItems: 'center', gap: tokens.spacing.md },
  link: { minHeight: tokens.size.touchMin, minWidth: tokens.size.touchMin, maxWidth: tokens.size.sourceLinkMaxWidth, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs },
  title: { ...tokens.typography.smallCaption, color: tokens.colors.primary, textDecorationLine: 'underline', flexShrink: 1 },
  fallback: { ...tokens.typography.smallCaption, color: tokens.colors.textSecondary, maxWidth: tokens.size.sourceLinkMaxWidth },
  pressed: { opacity: 0.7 },
});
