import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, IconChip, SectionHeader, Skeleton } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { getGuidePreviewText, parseGuideBody } from './guide-body';
import { guideSearchScopeKey, guideSearchValueForScope, normalizeGuideSearchText, searchGuideItems, type ScopedGuideSearchState } from './guide-search';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PuppyChecklistScreen } from './PuppyChecklistScreen';
import { checklistReadCacheScope } from './checklist-data';
import type { PendingChecklistMemory } from './checklist-intent';
import { FAQScreen } from './FAQScreen';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from './review-content';
import { knowledgeImageForGuide } from './editorial-image-assignment';

type ContentState = 'loading' | 'ready' | 'error';
type KnowledgeTab = 'För dig' | 'Checklistor' | 'FAQ';
type ScopedGuideViewState = ScopedGuideSearchState & { showAll: boolean };

export function KnowledgeScreen({
  onBack,
  items = [],
  contentState = 'ready',
  focusedContentId = null,
  onSelectContent = () => undefined,
  onRetry = () => undefined,
  client,
  dogId = '',
  dogName = '',
  ageWeeks = 0,
  sessionKey = '',
  checklistPending = null,
  onChecklistPendingChange = () => undefined,
  onDetailChange,
  returnToTraining = false,
  returnToDevelopment = false,
}: {
  onBack: () => void;
  returnToTraining?: boolean;
  returnToDevelopment?: boolean;
  items?: readonly HomeContent[];
  contentState?: ContentState;
  focusedContentId?: string | null;
  onSelectContent?: (id: string | null) => void;
  onRetry?: () => void;
  client?: SupabaseClient;
  dogId?: string;
  dogName?: string;
  ageWeeks?: number | null;
  sessionKey?: string;
  checklistPending?: PendingChecklistMemory | null;
  onChecklistPendingChange?: (state: PendingChecklistMemory | null) => void;
  onDetailChange?: (open: boolean) => void;
}) {
  const [iconsLoaded] = useFonts(Ionicons.font);
  const [sourceMessage, setSourceMessage] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(focusedContentId);
  const [tab, setTab] = useState<KnowledgeTab>(() => focusedContentId === CHECKLIST_DESTINATION_ID ? 'Checklistor' : focusedContentId === FAQ_DESTINATION_ID ? 'FAQ' : 'För dig');
  const [checklistDetailOpen, setChecklistDetailOpen] = useState(false);
  const searchScopeKey = guideSearchScopeKey(sessionKey, dogId);
  const [guideViewState, setGuideViewState] = useState<ScopedGuideViewState>(() => ({ scopeKey: searchScopeKey, value: '', showAll: false }));
  const searchQuery = guideSearchValueForScope(guideViewState, searchScopeKey);
  const hasSearchQuery = normalizeGuideSearchText(searchQuery) !== '';
  const showAllGuides = guideViewState.scopeKey === searchScopeKey && guideViewState.showAll;
  const dogLabel = dogName.trim() || 'vald hund';
  if (guideViewState.scopeKey !== searchScopeKey) {
    setGuideViewState({ scopeKey: searchScopeKey, value: '', showAll: false });
  }

  const checklistInvalidate = useRef<(() => void) | null>(null);
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const visibleItems = items
    .filter((item) => item.contentType === 'article' || item.contentType === 'guide')
    .sort(compareGuideTitle);
  const displayedItems = searchGuideItems(visibleItems, searchQuery);
  const cardItems = hasSearchQuery || showAllGuides ? displayedItems : displayedItems.slice(0, 3);
  const hasMoreGuides = !hasSearchQuery && !showAllGuides && visibleItems.length > 3;
  const detailOpen = Boolean(selectedItem) || (tab === 'Checklistor' && checklistDetailOpen);
  useEffect(() => { onDetailChange?.(detailOpen); }, [detailOpen, onDetailChange]);
  useEffect(() => () => { onDetailChange?.(false); }, [onDetailChange]);

  function openArticle(id: string) { setOpenedId(id); setSourceMessage(''); onSelectContent(id); }
  function clearSearch() { setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, value: '' })); }
  function changeTab(nextTab: KnowledgeTab) {
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
  const showGuideScreen = tab === 'För dig' || Boolean(selectedItem);

  function renderGuideCard(item: HomeContent, featured: boolean) {
    const image = knowledgeImageForGuide(item);
    return <MotionPressable
      key={item.id}
      accessibilityRole="button"
      accessibilityLabel={`Läs ${item.title}`}
      onPress={() => openArticle(item.id)}
      style={featured ? styles.featured : styles.smallCard}
    >
      {image ? <Image source={image} style={featured ? styles.featuredImage : styles.smallImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
      <View style={featured ? styles.cardCopy : styles.smallCardCopy}>
        <Text style={featured ? styles.guideTitle : styles.smallGuideTitle} numberOfLines={featured ? undefined : 3}>{item.title}</Text>
        {featured ? <Text style={styles.sourceText} numberOfLines={2}>{getGuidePreviewText(item.body)}</Text> : null}
        <Text style={styles.readTime}>{readingMinutes(item.body)} min läsning</Text>
      </View>
    </MotionPressable>;
  }

  return (
    <View style={styles.screen}>
      {selectedItem ? <AppBar mode="Back" title="Kunskap"
        actionLabel={returnToDevelopment ? 'Tillbaka till Utveckling' : 'Tillbaka till guider'}
        onAction={() => { setOpenedId(null); onSelectContent(null); if (returnToDevelopment) onBack(); }} /> : null}
      {!selectedItem && tab === 'För dig'
        ? returnToTraining
          ? <AppBar mode="Back" title="Kunskap" actionLabel="Tillbaka till Träning" onAction={onBack} />
          : <Text accessibilityRole="header" style={styles.pageTitle}>Kunskap</Text>
        : null}
      {!selectedItem && tab === 'FAQ' ? <AppBar mode="Back" title="Kunskap" actionLabel="Tillbaka till guider" onAction={() => changeTab('För dig')} /> : null}
      {!selectedItem && tab === 'Checklistor' && !checklistDetailOpen ? <AppBar mode="Back" title="Kunskap" actionLabel="Tillbaka till guider" onAction={() => changeTab('För dig')} /> : null}

      {tab === 'För dig' && !selectedItem ? <View style={styles.searchSection}>
        <View style={styles.searchField}>
          {iconsLoaded ? <Ionicons name="search-outline" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
          <TextInput
            accessibilityLabel={`Sök i guider för ${dogLabel}`}
            accessibilityHint={`Sök bland guider för ${dogLabel}.`}
            value={searchQuery}
            onChangeText={(value) => setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, value }))}
            placeholder="Sök i guider"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery !== '' ? <MotionPressable accessibilityRole="button" accessibilityLabel="Rensa sökning" onPress={clearSearch} style={styles.clearSearch}>
            {iconsLoaded ? <Ionicons name="close-circle" size={tokens.size.iconMd} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : <Text style={styles.clearSearchText}>Rensa</Text>}
          </MotionPressable> : null}
        </View>
        <Text style={styles.searchHelp}>Sök bland guider för {dogLabel}.</Text>
      </View> : null}

      {reviewEnabled && showGuideScreen ? <Text style={styles.reviewNotice}>Tillfälligt exempel – innehållet är inte sakgranskat.</Text> : null}
      {showGuideScreen && contentState === 'loading' && <Skeleton shape="card" lines={4} />}
      {showGuideScreen && contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {tab === 'För dig' && !selectedItem && contentState === 'ready' && visibleItems.length === 0 && <MessageCard>
        Inga guider är publicerade för {dogLabel} ännu.
      </MessageCard>}
      {tab === 'För dig' && !selectedItem && contentState === 'ready' && visibleItems.length > 0 && hasSearchQuery && displayedItems.length === 0
        ? <View style={styles.searchEmpty}>
          <MessageCard>{`Inga guider matchar "${searchQuery.trim()}" för ${dogLabel}.`}</MessageCard>
          <QuietButton title="Rensa sökning" onPress={clearSearch} />
        </View>
        : null}
      {tab === 'För dig' && !selectedItem && contentState === 'ready' && hasSearchQuery && displayedItems.length > 0
        ? <Text style={styles.searchCount} accessibilityLiveRegion="polite">{displayedItems.length === 1 ? '1 träff' : `${displayedItems.length} träffar`}</Text>
        : null}
      {tab === 'FAQ' && !selectedItem ? <FAQScreen context="by_age" reviewEnabled={reviewEnabled} /> : null}

      {showGuideScreen && !selectedItem && contentState === 'ready' && visibleItems.length > 0 && displayedItems.length > 0 ? <View style={styles.guideList}>
        {cardItems[0] ? renderGuideCard(cardItems[0], true) : null}
        {cardItems.length > 1 ? <View style={styles.articleGrid}>{cardItems.slice(1).map((item) => renderGuideCard(item, false))}</View> : null}
        {hasMoreGuides ? <QuietButton title="Visa alla" onPress={() => setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, showAll: true }))} /> : null}
      </View> : null}

      {selectedItem && contentState === 'ready' ? <View style={styles.articleCard}>
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
      </View> : null}

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

function compareGuideTitle(left: HomeContent, right: HomeContent) {
  return left.title.localeCompare(right.title, 'sv-SE') || left.id.localeCompare(right.id);
}

function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 200)); }

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  searchSection: { gap: tokens.spacing.xs },
  searchField: { minHeight: tokens.size.buttonHeight, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingHorizontal: tokens.spacing.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.home.card },
  searchInput: { flex: 1, minWidth: 0, minHeight: tokens.size.touchMin, ...tokens.typography.body, color: tokens.colors.textPrimary, paddingVertical: 0 },
  clearSearch: { width: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  searchHelp: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  searchEmpty: { gap: tokens.spacing.xs },
  searchCount: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  pageTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  reviewNotice: { ...tokens.typography.caption, color: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface, borderRadius: tokens.radius.md, padding: tokens.spacing.sm },
  shortcuts: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  categoryLinks: { gap: tokens.spacing.sm },
  categoryLink: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  categoryCopy: { flex: 1, minWidth: 0, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.xs },
  featured: { backgroundColor: tokens.colors.home.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  featuredImage: { width: '100%', height: 176 },
  cardCopy: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  smallCardCopy: { flex: 1, padding: tokens.spacing.sm, gap: tokens.spacing.xs },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  articleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  smallCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: tokens.colors.home.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  smallImage: { width: '100%', height: 72 },
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
