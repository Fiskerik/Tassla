import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { Button, Card, EmptyState, InfoBanner, SectionHeader, Skeleton } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { getSafeContentSourceUrl } from './source-links';
import { parseGuideBody } from './guide-body';

type ContentState = 'loading' | 'ready' | 'error';

export function KnowledgeScreen({
  onBack,
  items = [],
  contentState = 'ready',
  focusedContentId = null,
  onSelectContent = () => undefined,
  onRetry = () => undefined,
}: {
  onBack: () => void;
  items?: readonly HomeContent[];
  contentState?: ContentState;
  focusedContentId?: string | null;
  onSelectContent?: (id: string) => void;
  onRetry?: () => void;
}) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  const [sourceMessage, setSourceMessage] = useState('');
  const selectedItem = items.find((item) => item.id === focusedContentId) ?? items[0] ?? null;

  async function openSource(source: string) {
    const url = getSafeContentSourceUrl(source);
    if (!url) return;
    try {
      await Linking.openURL(url);
      setSourceMessage('Källan öppnades.');
    } catch {
      setSourceMessage('Källan kunde inte öppnas just nu. Du kan försöka igen.');
    }
  }

  return (
    <View>
      {contentState === 'loading' && <Skeleton shape="card" lines={3} />}
      {contentState === 'error' && <>
        <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" onPress={onRetry} />}>Guiderna kunde inte hämtas.</InfoBanner>
      </>}
      {contentState === 'ready' && items.length === 0 && <EmptyState title="Inga publicerade guider ännu" actionLabel="Försök igen" onAction={onRetry} />}
      {contentState === 'ready' && items.length > 0 && <>
        <View style={styles.guideList}>
          <SectionHeader title="Ämnen att utforska" />
          {items.map((item) => {
            const selected = selectedItem?.id === item.id;
            return <Card
              key={item.id}
              selected={selected}
              accessibilityLabel={`${item.title}, version ${item.version}`}
              onPress={() => { setSourceMessage(''); onSelectContent(item.id); }}>
              <View style={styles.guideCopy}>
                <Text style={styles.guideType}>{contentTypeLabel(item.contentType)}</Text>
                <Text style={styles.guideTitle}>{item.title}</Text>
              </View>
              {selected && <Text style={styles.selectedLabel}>Vald</Text>}
            </Card>;
          })}
        </View>
        {selectedItem && <Card accessibilityLabel={selectedItem.title}>
          <Text style={styles.articleTitle} accessibilityRole="header">{selectedItem.title}</Text>
          <View style={styles.articleBody}>
            {parseGuideBody(selectedItem.body).map((block, index) => {
              if (block.type === 'heading') return <Text
                key={`${selectedItem.id}:heading:${index}`}
                accessibilityRole="header"
                style={block.level === 2 ? styles.bodyHeading : styles.bodySubheading}
              >{block.text}</Text>;
              if (block.type === 'list') return <View key={`${selectedItem.id}:list:${index}`} style={styles.bodyList}>
                {block.items.map((item, itemIndex) => <Text key={`${selectedItem.id}:list:${index}:${itemIndex}`} style={styles.bodyListItem}>• {item}</Text>)}
              </View>;
              return <Text key={`${selectedItem.id}:paragraph:${index}`} style={styles.bodyParagraph}>{block.text}</Text>;
            })}
          </View>
          <Text style={styles.sourcesHeading} accessibilityRole="header">Källor</Text>
          {selectedItem.sources.length === 0 && <Text style={styles.sourceText}>Ingen källhänvisning är angiven för den här texten.</Text>}
          {selectedItem.sources.map((source, index) => {
            const safeUrl = getSafeContentSourceUrl(source);
            return <View key={`${selectedItem.id}:${index}`} style={styles.sourceRow}>
              {iconsLoaded && <Ionicons name={safeUrl ? 'link-outline' : 'document-text-outline'} size={tokens.size.iconSm} color={tokens.colors.primary} />}
              <View style={styles.sourceCopy}>
                <Text style={styles.sourceText}>{source}</Text>
                {safeUrl && <Button label="Öppna extern källa" accessibilityLabel="Öppna extern källa" variant="tertiary" onPress={() => { void openSource(source); }} />}
              </View>
            </View>;
          })}
          {sourceMessage !== '' && <Text style={styles.sourceMessage}>{sourceMessage}</Text>}
        </Card>}
      </>}
    </View>
  );
}

function contentTypeLabel(type: HomeContent['contentType']): string {
  return type === 'article' ? 'Kunskap' : type === 'guide' ? 'Guide' : type === 'checklist' ? 'Checklista' : 'Träning';
}

const styles = StyleSheet.create({
  guideList: { gap: tokens.spacing.sm },
  guideCopy: { flex: 1, gap: tokens.spacing.xs },
  guideType: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  selectedLabel: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  articleTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.md },
  articleBody: { marginTop: tokens.spacing.md },
  bodyHeading: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl },
  bodySubheading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.lg },
  bodyParagraph: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  bodyList: { marginTop: tokens.spacing.sm },
  bodyListItem: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  sourcesHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.sm },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingVertical: tokens.spacing.md },
  sourceCopy: { flex: 1, gap: tokens.spacing.xs },
  sourceText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  sourceMessage: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.md },
});
