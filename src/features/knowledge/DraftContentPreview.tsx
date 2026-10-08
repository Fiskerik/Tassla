import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';

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
  return <ScrollView contentContainerStyle={styles.content}>
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
  content: { padding: tokens.layout.pageInset, paddingBottom: tokens.spacing.xxl, gap: tokens.spacing.md },
  card: {
    padding: tokens.layout.cardPadding,
    marginTop: tokens.spacing.xs,
    borderRadius: tokens.radius.lg,
    borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    gap: tokens.spacing.sm,
  },
  eyebrow: { ...tokens.typography.caption, color: tokens.colors.warning, fontWeight: '700' },
  title: { ...tokens.typography.heading, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.body, color: tokens.colors.textPrimary },
  step: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, marginTop: tokens.spacing.xs, paddingTop: tokens.spacing.md, gap: tokens.spacing.sm },
  stepTitle: { ...tokens.typography.label, color: tokens.colors.primary },
});
