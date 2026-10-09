import { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, QuietButton } from '../../components/AppPrimitives';
import { AppBar, Card, EmptyState, ErrorState, Skeleton, Tabs } from '../../components/ui';
import { tokens } from '../../theme/tokens';
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
  const [activeTab, setActiveTab] = useState('För dig');
  const filteredItems = items.filter((item) => activeTab === 'För dig'
    || (activeTab === 'Artiklar' && item.contentType === 'article')
    || (activeTab === 'Checklistor' && item.contentType === 'checklist')
    || (activeTab === 'FAQ' && false));
  const selectedItem = filteredItems.find((item) => item.id === focusedContentId) ?? filteredItems[0] ?? null;
  const compactItems = filteredItems.filter((item) => item.id !== selectedItem?.id);

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
      <AppBar mode="Back" title="Kunskap" onAction={onBack} />
      <Tabs items={['För dig', 'Artiklar', 'Checklistor', 'FAQ']} active={activeTab} onChange={(tab) => { setActiveTab(tab); setSourceMessage(''); }} />
      {contentState === 'loading' && <>
        <Skeleton shape="card" />
        <View style={styles.gridRow}><Skeleton shape="row" lines={2} style={styles.gridCard} /><Skeleton shape="row" lines={2} style={styles.gridCard} /></View>
      </>}
      {contentState === 'error' && <ErrorState title="Kunskapen kunde inte hämtas" description="Försök igen när du vill." actionLabel="Försök igen" onRetry={onRetry} />}
      {contentState === 'ready' && filteredItems.length === 0 && <EmptyState title="Inget publicerat ännu" description="Nytt innehåll visas här när det finns för dig." />}
      {contentState === 'ready' && selectedItem && <>
        <Card accessibilityLabel={`${selectedItem.title}, ${contentTypeLabel(selectedItem.contentType)}`} onPress={() => { setSourceMessage(''); onSelectContent(selectedItem.id); }}>
          <Image source={require('../../../assets/images/dog-welcome.png')} style={styles.featureImage} accessibilityLabel="Illustrativ Tassla-bild" />
          <Text style={styles.featureType}>{contentTypeLabel(selectedItem.contentType)}</Text>
          <Text style={styles.featureTitle} numberOfLines={2} accessibilityRole="header">{selectedItem.title}</Text>
          <Text style={styles.featureIngress} numberOfLines={2}>{getGuidePreviewText(selectedItem.body)}</Text>
          <Text style={styles.readTime}>{estimatedReadTime(selectedItem.body)} · Publicerat innehåll</Text>
        </Card>
        {compactItems.length > 0 && <View style={styles.grid}>{Array.from({ length: Math.ceil(compactItems.length / 2) }, (_, rowIndex) => <View key={`row-${rowIndex}`} style={styles.gridRow}>{compactItems.slice(rowIndex * 2, rowIndex * 2 + 2).map((item) => <View key={item.id} style={styles.gridCard}><Card accessibilityLabel={`${item.title}, ${contentTypeLabel(item.contentType)}`} onPress={() => { setSourceMessage(''); onSelectContent(item.id); }}><Text style={styles.guideType}>{contentTypeLabel(item.contentType)}</Text><Text style={styles.guideTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.gridPreview} numberOfLines={2}>{getGuidePreviewText(item.body)}</Text></Card></View>)}</View>)}</View>}
        {focusedContentId === selectedItem.id && <View style={styles.articleCard}>
          <View style={styles.articleEyebrowRow}>
            {iconsLoaded && <Ionicons name="leaf-outline" size={tokens.size.iconSm} color={tokens.colors.primary} />}
            <Text style={styles.articleEyebrow}>PUBLICERAD GUIDE · VERSION {selectedItem.version}</Text>
          </View>
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
    </View>
  );
}

function contentTypeLabel(type: HomeContent['contentType']): string {
  return type === 'article' ? 'KUNSKAP' : type === 'guide' ? 'GUIDE' : type === 'checklist' ? 'CHECKLISTA' : 'TRÄNING';
}

function estimatedReadTime(body: string): string {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min läsning`;
}

const styles = StyleSheet.create({
  grid: { gap: tokens.spacing.sm },
  gridRow: { flexDirection: 'row', gap: tokens.spacing.sm },
  gridCard: { flex: 1 },
  featureImage: { alignSelf: 'stretch', height: tokens.size.heroHeight - tokens.spacing.xxl, borderRadius: tokens.radius.md, marginBottom: tokens.spacing.md },
  featureType: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  featureTitle: { ...tokens.typography.heading, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xs },
  featureIngress: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  readTime: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.md },
  guideType: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  guideTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  gridPreview: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.xs },
  articleCard: { alignSelf: 'stretch', borderRadius: tokens.radius.lg, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginTop: tokens.layout.sectionGap },
  articleEyebrowRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  articleEyebrow: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700', flexShrink: 1 },
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
