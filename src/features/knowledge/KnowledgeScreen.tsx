import { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Button, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { getGuidePreviewText, parseGuideBody } from './guide-body';

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
  const [openedId, setOpenedId] = useState<string | null>(focusedContentId);
  const [tab, setTab] = useState('För dig');
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const visibleItems = items.filter((item) => tab === 'För dig' || (tab === 'Checklistor' ? item.contentType === 'checklist' : item.contentType !== 'checklist'));
  function openArticle(id: string) { setOpenedId(id); setSourceMessage(''); onSelectContent(id); }

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
      <AppBar mode="Back" title={selectedItem ? "Läsning" : "Kunskap"} onAction={selectedItem ? () => setOpenedId(null) : onBack} />
      {!selectedItem && <Tabs items={["För dig", "Artiklar", "Checklistor"]} active={tab} onChange={setTab} />}
      {contentState === 'loading' && <Skeleton shape="card" lines={4} />}
      {contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {contentState === 'ready' && items.length === 0 && <MessageCard>
        Här kommer guider för din hund. Titta gärna in igen.
      </MessageCard>}
      {contentState === 'ready' && items.length > 0 && <>
        {!selectedItem && <View style={styles.guideList}>
          {visibleItems.length === 0 ? <Text style={styles.sourceText}>Inga checklistor här ännu.</Text> : null}
          {visibleItems[0] ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Läs ${visibleItems[0].title}`} onPress={() => openArticle(visibleItems[0].id)} style={styles.featured}>
            <Image source={require('../../../assets/images/dog-resting.png')} style={styles.featuredImage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.cardCopy}><Text style={styles.guideTitle}>{visibleItems[0].title}</Text><Text style={styles.sourceText} numberOfLines={2}>{getGuidePreviewText(visibleItems[0].body)}</Text><Text style={styles.readTime}>{readingMinutes(visibleItems[0].body)} min läsning</Text></View>
          </MotionPressable> : null}
          <View style={styles.articleGrid}>{visibleItems.slice(1).map((item, index) => <MotionPressable key={item.id} accessibilityRole="button" accessibilityLabel={`Läs ${item.title}`} onPress={() => openArticle(item.id)} style={styles.smallCard}>
            <Image source={index % 2 ? require('../../../assets/images/dog-resting.png') : require('../../../assets/images/dog-welcome.png')} style={styles.smallImage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.cardCopy}><Text style={styles.guideTitle}>{item.title}</Text><Text style={styles.readTime}>{readingMinutes(item.body)} min läsning</Text></View>
          </MotionPressable>)}</View>
        </View>}
        {selectedItem && <View style={styles.articleCard}>
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
                {safeUrl && <QuietButton title="Öppna extern källa" onPress={() => { void openSource(source); }} />}
              </View>
            </View>;
          })}
          {sourceMessage !== '' && <MessageCard>{sourceMessage}</MessageCard>}
          <Button variant="tertiary" label="Tillbaka till guider" accessibilityLabel="Tillbaka till guider" onPress={() => setOpenedId(null)} />
        </View>}
      </>}
    </View>
  );
}

function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 200)); }

const styles = StyleSheet.create({
  featured: { backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, overflow: 'hidden' },
  featuredImage: { width: '100%', height: tokens.size.heroHeight },
  cardCopy: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  articleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  smallCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, overflow: 'hidden' },
  smallImage: { width: '100%', height: tokens.size.quickLogHeight },
  guideList: { gap: tokens.spacing.sm },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  articleCard: { alignSelf: 'stretch', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginTop: tokens.spacing.sm },
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
});
