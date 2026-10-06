import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { HomeContent } from '../../data/app-data';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
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
      <QuietButton title="Tillbaka" onPress={onBack} />
      <PageHeading title="Kunskap" description="Lugna, granskade guider för hundens vardag." />
      {contentState === 'loading' && <MessageCard>Hämtar publicerade guider…</MessageCard>}
      {contentState === 'error' && <>
        <MessageCard tone="error">Guiderna kunde inte hämtas. Vi visar inget tills anslutningen fungerar igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </>}
      {contentState === 'ready' && items.length === 0 && <MessageCard>
        Det finns inga publicerade guider som passar just nu. Nya guider visas här när de är klara.
      </MessageCard>}
      {contentState === 'ready' && items.length > 0 && <>
        <View style={styles.guideList}>
          {items.map((item) => {
            const selected = selectedItem?.id === item.id;
            return <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.title}, version ${item.version}`}
              onPress={() => { setSourceMessage(''); onSelectContent(item.id); }}
              style={({ pressed }) => [styles.guideRow, selected && styles.guideRowSelected, pressed && styles.pressed]}
            >
              {iconsLoaded && <Ionicons name={item.contentType === 'checklist' ? 'checkbox-outline' : 'book-outline'} size={21} color={theme.colors.accent} />}
              <View style={styles.guideCopy}>
                <Text style={styles.guideType}>{contentTypeLabel(item.contentType)}</Text>
                <Text style={styles.guideTitle}>{item.title}</Text>
              </View>
              {selected && <Text style={styles.selectedLabel}>Vald</Text>}
            </Pressable>;
          })}
        </View>
        {selectedItem && <View style={styles.articleCard}>
          <View style={styles.articleEyebrowRow}>
            {iconsLoaded && <Ionicons name="leaf-outline" size={18} color={theme.colors.accent} />}
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
              {iconsLoaded && <Ionicons name={safeUrl ? 'link-outline' : 'document-text-outline'} size={17} color={theme.colors.accent} />}
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

const styles = StyleSheet.create({
  guideList: { gap: 9, marginTop: 3 },
  guideRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 15, paddingVertical: 12 },
  guideRowSelected: { borderColor: theme.colors.accent, backgroundColor: '#E8EFE8' },
  guideCopy: { flex: 1 },
  guideType: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  guideTitle: { color: theme.colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800', marginTop: 3 },
  selectedLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  articleCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 18, marginTop: 14 },
  articleEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  articleEyebrow: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  articleTitle: { color: theme.colors.text, fontSize: 22, lineHeight: 29, fontWeight: '800', marginTop: 9 },
  articleBody: { marginTop: 12 },
  bodyHeading: { color: theme.colors.text, fontSize: 19, lineHeight: 26, fontWeight: '800', marginTop: 15, marginBottom: 3 },
  bodySubheading: { color: theme.colors.text, fontSize: 17, lineHeight: 24, fontWeight: '800', marginTop: 12, marginBottom: 2 },
  bodyParagraph: { color: theme.colors.text, fontSize: 16, lineHeight: 25, marginTop: 7 },
  bodyList: { marginTop: 4 },
  bodyListItem: { color: theme.colors.text, fontSize: 16, lineHeight: 25, marginTop: 6 },
  sourcesHeading: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 6 },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingVertical: 9 },
  sourceCopy: { flex: 1 },
  sourceText: { color: theme.colors.mutedText, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.78 },
});
