import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { AppBar, BottomSheet, Button, HeroCard, ListRow, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
import { MotionPressable, useReducedMotion } from '../../components/ui/Motion';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { completeReviewTrainingStep, completeTrainingStepForMode, isReviewTrainingProgram, resetReviewTrainingProgram, undoReviewTrainingStep } from './review-training-state';
import { tokens } from '../../theme/tokens';

export function PublishedTrainingScreen({ programs, paused, busyStepKey, error, onCompleteStep, onContinue, onResetProgram, onUndoStep, onFocusProgram, onRetry, reviewMode = false }: {
  programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  reviewMode?: boolean;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<{ programId: string; stepId: string } | false>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onUndoStep: (program: PublishedTrainingProgram, stepId: string) => Promise<boolean>; onFocusProgram: () => void; onRetry: () => void;
}) {
  const [tab, setTab] = useState('Valpprogram');
  const [programId, setProgramId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [reviewCompleted, setReviewCompleted] = useState<Record<string, string[]>>({});
  const [animateCompleteTarget, setAnimateCompleteTarget] = useState<{ key: string; programId: string; stepId: string } | null>(null);
  const [celebrationKey, setCelebrationKey] = useState<string | null>(null);
  const animationSequence = useRef(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const reducedMotion = useReducedMotion();
  const visiblePrograms = reviewMode ? programs.map((program) => ({ ...program, completedStepIds: reviewCompleted[program.id] ?? program.completedStepIds })) : programs;
  const active = visiblePrograms.find((program) => program.id === programId) ?? visiblePrograms[0];
  const selectedProgram = visiblePrograms.find((program) => program.id === selection?.programId);
  const selectedStep = selectedProgram?.steps.find((step) => step.id === selection?.stepId);
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));
  const consumeCompletionAnimation = useCallback((key: string) => {
    setAnimateCompleteTarget((current) => current?.key === key ? null : current);
  }, []);
  const finishCelebration = useCallback((key: string) => {
    setCelebrationKey((current) => current === key ? null : current);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function complete() {
    if (pending.current || busyStepKey || !selectedProgram || !selectedStep) return;
    pending.current = true;
    try {
      const completion = await completeTrainingStepForMode(
        selectedProgram.id,
        reviewMode,
        () => {
          setReviewCompleted((current) => completeReviewTrainingStep(current, selectedProgram.id, selectedStep.id));
          if (!reducedMotion) setCelebrationKey(`${selectedProgram.id}:${selectedStep.id}:${++animationSequence.current}`);
          setSelection(null); onContinue();
        },
        () => onCompleteStep(selectedProgram, selectedStep.id),
      );
      if (!mounted.current) return;
      if (completion.kind === 'review') return;
      const confirmed = completion.value;
      if (confirmed && confirmed.programId === selectedProgram.id && confirmed.stepId === selectedStep.id) {
        const key = `${confirmed.programId}:${confirmed.stepId}:${++animationSequence.current}`;
        setAnimateCompleteTarget({ key, programId: confirmed.programId, stepId: confirmed.stepId });
        if (!reducedMotion) setCelebrationKey(key);
        setSelection(null); onContinue();
      }
    } finally { if (mounted.current) pending.current = false; }
  }
  function undo(program: PublishedTrainingProgram, stepId: string) {
    if (reviewMode && isReviewTrainingProgram(program.id)) {
      setReviewCompleted((current) => undoReviewTrainingStep(current, program.id, stepId));
      setSelection(null);
      return;
    }
    void onUndoStep(program, stepId).then((saved) => { if (saved && mounted.current) setSelection(null); });
  }
  function rows(program: PublishedTrainingProgram) {
    return <View style={styles.rows}>{program.steps.map((step) => <ListRow key={step.id} category="training" title={step.title} titleSize="compact"
      complete={program.completedStepIds.includes(step.id)} animateCompleteKey={animateCompleteTarget?.programId === program.id && animateCompleteTarget.stepId === step.id ? animateCompleteTarget.key : undefined} onCompleteAnimationStart={consumeCompletionAnimation}
      onPress={() => setSelection({ programId: program.id, stepId: step.id })} />)}</View>;
  }
  return <View>
    <AppBar mode="Title" title="Träning" />
    <Tabs items={['Valpprogram', 'Alla övningar', 'Framsteg']} active={tab} onChange={setTab} />
    <View style={styles.content}>
      {reviewMode ? <Text style={styles.note}>Tillfälligt exempel – innehållet är inte sakgranskat. Markeringar i dessa övningsutkast sparas under den här visningen.</Text> : null}
      <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
      {paused.map((item) => <Text key={item.versionId} style={styles.note}>Ett tidigare program är pausat. Dina {item.completedCount} genomförda steg finns kvar.</Text>)}
      {visiblePrograms.length === 0 ? <><HeroCard title="Träning i er takt" meta="Här samlas övningarna för din hund." /><Text style={styles.note}>Fler program kommer när de är färdiga att använda.</Text></> : null}
      {tab === 'Valpprogram' && active ? <>
      <HeroCard title={active.title} meta="Ett steg i taget">
        <View style={styles.progress}><Progress light value={percentage(active)} label={`${active.completedStepIds.length} av ${active.steps.length} genomförda`} /></View>
      </HeroCard>
      <SectionHeader title="Övningar" />
      {rows(active)}
      <Button variant="tertiary" label="Om programmet" accessibilityLabel="Läs om programmet och dess källor" onPress={() => setSelection({ programId: active.id, stepId: '' })} />
      {programs.length > 1 ? <><SectionHeader title="Fler program" /><View style={styles.programGrid}>{programs.filter((program) => program.id !== active.id).map((program) => <ProgramCard key={program.id} program={program} onPress={() => { setProgramId(program.id); onFocusProgram(); }} />)}</View></> : null}
      </> : null}
      {tab === 'Alla övningar' ? visiblePrograms.map((program) => <View key={program.id}><SectionHeader title={`${program.title} · Övningar`} />{rows(program)}</View>) : null}
      {tab === 'Framsteg' ? visiblePrograms.map((program) => <View key={program.id} style={styles.progressCard}>
      <Text style={styles.heading}>{program.title}</Text><Progress value={percentage(program)} label={`${program.completedStepIds.length} av ${program.steps.length} genomförda`} />
      {program.completedStepIds.length ? <Button variant="destructive" label="Börja om" accessibilityLabel={`Börja om med ${program.title}`} disabled={Boolean(busyStepKey)} onPress={() => Alert.alert('Börja om?', `Dina markeringar i ”${program.title}” tas bort.`, [{ text: 'Avbryt', style: 'cancel' }, { text: 'Börja om', style: 'destructive', onPress: () => reviewMode && isReviewTrainingProgram(program.id) ? setReviewCompleted((current) => resetReviewTrainingProgram(current, program.id)) : onResetProgram(program) }])} /> : null}
      </View>) : null}
      <BottomSheet visible={Boolean(selectedProgram)} title={selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey) setSelection(null); }}>
      <Text style={styles.heading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      <Text style={styles.body}>{selectedStep?.instruction ?? selectedProgram?.body}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep ? <><SectionHeader title="Källor" />{selectedProgram?.sources.map((source) => <Text key={source} style={styles.note}>{source}</Text>)}</> : null}
      <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
      {selectedStep && selectedProgram?.completedStepIds.includes(selectedStep.id) ? <>
        <Text style={styles.note}>Genomförd. Ni kan gärna öva igen.</Text>
        <Button variant="secondary" label="Markera som ej genomförd" accessibilityLabel="Markera som ej genomförd" loading={busyStepKey === `${selectedProgram.id}:${selectedStep.id}:undo`} disabled={Boolean(busyStepKey)} onPress={() => undo(selectedProgram, selectedStep.id)} />
      </> : selectedStep ? <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Button label="Markera som genomförd" accessibilityLabel="Markera övningen som genomförd" loading={Boolean(busyStepKey)} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
      </> : null}
      </BottomSheet>
      <ConfettiBurst eventKey={celebrationKey} reducedMotion={reducedMotion} onFinished={finishCelebration} />
    </View>
  </View>;
}

const PROGRAM_IMAGES: readonly ImageSourcePropType[] = [
  require('../../../assets/images/puppy-training.png'),
  require('../../../assets/images/puppy-resting-carousel.png'),
  require('../../../assets/images/puppy-water.png'),
];

function ProgramCard({ program, onPress }: { program: PublishedTrainingProgram; onPress: () => void }) {
  const image = programImage(program.content_id);
  const completed = program.completedStepIds.length;
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`Program ${program.title}, ${completed} av ${program.steps.length} övningar genomförda`} onPress={onPress} style={styles.programCard}>
    <Image source={image} style={styles.programImage} resizeMode="cover" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    <View style={styles.programCopy}>
      <Text style={styles.programLabel}>Program</Text>
      <Text style={styles.programTitle}>{program.title}</Text>
      <Text style={styles.programMeta}>{completed} av {program.steps.length} övningar genomförda</Text>
    </View>
  </MotionPressable>;
}

function programImage(contentId: string): ImageSourcePropType {
  let hash = 0;
  for (let index = 0; index < contentId.length; index += 1) hash = (hash * 31 + contentId.charCodeAt(index)) >>> 0;
  return PROGRAM_IMAGES[hash % PROGRAM_IMAGES.length];
}

const CONFETTI_PARTICLES = [
  { x: -2, y: 1, color: tokens.colors.category.pee.fg },
  { x: -1, y: -1, color: tokens.colors.success },
  { x: 0, y: 2, color: tokens.colors.warning },
  { x: 1, y: -2, color: tokens.colors.category.poop.fg },
  { x: 2, y: 0, color: tokens.colors.primary },
  { x: -2, y: -1, color: tokens.colors.warning },
  { x: 1, y: 1, color: tokens.colors.category.pee.fg },
  { x: 2, y: -2, color: tokens.colors.success },
] as const;

function ConfettiBurst({ eventKey, reducedMotion, onFinished }: { eventKey: string | null; reducedMotion: boolean; onFinished: (key: string) => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    progress.stopAnimation();
    if (!eventKey || reducedMotion) { progress.setValue(0); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: tokens.motion.check, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) onFinished(eventKey); });
    return () => animation.stop();
  }, [eventKey, onFinished, progress, reducedMotion]);
  if (!eventKey || reducedMotion) return null;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.confettiLayer}>
    {CONFETTI_PARTICLES.map((particle, index) => {
      const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x * tokens.spacing.lg] });
      const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y * tokens.spacing.xl] });
      const opacity = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] });
      const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${particle.x * 90 + particle.y * 45}deg`] });
      return <Animated.View key={`${eventKey}:${index}`} style={[styles.confettiParticle, { backgroundColor: particle.color, opacity, transform: [{ translateX }, { translateY }, { rotate }] }]} />;
    })}
  </View>;
}

function percentage(program: PublishedTrainingProgram) { return program.steps.length ? program.completedStepIds.length / program.steps.length * 100 : 0; }
const styles = StyleSheet.create({
  content: { paddingTop: tokens.layout.sectionGap, gap: tokens.spacing.md },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md },
  programCard: { flexBasis: '47%', flexGrow: 1, flexShrink: 1, overflow: 'hidden', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, minHeight: tokens.size.touchMin },
  programImage: { width: '100%', height: tokens.size.quickLogHeight },
  programCopy: { padding: tokens.spacing.md, gap: tokens.spacing.xs },
  programLabel: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  programTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  programMeta: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  confettiLayer: { position: 'absolute', top: tokens.layout.cardPadding, left: 0, right: 0, height: tokens.size.chipLg, alignItems: 'center', zIndex: 2 },
  confettiParticle: { position: 'absolute', left: '50%', top: 0, width: tokens.spacing.xs, height: tokens.spacing.sm, borderRadius: tokens.size.stroke },
  rows: { gap: tokens.spacing.xs }, progress: { marginTop: tokens.spacing.sm },
  progressCard: { backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, padding: tokens.spacing.lg, gap: tokens.spacing.md, marginBottom: tokens.spacing.md },
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary }, body: { ...tokens.typography.body, color: tokens.colors.textPrimary }, note: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.md },
});
