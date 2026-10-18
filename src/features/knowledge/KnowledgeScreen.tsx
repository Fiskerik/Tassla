import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, IconChip, SectionHeader, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import { MotionPressable } from '../../components/ui/Motion';
import { getSafeContentSourceUrl } from './source-links';
import { parseGuideBody } from './guide-body';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PuppyChecklistScreen } from './PuppyChecklistScreen';
import { checklistReadCacheScope } from './checklist-data';
import type { PendingChecklistMemory } from './checklist-intent';
import { FAQScreen } from './FAQScreen';
import { CHECKLIST_DESTINATION_ID, FAQ_DESTINATION_ID } from './review-content';
import { searchKnowledgeItems } from './knowledge-search';
import { getKnowledgeContentImage } from './knowledge-content-media';

type ContentState = 'loading' | 'ready' | 'error';
type KnowledgeTab = 'För dig' | 'Artiklar' | 'Checklistor' | 'FAQ';

export function KnowledgeScreen({
  onBack,
  items = [],
  contentState = 'ready',
  forYouItems = items,
  articleItems = items.filter((item) => item.contentType !== 'checklist' && item.contentType !== 'training_program'),
  faqItems = [],
  faqSelectionStatus = 'unknown',
  faqUnknownReason,
  forYouSelectionStatus = 'eligible',
  articleSelectionStatus = 'eligible',
  unknownSelectionReason,
  contextualHelpReturn = false,
  contextualReturnLabel = 'Tillbaka',
  onOpenDogProfile,
  onOpenTodayChecklist,
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
  forYouItems?: readonly HomeContent[];
  articleItems?: readonly HomeContent[];
  faqItems?: readonly HomeContent[];
  faqSelectionStatus?: 'eligible' | 'empty' | 'unknown';
  faqUnknownReason?: 'missing_age' | 'invalid_request' | 'unmapped_version';
  forYouSelectionStatus?: 'eligible' | 'empty' | 'unknown';
  articleSelectionStatus?: 'eligible' | 'empty' | 'unknown';
  unknownSelectionReason?: 'missing_age' | 'invalid_request' | 'unmapped_version';
  contextualHelpReturn?: boolean;
  contextualReturnLabel?: string;
  onOpenDogProfile?: () => void;
  onOpenTodayChecklist?: () => void;
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
  const [searchText, setSearchText] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(focusedContentId);
  const [tab, setTab] = useState<KnowledgeTab>(() => focusedContentId === CHECKLIST_DESTINATION_ID ? 'Checklistor' : focusedContentId === FAQ_DESTINATION_ID ? 'FAQ' : 'För dig');
  const [checklistDetailOpen, setChecklistDetailOpen] = useState(false);
  const checklistInvalidate = useRef<(() => void) | null>(null);
  const selectedItem = items.find((item) => item.id === openedId) ?? null;
  const detailOpen = Boolean(selectedItem) || (tab === 'Checklistor' && checklistDetailOpen);
  const visibleItems = tab === 'För dig' ? forYouItems : tab === 'Artiklar' ? articleItems : [];
  const visibleSelectionStatus = tab === 'För dig' ? forYouSelectionStatus : articleSelectionStatus;
  const canSearch = contentState === 'ready' && (tab === 'För dig' || tab === 'Artiklar') && visibleSelectionStatus === 'eligible' && visibleItems.length > 0;
  const filteredItems = canSearch ? searchKnowledgeItems(visibleItems, searchText) : [];
  const hasSearchQuery = searchText.trim().length > 0;
  useEffect(() => { onDetailChange?.(detailOpen); }, [detailOpen, onDetailChange]);
  useEffect(() => () => { onDetailChange?.(false); }, [onDetailChange]);
  function openArticle(id: string) { setOpenedId(id); setSourceMessage(''); onSelectContent(id); }
  function changeTab(nextTab: string) {
    if (tab === 'Checklistor' && nextTab !== 'Checklistor') { checklistInvalidate.current?.(); checklistInvalidate.current = null; }
    setSearchText('');
    setTab(nextTab as KnowledgeTab);
  }

  async function openSource(source: string) {
    setSourceMessage('');
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
      {selectedItem ? <AppBar mode="Back" title={contextualHelpReturn ? 'Hjälp' : 'Kunskap'} actionLabel={contextualHelpReturn ? contextualReturnLabel : 'Tillbaka till guider'} onAction={() => {
        if (contextualHelpReturn) { onBack(); return; }
        setOpenedId(null); onSelectContent(null);
      }} /> : null}
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
      {(tab === 'För dig' || tab === 'Artiklar') && contentState === 'ready' && visibleItems.length === 0 && <View style={styles.emptyState}>
        {visibleSelectionStatus === 'unknown' ? <MessageCard>{unknownSelectionReason === 'missing_age'
          ? 'Lägg till födelsedatum för åldersbaserade råd.' : 'Vi kan inte välja innehåll för den här vyn just nu.'}</MessageCard>
          : <MessageCard>{tab === 'För dig'
            ? 'Det finns inga publicerade guider som passar hundens profil i den här vyn just nu.'
            : 'Det finns inga publicerade artiklar som passar hundens profil i den här vyn just nu.'}</MessageCard>}
        {visibleSelectionStatus === 'unknown'
          ? unknownSelectionReason === 'missing_age'
            ? <PrimaryButton title="Redigera hundprofil" onPress={onOpenDogProfile ?? onBack} />
            : onOpenTodayChecklist ? <PrimaryButton title="Öppna dagens checklista" onPress={onOpenTodayChecklist} /> : null
          : <PrimaryButton title="Öppna checklistor" onPress={() => changeTab('Checklistor')} />}
      </View>}
      {canSearch && !selectedItem && <View style={styles.searchBlock}>
        <TextInput
          accessibilityLabel="Sök bland guider"
          placeholder="Sök bland guider"
          placeholderTextColor={tokens.colors.textSecondary}
          returnKeyType="search"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <Text style={styles.searchHelper}>Sökningen gäller bara publicerat innehåll som redan valts för den här fliken och hundens profil.</Text>
      </View>}
      {tab === 'FAQ' && !selectedItem ? <FAQScreen context="by_age" reviewEnabled={reviewEnabled}
        loading={contentState === 'loading'} error={contentState === 'error'} publicItems={faqItems}
        selectionStatus={faqSelectionStatus} unknownReason={faqUnknownReason} onRetry={onRetry}
        onOpenDogProfile={onOpenDogProfile} onOpenSource={(source) => { void openSource(source); }} sourceMessage={sourceMessage} /> : null}
      {(tab === 'För dig' || tab === 'Artiklar') && contentState === 'ready' && canSearch && filteredItems.length === 0 && hasSearchQuery && <View style={styles.emptyState}>
        <MessageCard>{tab === 'För dig'
          ? 'Inga guider på den här fliken matchar sökningen.'
          : 'Inga artiklar på den här fliken matchar sökningen.'}</MessageCard>
        <QuietButton title="Rensa sökning" onPress={() => setSearchText('')} />
      </View>}
      {(tab === 'För dig' || tab === 'Artiklar' || selectedItem) && contentState === 'ready' && (filteredItems.length > 0 || selectedItem) && <>
        {!selectedItem && tab === 'För dig' && <View style={styles.guideList}>
          <KnowledgeGuideCard item={filteredItems[0]} variant="hero" onPress={() => openArticle(filteredItems[0].id)} />
          {filteredItems.slice(1).map((item) => <KnowledgeGuideCard key={item.id} item={item} variant="compact" onPress={() => openArticle(item.id)} />)}
        </View>}
        {!selectedItem && tab === 'Artiklar' && <View style={styles.guideList}>
          {filteredItems.map((item) => <KnowledgeGuideCard key={item.id} item={item} variant="compact" onPress={() => openArticle(item.id)} />)}
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
      {tab === 'För dig' && !selectedItem && !hasSearchQuery ? <View style={styles.shortcuts}>
        <SectionHeader title="Fler i Kunskap" />
        <View style={styles.categoryLinks}>
          <Card onPress={() => changeTab('Checklistor')} accessibilityLabel="Öppna Checklistor">
            <View style={styles.categoryLink}><IconChip category="training" /><View style={styles.categoryCopy}><Text style={styles.smallGuideTitle}>Checklistor</Text><Text style={styles.sourceText}>För valpens olika faser</Text></View></View>
          </Card>
          <Card onPress={() => changeTab('FAQ')} accessibilityLabel="Öppna Vanliga frågor">
            <View style={styles.categoryLink}><IconChip category="sleep" /><View style={styles.categoryCopy}><Text style={styles.smallGuideTitle}>Vanliga frågor</Text><Text style={styles.sourceText}>Svar efter var ni är just nu</Text></View></View>
          </Card>
        </View>
      </View> : null}
      {client && dogId ? <View style={{ display: tab === 'Checklistor' ? 'flex' : 'none' }}>
        <PuppyChecklistScreen key={`${sessionKey}:${dogId}`} cacheScope={checklistScope} client={client} dogId={dogId} ageWeeks={ageWeeks} active={tab === 'Checklistor'} pendingState={checklistPending} onPendingStateChange={onChecklistPendingChange} onDetailChange={setChecklistDetailOpen} onBack={() => changeTab('För dig')} registerInvalidate={(invalidate) => { checklistInvalidate.current = invalidate; }} />
      </View> : null}
    </View>
  );
}

function KnowledgeGuideCard({ item, variant, onPress }: { item: HomeContent; variant: 'hero' | 'compact'; onPress: () => void }) {
  const image = getKnowledgeContentImage(item.id);
  const imageStyle = variant === 'hero' ? styles.heroImage : styles.compactImage;
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Läs ${item.title}`} onPress={onPress} style={variant === 'hero' ? styles.heroCard : styles.compactCard}>
    {image && <Image source={image} style={imageStyle} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
    <View style={variant === 'hero' ? styles.heroCopy : styles.compactCopy}>
      <Text style={variant === 'hero' ? styles.heroTitle : styles.smallGuideTitle}>{item.title}</Text>
      <Text style={styles.readTime}>ca {readingMinutes(item.body)} min</Text>
    </View>
  </MotionPressable>;
}

function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.split(/\s+/).length / 200)); }

const styles = StyleSheet.create({
  screen: { gap: tokens.spacing.md },
  emptyState: { gap: tokens.spacing.sm },
  pageTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  reviewNotice: { ...tokens.typography.caption, color: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface, borderRadius: tokens.radius.md, padding: tokens.spacing.sm },
  searchBlock: { gap: tokens.spacing.xs },
  searchInput: { minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.md, paddingHorizontal: tokens.spacing.md, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface, ...tokens.typography.body },
  searchHelper: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  shortcuts: { gap: tokens.spacing.xs, marginTop: tokens.spacing.sm },
  categoryLinks: { gap: tokens.spacing.sm },
  categoryLink: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  categoryCopy: { flex: 1, minWidth: 0, paddingVertical: tokens.spacing.sm, gap: tokens.spacing.xs },
  guideList: { gap: tokens.spacing.sm },
  heroCard: { backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, overflow: 'hidden' },
  heroImage: { width: '100%', height: tokens.size.trainingImage * 1.8 },
  heroCopy: { padding: tokens.layout.cardPadding, gap: tokens.spacing.xs },
  heroTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  compactCard: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, minHeight: tokens.size.buttonHeight, padding: tokens.spacing.sm, backgroundColor: tokens.colors.surface, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg },
  compactImage: { width: tokens.size.trainingImage, height: tokens.size.trainingImage, borderRadius: tokens.radius.md },
  compactCopy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs },
  smallGuideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  articleCard: { alignSelf: 'stretch', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding },
  articleTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
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
