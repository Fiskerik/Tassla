import { useLayoutEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, IconChip, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { getGuidePreviewText, parseGuideBody } from './guide-body';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PuppyChecklistScreen } from './PuppyChecklistScreen';
import type { PendingChecklistMemory } from './checklist-intent';
import { FAQScreen } from './FAQScreen';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from './review-content';

type ContentState = 'loading' | 'ready' | 'error';

export function KnowledgeScreen({
  onBack,
  items = [],
  contentState = 'ready',
  focusedContentId = null,
  focusedContentOrigin = null,
  focusScopeKey = '',
  onSelectContent = () => undefined,
  onRetry = () => undefined,
  client,
  dogId = '',
  ageWeeks = 0,
  sessionKey = '',
  checklistPending = null,
  onChecklistPendingChange = () => undefined,
}: {
  onBack: () => void;
  items?: readonly HomeContent[];
  contentState?: ContentState;
  focusedContentId?: string | null;
  focusedContentOrigin?: 'home-carousel' | 'knowledge-list' | null;
  focusScopeKey?: string;
  onSelectContent?: (id: string, origin: 'knowledge-list') => void;
  onRetry?: () => void;
  client?: SupabaseClient;
  dogId?: string;
  ageWeeks?: number;
  sessionKey?: string;
  checklistPending?: PendingChecklistMemory | null;
  onChecklistPendingChange?: (state: PendingChecklistMemory | null) => void;
}) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  const [sourceMessage, setSourceMessage] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(focusedContentId);
  const [articleOrigin, setArticleOrigin] = useState<'home-carousel' | 'knowledge-list' | null>(focusedContentOrigin);
  const lastFocusScope = useRef(focusScopeKey);
  const [tab, setTab] = useState(() => focusedContentId === CHECKLIST_DESTINATION_ID ? 'Checklistor' : focusedContentId === FAQ_DESTINATION_ID ? 'FAQ' : 'För dig');
  const [checklistDetailOpen, setChecklistDetailOpen] = useState(false);
  const checklistInvalidate = useRef<(() => void) | null>(null);
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const visibleItems = items.filter((item) => tab === 'För dig' || (tab === 'Artiklar' && item.contentType !== 'checklist' && item.contentType !== 'training_program'));
  useLayoutEffect(() => {
    if (lastFocusScope.current !== focusScopeKey || focusedContentId === null) {
      lastFocusScope.current = focusScopeKey;
      setOpenedId(focusedContentId);
      setArticleOrigin(focusedContentOrigin);
    }
  }, [focusScopeKey, focusedContentId, focusedContentOrigin]);

  function openArticle(id: string) { setOpenedId(id); setArticleOrigin('knowledge-list'); setSourceMessage(''); onSelectContent(id, 'knowledge-list'); }
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

  return (
    <View>
      {!(tab === 'Checklistor' && checklistDetailOpen) ? <AppBar mode="Back" title={selectedItem ? 'Läsning' : 'Kunskap'} actionLabel={selectedItem ? articleOrigin === 'home-carousel' ? 'Tillbaka' : 'Tillbaka till guider' : 'Tillbaka'} onAction={selectedItem ? articleOrigin === 'home-carousel' ? onBack : () => { setOpenedId(null); setArticleOrigin(null); } : () => { checklistInvalidate.current?.(); onBack(); }} /> : null}
      {!selectedItem && !(tab === 'Checklistor' && checklistDetailOpen) && <Tabs items={["För dig", "Artiklar", "Checklistor", "FAQ"]} active={tab} onChange={changeTab} />}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'loading' && <Skeleton shape="card" lines={4} />}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {(tab === 'För dig' || tab === 'Artiklar') && contentState === 'ready' && visibleItems.length === 0 && <MessageCard>
        Här kommer guider för din hund. Titta gärna in igen.
      </MessageCard>}
      {tab === 'För dig' && !selectedItem ? <View style={styles.categoryLinks}>
        <Card onPress={() => changeTab('Checklistor')} accessibilityLabel="Öppna Checklistor">
          <View style={styles.categoryLink}><IconChip category="training" /><View style={styles.categoryCopy}><Text style={styles.guideTitle}>Checklistor</Text><Text style={styles.sourceText}>Gröna listor för valpens olika faser</Text></View></View>
        </Card>
        <Card onPress={() => changeTab('FAQ')} accessibilityLabel="Öppna Vanliga frågor">
          <View style={styles.categoryLink}><IconChip category="sleep" /><View style={styles.categoryCopy}><Text style={styles.guideTitle}>Vanliga frågor</Text><Text style={styles.sourceText}>Svar efter var ni är just nu</Text></View></View>
        </Card>
      </View> : null}
      {tab === 'FAQ' && !selectedItem ? <FAQScreen context="by_age" reviewEnabled={process.env.EXPO_PUBLIC_TASSLA_REVIEW_CONTENT === 'true'} /> : null}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'ready' && items.length > 0 && <>
        {!selectedItem && <View style={styles.guideList}>
          {visibleItems.length === 0 ? <Text style={styles.sourceText}>Inga checklistor här ännu.</Text> : null}
          {visibleItems[0] ? <MotionPressable accessibilityRole="button" accessibilityLabel={`Läs ${visibleItems[0].title}`} onPress={() => openArticle(visibleItems[0].id)} style={styles.featured}>
            <Image source={require('../../../assets/images/dog-resting.png')} style={styles.featuredImage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.cardCopy}><Text style={styles.guideTitle}>{visibleItems[0].title}</Text><Text style={styles.sourceText} numberOfLines={2}>{getGuidePreviewText(visibleItems[0].body)}</Text><Text style={styles.readTime}>{readingMinutes(visibleItems[0].body)} min läsning</Text></View>
          </MotionPressable> : null}
          <View style={styles.articleGrid}>{visibleItems.slice(1).map((item, index) => <MotionPressable key={item.id} accessibilityRole="button" accessibilityLabel={`Läs ${item.title}`} onPress={() => openArticle(item.id)} style={styles.smallCard}>
            <Image source={index % 2 ? require('../../../assets/images/dog-resting.png') : require('../../../assets/images/dog-welcome.png')} style={styles.smallImage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.cardCopy}><Text style={styles.smallGuideTitle}>{item.title}</Text><Text style={styles.readTime}>{readingMinutes(item.body)} min läsning</Text></View>
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
        </View>}
      </>}
      {client && dogId ? <View style={{ display: tab === 'Checklistor' ? 'flex' : 'none' }}>
        <PuppyChecklistScreen key={`${sessionKey}:${dogId}`} client={client} dogId={dogId} ageWeeks={ageWeeks ?? 0} active={tab === 'Checklistor'} pendingState={checklistPending} onPendingStateChange={onChecklistPendingChange} onDetailChange={setChecklistDetailOpen} onBack={() => changeTab('För dig')} registerInvalidate={(invalidate) => { checklistInvalidate.current = invalidate; }} />
      </View> : null}
    </View>
  );
}

function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 200)); }

const styles = StyleSheet.create({
  categoryLinks: { gap: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  categoryLink: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  categoryCopy: { flex: 1, minWidth: 0, padding: tokens.spacing.md, gap: tokens.spacing.sm },
  featured: { backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, overflow: 'hidden' },
  featuredImage: { width: '100%', height: tokens.size.heroHeight },
  cardCopy: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  articleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  smallCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, overflow: 'hidden' },
  smallImage: { width: '100%', height: tokens.size.quickLogHeight },
  guideList: { gap: tokens.spacing.sm },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  smallGuideTitle: { ...tokens.typography.caption, fontWeight: '700', color: tokens.colors.textPrimary },
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
