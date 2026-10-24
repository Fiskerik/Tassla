import { personalizeArticle, type DogSex } from '../../content/article-targeting';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, SectionHeader, Skeleton } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { parseGuideBody } from './guide-body';
import { guideSearchScopeKey, guideSearchValueForScope, normalizeGuideSearchText, searchGuideItems, type ScopedGuideSearchState } from './guide-search';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PuppyChecklistScreen } from './PuppyChecklistScreen';
import { checklistReadCacheScope } from './checklist-data';
import type { PendingChecklistMemory } from './checklist-intent';
import { FAQScreen } from './FAQScreen';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from './review-content';
import { knowledgeImageForGuide, editorialImageForGuide } from './editorial-image-assignment';

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
  dogSex = null,
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
  dogSex?: DogSex | null;
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
  const articleText = (value: string) => personalizeArticle(value, { name: dogName, sex: dogSex });
  const dogLabel = dogName.trim() || 'vald hund';
  if (guideViewState.scopeKey !== searchScopeKey) {
    setGuideViewState({ scopeKey: searchScopeKey, value: '', showAll: false });
  }

  const checklistInvalidate = useRef<(() => void) | null>(null);
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const introductionIndex = selectedItem ? parseGuideBody(selectedItem.body).findIndex((block) => block.type === 'paragraph') : -1;
  const visibleItems = items
    .filter((item) => item.contentType === 'article' || item.contentType === 'guide')
    .sort(compareGuideTitle);
  const recommendedItems = visibleItems.filter((item) => item.recommended !== false);
  const candidates = showAllGuides || hasSearchQuery ? visibleItems : recommendedItems;
  const matchingIds = new Set(searchGuideItems(candidates.map((item) => ({ ...item,
    title: articleText(item.title), body: articleText(item.body) })), searchQuery).map((item) => item.id));
  const displayedItems = candidates.filter((item) => matchingIds.has(item.id));
  const cardItems = hasSearchQuery || showAllGuides ? displayedItems : displayedItems.slice(0, 3);
  const hasMoreGuides = !hasSearchQuery && !showAllGuides && recommendedItems.length > 3;
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
    const image = knowledgeImageForGuide(item) ?? editorialImageForGuide(item);
    return <MotionPressable
      key={item.id}
      accessibilityRole="button"
      accessibilityLabel={`Läs ${articleText(item.title)}`}
      onPress={() => openArticle(item.id)}
      style={featured ? styles.featured : styles.smallCard}
    >
      {image ? <Image source={image} style={featured ? styles.featuredImage : styles.smallImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
      <View style={featured ? styles.cardCopy : styles.smallCardCopy}>
        <Text style={featured ? styles.guideTitle : styles.smallGuideTitle} numberOfLines={featured ? undefined : 3}>{articleText(item.title)}</Text>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataPill}>{readingMinutes(item.body)} min</Text>
          <Text style={styles.metadataPill}>{item.contentType === 'guide' ? 'Guide' : 'Artikel'}</Text>
        </View>
      </View>
    </MotionPressable>;
  }

  return (
    <View style={styles.screen}>
      {selectedItem ? <AppBar mode="Back" title="Kunskap" variant="compact"
        actionLabel={returnToDevelopment ? 'Tillbaka till Utveckling' : 'Tillbaka till guider'}
        onAction={() => { setOpenedId(null); onSelectContent(null); if (returnToDevelopment) onBack(); }} /> : null}
      {!selectedItem && tab === 'För dig'
        ? returnToTraining
          ? <AppBar mode="Back" title="Kunskap" actionLabel="Tillbaka till Träning" onAction={onBack} />
          : <Text accessibilityRole="header" style={styles.pageTitle}>Kunskap</Text>
        : null}
      {!selectedItem && tab === 'FAQ' ? <AppBar mode="Back" title="Kunskap" variant="compact" actionLabel="Tillbaka till guider" onAction={() => changeTab('För dig')} /> : null}
      {!selectedItem && tab === 'Checklistor' && !checklistDetailOpen ? <AppBar mode="Back" title="Kunskap" variant="compact" actionLabel="Tillbaka till guider" onAction={() => changeTab('För dig')} /> : null}

      {tab === 'För dig' && !selectedItem ? <View style={styles.searchSection}>
        <View style={styles.searchField}>
          {iconsLoaded ? <Ionicons name="search-outline" size={tokens.size.iconSm} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
          <TextInput
            accessibilityLabel={`Sök bland alla artiklar`}
            accessibilityHint={`Sök bland alla publicerade artiklar.`}
            value={searchQuery}
            onChangeText={(value) => setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, value }))}
            placeholder={`Sök bland alla artiklar`}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery !== '' ? <MotionPressable accessibilityRole="button" accessibilityLabel="Rensa sökning" onPress={clearSearch} style={styles.clearSearch}>
            {iconsLoaded ? <Ionicons name="close-circle" size={tokens.size.iconMd} color={tokens.colors.textSecondary} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : <Text style={styles.clearSearchText}>Rensa</Text>}
          </MotionPressable> : null}
        </View>
      </View> : null}

      {tab === 'För dig' && !selectedItem && <QuietButton
        title={showAllGuides ? 'För dig' : 'Alla artiklar'}
        onPress={() => setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, showAll: !showAllGuides }))} /> }

      {showGuideScreen && contentState === 'loading' && <Skeleton shape="card" lines={4} />}
      {showGuideScreen && contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Försök igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {tab === 'För dig' && !selectedItem && contentState === 'ready' && displayedItems.length === 0 && !hasSearchQuery && <MessageCard>
        {showAllGuides ? 'Inga artiklar är publicerade ännu.' : `Inga rekommenderade artiklar för ${dogLabel} just nu. Du kan läsa alla publicerade artiklar.`}
      </MessageCard>}
      {tab === 'För dig' && !selectedItem && contentState === 'ready' && visibleItems.length > 0 && hasSearchQuery && displayedItems.length === 0
        ? <View style={styles.searchEmpty}>
          <MessageCard>{`Inga artiklar matchar "${searchQuery.trim()}" i biblioteket.`}</MessageCard>
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
        {hasMoreGuides ? <QuietButton title="Visa alla artiklar" onPress={() => setGuideViewState((current) => ({ ...current, scopeKey: searchScopeKey, showAll: true }))} /> : null}
      </View> : null}

      {selectedItem && contentState === 'ready' ? <View style={styles.articleCard}>
        <Image source={knowledgeImageForGuide(selectedItem) ?? editorialImageForGuide(selectedItem)} style={styles.articleImage}
          resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        <View style={styles.articleCopy}>
        <Text style={styles.articleTitle} accessibilityRole="header">{articleText(selectedItem.title)}</Text>
        {selectedItem.isAiGenerated ? <Text style={styles.aiOriginLabel}>AI-genererat innehåll</Text> : null}
        <View style={styles.articleBody}>
          {parseGuideBody(selectedItem.body).map((block, index) => {
            if (block.type === 'heading') return <Text
              key={`${selectedItem.id}:heading:${index}`}
              accessibilityRole="header"
              style={block.level === 2 ? styles.bodyHeading : styles.bodySubheading}
            >{articleText(block.text)}</Text>;
            if (block.type === 'callout') return <View key={`${selectedItem.id}:callout:${index}`}
              style={[styles.callout, block.tone === 'important' && styles.importantCallout]}>
              <View style={styles.calloutHeading}>
                {iconsLoaded ? <Ionicons name={block.tone === 'tip' ? 'bulb-outline' : 'alert-circle-outline'} size={tokens.size.iconMd}
                  color={block.tone === 'tip' ? tokens.colors.primary : tokens.colors.warning} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" /> : null}
                <Text accessibilityRole="header" style={styles.calloutLabel}>{block.tone === 'tip' ? 'Tips i vardagen' : 'Viktigt'}</Text>
              </View>
              <Text style={styles.calloutText}>{articleText(block.text)}</Text>
            </View>;
            if (block.type === 'list') return <View key={`${selectedItem.id}:list:${index}`} style={styles.bodyList}>
              {block.items.map((item, itemIndex) => <Text key={`${selectedItem.id}:list:${index}:${itemIndex}`} style={styles.bodyListItem}>• {articleText(item)}</Text>)}
            </View>;
            return <Text key={`${selectedItem.id}:paragraph:${index}`} style={[styles.bodyParagraph, index === introductionIndex && styles.articleIntro]}>{articleText(block.text)}</Text>;
          })}
        </View>
        {selectedItem.sources.length > 0 ? <>
        <Text style={styles.sourcesHeading} accessibilityRole="header">Källor</Text>
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
        </> : null}
        {sourceMessage !== '' && <MessageCard>{sourceMessage}</MessageCard>}
        </View>
      </View> : null}

      {tab === 'För dig' && !selectedItem ? <View style={styles.shortcuts}>
        <SectionHeader title="Fler i Kunskap" />
        <View style={styles.categoryLinks}>
          <View style={styles.categoryCard}><Card onPress={() => changeTab('Checklistor')} accessibilityLabel="Öppna Checklistor">
            <View style={styles.categoryLink}><View style={styles.categoryIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{iconsLoaded ? <Ionicons name="list-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /> : null}</View><Text style={styles.categoryTitle}>Checklistor</Text></View>
          </Card></View>
          <View style={styles.categoryCard}><Card onPress={() => changeTab('FAQ')} accessibilityLabel="Öppna Vanliga frågor">
            <View style={styles.categoryLink}><View style={styles.categoryIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{iconsLoaded ? <Ionicons name="help-circle-outline" size={tokens.size.iconSm} color={tokens.colors.destination.knowledge.icon} /> : null}</View><Text style={styles.categoryTitle}>Vanliga frågor</Text></View>
          </Card></View>
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
  searchEmpty: { gap: tokens.spacing.xs },
  searchCount: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  pageTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  shortcuts: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  categoryLinks: { flexDirection: 'row', gap: tokens.spacing.sm },
  categoryCard: { flex: 1, minWidth: 0 },
  categoryLink: { flexDirection: 'column', alignItems: 'center', gap: tokens.spacing.xs },
  categoryIcon: { width: tokens.size.chipMd, height: tokens.size.chipMd, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.colors.destination.knowledge.surface, borderRadius: tokens.radius.full },
  categoryTitle: { alignSelf: 'stretch', textAlign: 'center', ...tokens.typography.label, color: tokens.colors.textPrimary },
  categoryCopy: { flex: 1, minWidth: 0, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.xs },
  featured: { backgroundColor: tokens.colors.home.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  featuredImage: { width: '100%', aspectRatio: 16 / 9 },
  cardCopy: { paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.xs },
  smallCardCopy: { flex: 1, padding: tokens.spacing.sm, gap: tokens.spacing.xs },
  metadataRow: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  metadataPill: { ...tokens.typography.caption, color: tokens.colors.textSecondary, backgroundColor: tokens.colors.background, borderRadius: tokens.radius.full, paddingHorizontal: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  articleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  smallCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: tokens.colors.home.card, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  smallImage: { width: '100%', aspectRatio: 4 / 3 },
  guideList: { gap: tokens.spacing.xs },
  guideTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  smallGuideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  articleCard: { alignSelf: 'stretch', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, overflow: 'hidden' },
  articleImage: { width: '100%', aspectRatio: 16 / 9 },
  articleCopy: { padding: tokens.layout.cardPadding },
  articleIntro: { backgroundColor: tokens.colors.destination.knowledge.surface, padding: tokens.spacing.md, borderRadius: tokens.radius.md },
  callout: { backgroundColor: tokens.colors.successSurface, padding: tokens.spacing.md, borderRadius: tokens.radius.md, marginTop: tokens.spacing.lg, gap: tokens.spacing.sm },
  importantCallout: { backgroundColor: tokens.colors.warningSurface },
  calloutHeading: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  calloutLabel: { ...tokens.typography.label, color: tokens.colors.textPrimary, flex: 1 },
  calloutText: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  articleTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  aiOriginLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  articleBody: { marginTop: tokens.spacing.md },
  bodyHeading: { ...tokens.typography.heading, color: tokens.colors.primary, marginTop: tokens.spacing.xl },
  bodySubheading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.lg },
  bodyParagraph: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  bodyList: { marginTop: tokens.spacing.sm },
  bodyListItem: { ...tokens.typography.body, color: tokens.colors.textPrimary, marginTop: tokens.spacing.sm },
  sourcesHeading: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xl, marginBottom: tokens.spacing.sm },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingVertical: tokens.spacing.md },
  sourceCopy: { flex: 1, gap: tokens.spacing.xs },
  sourceText: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
});
