import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
import type { Dog } from '../onboarding/dog';
import { HealthScreen } from '../health/HealthScreen';
import { KnowledgeScreen } from '../knowledge/KnowledgeScreen';
import { DraftContentPreview, DRAFT_PREVIEW_ENABLED } from '../knowledge/DraftContentPreview';
import { LogScreen } from '../puppy-log/LogScreen';
import { addLogEvent, createLogEvent, createSampleLogEvents, updateLogEvent, deleteLogEvent, type LogEvent, type LogEventChanges, type LogEventType } from '../puppy-log/log-model';
import { PassportScreen } from '../passport/PassportScreen';
import { TrainingScreen } from '../training/TrainingScreen';
import { completeNextStep, getCompletedStepIds, resetProgramProgress, TRAINING_PROGRAMS, type TrainingCompletion, type TrainingProgram } from '../training/training-model';
import { PreviewHomeScreen } from './PreviewHomeScreen';
import { PreviewProfileScreen } from './PreviewProfileScreen';

type Screen = 'home' | 'log' | 'training' | 'more' | 'health' | 'knowledge' | 'passport' | 'profile' | 'drafts';
type MainTab = 'home' | 'log' | 'training' | 'more';

export function DevelopmentPreview() {
  const [dog, setDog] = useState<Dog>(() => createSyntheticDog());
  const [screen, setScreen] = useState<Screen>('home');
  const [logEvents, setLogEvents] = useState<LogEvent[]>(() => createSampleLogEvents(dog.id));
  const [trainingCompletions, setTrainingCompletions] = useState<TrainingCompletion[]>([]);
  const [acknowledgedStep, setAcknowledgedStep] = useState<{ programId: string; stepId: string } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [pageOpacity] = useState(() => new Animated.Value(1));
  const nextLogId = useRef(0);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    pageOpacity.stopAnimation();
    if (reduceMotion) {
      pageOpacity.setValue(1);
      return;
    }
    pageOpacity.setValue(0);
    Animated.timing(pageOpacity, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    return () => pageOpacity.stopAnimation();
  }, [pageOpacity, reduceMotion, screen]);

  function addEvent(type: LogEventType) {
    const now = new Date();
    const event = createLogEvent({
      id: `${dog.id}-local-${++nextLogId.current}`,
      dogId: dog.id,
      type,
      occurredAt: now.toISOString(),
      origin: 'local-test',
    }, now);
    setLogEvents((current) => addLogEvent(current, event));
  }

  function editEvent(id: string, changes: LogEventChanges): boolean {
    try {
      setLogEvents(updateLogEvent(logEvents, id, changes));
      return true;
    } catch {
      return false;
    }
  }

  function removeEvent(id: string) {
    setLogEvents((current) => deleteLogEvent(current, id));
  }

  function completeTrainingStep(program: TrainingProgram, stepId: string) {
    const updated = completeNextStep(
      trainingCompletions,
      dog.id,
      program.id,
      program.version,
      stepId,
      program.steps.map((step) => step.id),
    );
    if (updated.length === trainingCompletions.length) return;
    setTrainingCompletions(updated);
    setAcknowledgedStep({ programId: program.id, stepId });
  }

  function clearProgramProgress(program: TrainingProgram) {
    setTrainingCompletions((current) => resetProgramProgress(current, dog.id, program.id, program.version));
    setAcknowledgedStep((current) => current?.programId === program.id ? null : current);
  }

  const completedByProgram = Object.fromEntries(
    TRAINING_PROGRAMS.map((program) => [
      program.id,
      getCompletedStepIds(trainingCompletions, dog.id, program.id, program.version),
    ]),
  );
  const trainingTarget = TRAINING_PROGRAMS.map((program) => {
    const completed = completedByProgram[program.id] ?? [];
    return { program, completed, nextStep: program.steps.find((step) => !completed.includes(step.id)) };
  }).find((item) => item.nextStep) ?? null;

  function navigateBack() {
    setScreen(screen === 'profile' ? 'home' : 'more');
  }

  let page;
  switch (screen) {
    case 'home':
      page = (
        <PreviewHomeScreen
          dog={dog}
          onEditProfile={() => setScreen('profile')}
          onOpenLog={() => setScreen('log')}
          onOpenTraining={() => setScreen('training')}
          trainingShortcut={trainingTarget ? {
            programTitle: trainingTarget.program.title,
            stepTitle: trainingTarget.nextStep!.title,
            stepNumber: trainingTarget.program.steps.findIndex((step) => step.id === trainingTarget.nextStep!.id) + 1,
            completedCount: trainingTarget.completed.length,
            totalCount: trainingTarget.program.steps.length,
          } : null}
        />
      );
      break;
    case 'log':
      page = <LogScreen events={logEvents} onAdd={addEvent} onUpdate={editEvent} onDelete={removeEvent} />;
      break;
    case 'training':
      page = (
        <TrainingScreen
          initialProgramId={trainingTarget?.program.id ?? TRAINING_PROGRAMS[0].id}
          completedByProgram={completedByProgram}
          acknowledgedStep={acknowledgedStep}
          onCompleteStep={completeTrainingStep}
          onContinue={() => setAcknowledgedStep(null)}
          onResetProgram={clearProgramProgress}
        />
      );
      break;
    case 'more':
      page = <MoreScreen onOpenHealth={() => setScreen('health')} onOpenKnowledge={() => setScreen('knowledge')} onOpenPassport={() => setScreen('passport')} onOpenDrafts={DRAFT_PREVIEW_ENABLED ? () => setScreen('drafts') : undefined} />;
      break;
    case 'health':
      page = <HealthScreen onBack={navigateBack} />;
      break;
    case 'knowledge':
      page = <KnowledgeScreen onBack={navigateBack} />;
      break;
    case 'passport':
      page = <PassportScreen onBack={navigateBack} />;
      break;
    case 'profile':
      page = <PreviewProfileScreen dog={dog} onCancel={navigateBack} onSave={(updated) => { setDog(updated); setScreen('home'); }} />;
      break;
    case 'drafts':
      page = <DraftContentPreview onBack={navigateBack} />;
      break;
  }

  const activeTab: MainTab = screen === 'health' || screen === 'knowledge' || screen === 'passport' || screen === 'drafts'
    ? 'more'
    : screen === 'profile' ? 'home' : screen;
  return (
    <AppScreen key={screen} footer={<PreviewTabBar active={activeTab} onSelect={setScreen} />}>
      <Animated.View style={{ opacity: pageOpacity }}>
        <View style={styles.previewTag}>
          <Text style={styles.previewTagText}>LOKALT TESTLÄGE · SYNTETISKA UPPGIFTER</Text>
        </View>
        {page}
      </Animated.View>
    </AppScreen>
  );
}

function MoreScreen({
  onOpenHealth,
  onOpenKnowledge,
  onOpenPassport,
  onOpenDrafts,
}: {
  onOpenHealth: () => void;
  onOpenKnowledge: () => void;
  onOpenPassport: () => void;
  onOpenDrafts?: () => void;
}) {
  return (
    <View>
      <PreviewHeading title="Mer" description="Fler delar av Tassla." />
      <PreviewMenuItem title="Hälsa" description="Visuell grund" onPress={onOpenHealth} />
      <PreviewMenuItem title="Kunskap" description="Visuell grund" onPress={onOpenKnowledge} />
      <PreviewMenuItem title="Tassla-pass" description="Visuell grund" onPress={onOpenPassport} />
      {onOpenDrafts && <PreviewMenuItem title="Utkast för granskning" description="Endast utvecklarläge · ej publicerat" onPress={onOpenDrafts} />}
    </View>
  );
}

function PreviewHeading({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingTitle} accessibilityRole="header">{title}</Text>
      <Text style={styles.headingDescription}>{description}</Text>
    </View>
  );
}

function PreviewMenuItem({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron} accessibilityElementsHidden>›</Text>
    </Pressable>
  );
}

function PreviewTabBar({ active, onSelect }: { active: MainTab; onSelect: (tab: MainTab) => void }) {
  const tabs: { id: MainTab; label: string }[] = [
    { id: 'home', label: 'Hem' },
    { id: 'log', label: 'Logg' },
    { id: 'training', label: 'Träning' },
    { id: 'more', label: 'Mer' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(tab.id)}
            style={({ pressed }) => [styles.tab, selected && styles.selectedTab, pressed && styles.pressed]}
          >
            <Text style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createSyntheticDog(): Dog {
  const birthDate = new Date();
  birthDate.setDate(birthDate.getDate() - 56);
  const year = birthDate.getFullYear();
  const month = String(birthDate.getMonth() + 1).padStart(2, '0');
  const day = String(birthDate.getDate()).padStart(2, '0');
  return {
    id: 'synthetic-dog-1',
    name: 'Exempelhund',
    breedId: 'example',
    birthDate: `${year}-${month}-${day}`,
  };
}

const styles = StyleSheet.create({
  previewTag: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: '#DCE9DD', paddingHorizontal: 11, paddingVertical: 7, marginTop: 18 },
  previewTagText: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  heading: { marginTop: 36, marginBottom: 22 },
  headingTitle: { color: theme.colors.text, fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
  headingDescription: { color: theme.colors.mutedText, fontSize: 16, lineHeight: 23, marginTop: 8 },
  menuItem: { minHeight: 68, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  menuDescription: { color: theme.colors.mutedText, fontSize: 13, marginTop: 4 },
  chevron: { color: theme.colors.accent, fontSize: 26, paddingLeft: 12 },
  tabBar: { width: '100%', minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingVertical: 5 },
  tab: { minWidth: 64, minHeight: 48, borderRadius: 16, flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  selectedTab: { backgroundColor: '#E5EFE8' },
  tabLabel: { color: theme.colors.mutedText, fontSize: 12, fontWeight: '700' },
  selectedTabLabel: { color: theme.colors.accent, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
