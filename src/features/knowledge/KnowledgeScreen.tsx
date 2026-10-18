import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, IconChip, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { getGuidePreviewText, parseGuideBody } from './guide-body';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PuppyChecklistScreen } from './PuppyChecklistScreen';
import { checklistReadCacheScope } from './checklist-data';
import type { PendingChecklistMemory } from './checklist-intent';
import { FAQScreen } from './FAQScreen';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from './review-content';

type ContentState = 'loading' | 'ready' | 'error';

export function KnowledgeScreen({
  onBack,
  items = [],
  contentState = 'ready',
  focusedContentId = null,
  onSelectContent = () => undefined,
  onRetry = () => undefined,
  client,
  dogId = '',
  ageWeeks = 0,
  sessionKey = '',
  checklistPending = null,
  onChecklistPendingChange = () => undefined,
  onDetailChange,
}: {
  onBack: () => void;
  items?: readonly HomeContent[];
  contentState?: ContentState;
  focusedContentId?: string | null;
  onSelectContent?: (id: string | null) => void;
  onRetry?: () => void;
  client?: SupabaseClient;
  dogId?: string;
  ageWeeks?: number | null;
  sessionKey?: string;
  checklistPending?: PendingChecklistMemory | null;
  onChecklistPendingChange?: (state: PendingChecklistMemory | null) => void;
  onDetailChange?: (open: boolean) => void;
}) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  const [sourceMessage, setSourceMessage] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(focusedContentId);
  const [tab, setTab] = useState(() => focusedContentId === CHECKLIST_DESTINATION_ID ? 'Checklistor' : focusedContentId === FAQ_DESTINATION_ID ? 'FAQ' : 'För dig');
  const [checklistDetailOpen, setChecklistDetailOpen] = useState(false);
  const checklistInvalidate = useRef<(() => void) | null>(null);
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const detailOpen = Boolean(selectedItem) || (tab === 'Checklistor' && checklistDetailOpen);
  const visibleItems = items.filter((item) => tab === 'För dig' || (tab === 'Artiklar' && item.contentType !== 'checklist' && item.contentType !== 'training_program'));
  useEffect(() => { onDetailChange?.(detailOpen); }, [detailOpen, onDetailChange]);
  useEffect(() => () => { onDetailChange?.(false); }, [onDetailChange]);
  function openArticle(id: string) { setOpenedId(id); setSourceMessage(''); onSelectContent(id); }
  function changeTab(nextTab: string) {
    if (tab === 'Checklistor' && nextTab !== 'Checklistor') { checklistInvalidate.current?.(); checklistInvalidate.current = null; }
    setTab(nextTab);
  }

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

  const reviewEnabled = process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true';
  const checklistScope = checklistReadCacheScope(sessionKey, dogId, reviewEnabled);
  return (
    <View style={styles.screen}>
      {selectedItem ? <AppBar mode="Back" title="Kunskap" actionLabel="Tillbaka till guider" onAction={() => { setOpenedId(null); onSelectContent(null); }} /> : null}
      {!selectedItem && !(tab === 'Checklistor' && checklistDetailOpen) ? <>
        <Text accessibilityRole="header" style={styles.pageTitle}>Kunskap</Text>
        <Tabs items={["För dig", "Artiklar", "Checklistor", "FAQ"]} active={tab} onChange={changeTab} variant="rev02-segmented" />
      </> : null}
      {reviewEnabled ? <Text style={styles.reviewNotice}>Tillfälligt exempel – innehållet är inte sakgranskat.</Text> : null}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'loading' && <Skeleton shape="card" lines={4} />}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {(tab === 'För dig' || tab === 'Artiklar') && contentState === 'ready' && visibleItems.length === 0 && <MessageCard>
        Här kommer guider för din hund. Titta gärna in igen.
      </MessageCard>}
      {tab === 'FAQ' && !selectedItem ? <FAQScreen context="by_age" reviewEnabled={process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true'} /> : null}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'ready' && items.length > 0 && <>
        {!selectedItem && <View style={styles.guideList}>
          {visibleItems.length === 0 ? <Text style={styles.sourceText}>Inga artiklar publicerade ännu.</Text> : null}
          {visibleItems[0] ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Läs ${visibleItems[0].title}`} onPress={() => openArticle(visibleItems[0].id)} style={styles.featured}>
            <Image source={require('../../../assets/images/puppy-resting-carousel.png')} style={styles.featuredImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.cardCopy}><Text style={styles.featuredEyebrow}>REKOMMENDERAT FÖR ER</Text><Text style={styles.guideTitle}>{visibleItems[0].title}</Text><Text style={styles.sourceText} numberOfLines={2}>{getGuidePreviewText(visibleItems[0].body)}</Text><Text style={styles.readTime}>{readingMinutes(visibleItems[0].body)} min läsning</Text></View>
          </MotionPressable> : null}
          <View style={styles.articleGrid}>{visibleItems.slice(1).map((item, index) => <MotionPressable key={item.id} accessibilityRole="button" accessibilityLabel={`Läs ${item.title}`} onPress={() => openArticle(item.id)} style={styles.smallCard}>
            <Image source={index % 2 ? require('../../../assets/images/dog-resting.png') : require('../../../assets/images/dog-welcome.png')} style={styles.smallImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.smallCardCopy}><Text style={styles.smallGuideTitle}>{item.title}</Text><Text style={styles.readTime}>{readingMinutes(item.body)} min läsning</Text></View>
          </MotionPressable>)}</View>
        </View>}
        {selectedItem && <View style={styles.articleCard}>
          <Text style={styles.articleTitle} accessibilityRole="header">{selectedItem.title}</Text>
          {selectedItem.isAiGenerated ? <Text style={styles.aiOriginLabel}>AI-genererat innehåll</Text> : null}
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
        </View>}
      </>}
      {tab === 'För dig' && !selectedItem ? <View style={styles.shortcuts}>
        <SectionHeader title="Fler i Kunskap" />
        <View style={styles.categoryLinks}>
          <Card onPress={() => changeTab('Checklistor')} accessibilityLabel="Öppna Checklistor">
            <View style={styles.categoryLink}><IconChip category="training" /><View style={styles.categoryCopy}><Text style={styles.guideTitle}>Checklistor</Text><Text style={styles.sourceText}>För valpens olika faser</Text></View></View>
          </Card>
          <Card onPress={() => changeTab('FAQ')} accessibilityLabel="Öppna Vanliga frågor">
            <View style={styles.categoryLink}><IconChip category="sleep" /><View style={styles.categoryCopy}><Text style={styles.guideTitle}>Vanliga frågor</Text><Text style={styles.sourceText}>Svar efter var ni är just nu</Text></View></View>
          </Card>
        </View>
      </View> : null}
      {client && dogId ? <View style={{ display: tab === 'Checklistor' ? 'flex' : 'none' }}>
        <PuppyChecklistScreen key={`${sessionKey}:${dogId}`} cacheScope={checklistScope} client={client} dogId={dogId} ageWeeks={ageWeeks} active={tab === 'Checklistor'} pendingState={checklistPending} onPendingStateChange={onChecklistPendingChange} onDetailChange={setChecklistDetailOpen} onBack={() => changeTab('För dig')} registerInvalidate={(invalidate) => { checklistInvalidate.current = invalidate; }} />
      </View> : null}
    </View>
  );
}

function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 200)); }

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  pageTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  reviewNotice: { ...tokens.typography.caption, color: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface, borderRadius: tokens.radius.md, padding: tokens.spacing.sm },
  shortcuts: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  categoryLinks: { gap: tokens.spacing.sm },
  categoryLink: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  categoryCopy: { flex: 1, minWidth: 0, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.xs },
  featured: { backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  featuredImage: { width: '100%', height: tokens.size.heroHeight },
  cardCopy: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  smallCardCopy: { padding: tokens.spacing.sm, gap: tokens.spacing.xs },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  featuredEyebrow: { ...tokens.typography.caption, color: tokens.colors.destination.knowledge.icon, fontWeight: '700', letterSpacing: 0.4 },
  articleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  smallCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  smallImage: { width: '100%', height: tokens.size.trainingImage * 1.5 },
  guideList: { gap: tokens.spacing.sm },
  guideTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  smallGuideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  articleCard: { alignSelf: 'stretch', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding },
  articleTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  aiOriginLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
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
