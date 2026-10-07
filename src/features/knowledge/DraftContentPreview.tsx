import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';

declare const __DEV__: boolean;
declare const require: (path: string) => unknown;
declare const process: { env?: Record<string, string | undefined> };

interface DraftVersion {
  title: string;
  body: string;
  status: 'draft';
  training_steps?: readonly { title: string; instruction: string }[];
}
interface DraftItem { id: string; content_type: string; versions: readonly DraftVersion[]; }
interface DraftBundle { status: 'draft'; items: readonly DraftItem[]; }

export function isDraftContentPreviewEnabled(flag: string | undefined, developmentBuild: boolean): boolean {
  return flag === 'true' && developmentBuild === true;
}

export const DRAFT_PREVIEW_ENABLED = isDraftContentPreviewEnabled(
  process.env?.EXPO_PUBLIC_TASSLA_DRAFT_PREVIEW,
  typeof __DEV__ !== 'undefined' && __DEV__ === true,
);

// This file is imported only by the local DevelopmentPreview path. Published
// selection and ProductWorkspace never import the draft bundle.
function loadDraftBundle(): DraftBundle {
  return require('../../../docs/content/mvp-content-bundle-v1.json') as DraftBundle;
}

export function DraftContentPreview({ onBack, enabled = DRAFT_PREVIEW_ENABLED }: { onBack: () => void; enabled?: boolean }) {
  const draftBundle = enabled ? loadDraftBundle() : null;
  if (!draftBundle || draftBundle.status !== 'draft') return null;
  return <ScrollView>
    <QuietButton title="Tillbaka till Mer" onPress={onBack} />
    <PageHeading title="Utkast för granskning" description="Intern förhandsvisning av tränings- och hälsotexter som ännu inte är sakgranskade eller publicerade." />
    <MessageCard tone="error">Utkast – ej granskat eller publicerat. Använd inte texten som vård- eller träningsråd före granskning.</MessageCard>
    {draftBundle.items.map((item) => {
      const version = item.versions[0];
      if (!version) return null;
      return <View key={item.id} style={styles.card}>
        <Text style={styles.eyebrow}>{item.content_type === 'training_program' ? 'TRÄNING' : 'HÄLSA/KUNSKAP'} · UTKAST</Text>
        <Text style={styles.title}>{version.title}</Text>
        <Text style={styles.body}>{version.body}</Text>
        {version.training_steps?.map((step, index) => <View key={`${item.id}-step-${index}`} style={styles.step}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.body}>{step.instruction}</Text></View>)}
      </View>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  card: { padding: 16, marginTop: 13, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' },
  eyebrow: { color: '#785716', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: theme.colors.text, fontSize: 19, lineHeight: 25, fontWeight: '800', marginTop: 6 },
  body: { color: theme.colors.text, fontSize: 15, lineHeight: 22, marginTop: 7 },
  step: { borderTopWidth: 1, borderTopColor: '#E4D9BE', marginTop: 12, paddingTop: 10 },
  stepTitle: { color: theme.colors.accent, fontSize: 15, fontWeight: '800' },
});
