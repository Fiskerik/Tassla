import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppScreen, MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { fetchHomeContent, fetchOwnedDog, type HomeContent, type OwnedDog } from '../../data/app-data';
import { theme } from '../../theme/tokens';
import { useAuth } from '../account/AuthProvider';
import { DEV_PREVIEW_ENABLED } from '../account/preview-policy';
import { SignInScreen } from '../account/SignInScreen';
import { ProfileScreen } from '../onboarding/ProfileScreen';
import { ageInWeeks, localDate } from '../onboarding/dog';
import { DevelopmentPreview } from './DevelopmentPreview';

export function AppFlow() {
  return DEV_PREVIEW_ENABLED ? <DevelopmentPreview /> : <AuthenticatedAppFlow />;
}

function AuthenticatedAppFlow() {
  const { client, session, status } = useAuth();

  if (status === 'loading') return <LoadingScreen label="Öppnar Tassla…" />;
  if (status === 'unavailable' || !client) return <UnavailableScreen />;
  if (status === 'signedOut' || !session) return <SignInScreen />;
  return <DogWorkspace key={session.user.id} client={client} />;
}

function DogWorkspace({ client }: { client: SupabaseClient }) {
  const [dog, setDog] = useState<OwnedDog | null>(null);
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchOwnedDog(client).then((loadedDog) => {
      if (!active) return;
      setDog(loadedDog);
      setState(loadedDog ? 'ready' : 'missing');
    }).catch(() => {
      if (active) setState('error');
    });
    return () => { active = false; };
  }, [attempt, client]);

  if (state === 'loading') return <LoadingScreen label="Hämtar hundens profil…" />;
  if (state === 'error') return <ProfileLoadError onRetry={() => { setState('loading'); setAttempt((count) => count + 1); }} />;
  if (state === 'missing') return <ProfileScreen client={client} onCreated={(created) => { setDog(created); setState('ready'); }} />;
  if (!dog) return <LoadingScreen label="Öppnar hemmet…" />;
  return <HomeScreen client={client} dog={dog} />;
}

function HomeScreen({ client, dog }: { client: SupabaseClient; dog: OwnedDog }) {
  const { signOut } = useAuth();
  const [content, setContent] = useState<HomeContent[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const age = ageInWeeks(dog.birth_date, localDate());

  useEffect(() => {
    let active = true;
    void fetchHomeContent(client, dog, age).then((items) => {
      if (!active) return;
      setContent(items);
      setState('ready');
    }).catch(() => {
      if (active) setState('error');
    });
    return () => { active = false; };
  }, [age, attempt, client, dog]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    let success = false;
    try {
      success = await signOut();
    } catch {
      success = false;
    } finally {
      setSigningOut(false);
    }
    setSignOutError(!success);
  }

  return (
    <AppScreen>
      <View style={styles.homeHeader}>
        <View style={styles.homeEyebrow}><Text style={styles.homeEyebrowText}>ER HUNDRESA</Text></View>
        <Text style={styles.homeTitle} accessibilityRole="header">Hej, {dog.name}!</Text>
        <Text style={styles.homeSubtitle}>{age} {age === 1 ? 'vecka gammal' : 'veckor gammal'}</Text>
      </View>

      <View style={styles.dogCard}>
        <View style={styles.pawCircle}><Text style={styles.pawText}>✦</Text></View>
        <View style={styles.dogCardCopy}>
          <Text style={styles.dogCardTitle}>{dog.name}</Text>
          <Text style={styles.dogCardSubtitle}>En vecka i taget. Ni lär er tillsammans.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">För er just nu</Text>
      {state === 'loading' && <LoadingScreen label="Hämtar publicerat innehåll…" compact />}
      {state === 'error' && <>
        <MessageCard tone="error">Innehållet kunde inte hämtas. Vi visar inget tills anslutningen fungerar igen.</MessageCard>
        <PrimaryButton title="Försök igen" onPress={() => { setState('loading'); setAttempt((count) => count + 1); }} />
      </>}
      {state === 'ready' && content.length === 0 && (
        <MessageCard>Det finns inget publicerat innehåll för {dog.name}s ålder och ras ännu. Nya guider visas här när de är klara.</MessageCard>
      )}
      {state === 'ready' && content.map((item) => <ContentCard key={item.id} item={item} />)}
      {signOutError && <MessageCard tone="error">Det gick inte att logga ut just nu. Försök igen.</MessageCard>}

      <QuietButton title={signingOut ? 'Loggar ut…' : 'Logga ut'} disabled={signingOut} onPress={() => { void handleSignOut(); }} />
    </AppScreen>
  );
}

function ContentCard({ item }: { item: HomeContent }) {
  return (
    <View style={styles.contentCard}>
      <Text style={styles.contentType}>{contentLabel(item.contentType)}</Text>
      <Text style={styles.contentTitle} accessibilityRole="header">{item.title}</Text>
      <Text style={styles.contentBody}>{item.body}</Text>
    </View>
  );
}

function contentLabel(type: HomeContent['contentType']): string {
  switch (type) {
    case 'article': return 'KUNSKAP';
    case 'guide': return 'GUIDE';
    case 'checklist': return 'CHECKLISTA';
    case 'training_program': return 'TRÄNING';
  }
}

function LoadingScreen({ label, compact = false }: { label: string; compact?: boolean }) {
  if (compact) {
    return <View style={styles.compactLoading}><ActivityIndicator color={theme.colors.accent} /><Text style={styles.loadingText}>{label}</Text></View>;
  }
  return (
    <AppScreen>
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText} accessibilityLiveRegion="polite">{label}</Text>
      </View>
    </AppScreen>
  );
}

function UnavailableScreen() {
  return <AppScreen><PageHeading title="Tassla vilar en stund" description="Inloggningen är inte tillgänglig just nu. Försök igen senare." /></AppScreen>;
}

function ProfileLoadError({ onRetry }: { onRetry: () => void }) {
  return <AppScreen>
    <PageHeading title="Vi kunde inte öppna profilen" description="Kontrollera anslutningen och försök hämta profilen igen." />
    <PrimaryButton title="Försök igen" onPress={onRetry} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  loadingPage: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  compactLoading: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  loadingText: { color: theme.colors.mutedText, fontSize: 15, marginTop: 12 },
  homeHeader: { marginTop: 42, marginBottom: 24 },
  homeEyebrow: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: '#DCE9DD', paddingHorizontal: 12, paddingVertical: 6 },
  homeEyebrowText: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  homeTitle: { color: theme.colors.text, fontSize: 36, fontWeight: '800', lineHeight: 44, letterSpacing: -0.8, marginTop: 14 },
  homeSubtitle: { color: theme.colors.mutedText, fontSize: 16, marginTop: 5 },
  dogCard: { minHeight: 112, borderRadius: theme.radius.card, backgroundColor: theme.colors.accent, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 34 },
  pawCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B805F' },
  pawText: { color: '#FFF0D2', fontSize: 30, lineHeight: 34, fontWeight: '700' },
  dogCardCopy: { flex: 1 },
  dogCardTitle: { color: theme.colors.onAccent, fontSize: 19, fontWeight: '800' },
  dogCardSubtitle: { color: '#DDECE2', fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionTitle: { color: theme.colors.text, fontSize: 21, fontWeight: '800', marginBottom: 12 },
  contentCard: { borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 19, marginTop: 12 },
  contentType: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  contentTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800', marginTop: 8 },
  contentBody: { color: theme.colors.mutedText, fontSize: 16, lineHeight: 24, marginTop: 10 },
});
