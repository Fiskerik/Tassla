import { useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, LayoutAnimation, StyleSheet, Text, View } from 'react-native';
import { ChecklistItem, HeroCard, SectionHeader } from '../../components/ui';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { tokens } from '../../theme/tokens';
import { TRAINING_NOTICE, TRAINING_PROGRESS_CAVEAT, TRAINING_PROGRAMS, type TrainingProgram } from './training-model';

export function TrainingScreen({
  initialProgramId,
  completedByProgram,
  acknowledgedStep,
  onCompleteStep,
  onContinue,
  onResetProgram,
}: {
  initialProgramId: string;
  completedByProgram: Record<string, readonly string[]>;
  acknowledgedStep: { programId: string; stepId: string } | null;
  onCompleteStep: (program: TrainingProgram, stepId: string) => void;
  onContinue: () => void;
  onResetProgram: (program: TrainingProgram) => void;
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(initialProgramId);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  function toggleProgram(programId: string) {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenProgramId((currentId) => currentId === programId ? null : programId);
  }

  return (
    <View>
      <PageHeading title="Träning" description="Små steg som bygger på frivillighet och belöning." />
      <View style={styles.previewLabel}><Text style={styles.previewLabelText}>TESTINNEHÅLL · LOKAL FÖRHANDSVISNING</Text></View>
      <MessageCard>{TRAINING_NOTICE}</MessageCard>
      {TRAINING_PROGRAMS.map((program) => {
        const isOpen = openProgramId === program.id;
        const completed = completedByProgram[program.id] ?? [];
        const nextStep = program.steps.find((step) => !completed.includes(step.id));
        const waitingForContinue = acknowledgedStep?.programId === program.id;
        return (
          <View key={`${program.id}-v${program.version}`} style={styles.programCard}>
            <HeroCard title={program.title} meta={program.introduction} />
            {program.audience && <Text style={styles.audience}>{program.audience}</Text>}
            <View style={styles.progressGroup}>
              <Text style={styles.progressHeading}>VECKANS FOKUS</Text>
              <Text style={styles.progress}>{completed.length} av {program.steps.length} steg genomförda</Text>
              <View style={styles.progressTrack} accessibilityElementsHidden><View style={[styles.progressFill, { width: `${program.steps.length ? Math.min(100, completed.length / program.steps.length * 100) : 0}%` }]} /></View>
            </View>
            {completed.length === program.steps.length && (
              <MessageCard>Alla steg är registrerade i testläget. Det säger inget om hundens färdighet. Läs stegen igen eller rensa programmets registreringar.</MessageCard>
            )}
            <QuietButton
              title={isOpen ? 'Dölj program' : completed.length ? 'Fortsätt eller läs igen' : 'Visa program'}
              onPress={() => toggleProgram(program.id)}
            />
            {isOpen && (
              <View style={styles.programDetails}>
                <SectionHeader title="Veckans övningar" />
                <MessageCard tone="error">{program.stopText}</MessageCard>
                {program.steps.map((step, index) => {
                  const isCompleted = completed.includes(step.id);
                  const isCurrent = !isCompleted && nextStep?.id === step.id;
                  return (
                    <View key={step.id} style={[styles.stepCard, isCompleted && styles.completedStep]}>
                      <Text style={styles.stepNumber}>Steg {index + 1}</Text>
                      <ChecklistItem label={step.title} checked={isCompleted} disabled={!isCurrent || waitingForContinue} onPress={() => onCompleteStep(program, step.id)} />
                      <Text style={styles.body}>{step.body}</Text>
                    </View>
                  );
                })}
                {waitingForContinue && (
                  <View>
                    <MessageCard>Steget är registrerat i testläget. Registreringen visar inte att hunden behärskar beteendet.</MessageCard>
                    <PrimaryButton title={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} onPress={onContinue} />
                  </View>
                )}
                <MessageCard>{TRAINING_PROGRESS_CAVEAT}</MessageCard>
                <View style={styles.sourceCard}>
                  <Text style={styles.sourceLabel}>Källa</Text>
                  <Text style={styles.sourceTitle}>{program.sourceTitle}</Text>
                  <Text selectable style={styles.sourceUrl}>{program.sourceUrl}</Text>
                  <Text style={styles.limitation}>{program.limitation}</Text>
                </View>
                <QuietButton title="Rensa programmets registreringar" onPress={() => confirmReset(program, onResetProgram)} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function confirmReset(program: TrainingProgram, onReset: (program: TrainingProgram) => void) {
  Alert.alert(
    'Rensa registrerade steg?',
    `Registreringarna för ”${program.title}” tas bort från den här förhandsvisningen.`,
    [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Rensa', style: 'destructive', onPress: () => onReset(program) },
    ],
  );
}

const styles = StyleSheet.create({
  previewLabel: { alignSelf: 'flex-start', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, marginBottom: tokens.spacing.md },
  previewLabelText: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  programCard: { alignSelf: 'stretch', borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface, padding: tokens.layout.cardPadding, marginTop: tokens.layout.sectionGap },
  audience: { ...tokens.typography.caption, color: tokens.colors.warning, backgroundColor: tokens.colors.warningSurface, overflow: 'hidden', alignSelf: 'flex-start', borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.md, paddingVertical: tokens.spacing.sm, marginTop: tokens.spacing.md },
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  progressGroup: { borderRadius: tokens.radius.md, backgroundColor: tokens.colors.selectedSurface, padding: tokens.spacing.md, marginTop: tokens.spacing.md },
  progressHeading: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  progress: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  progressTrack: { height: tokens.size.progress, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border, overflow: 'hidden', marginTop: tokens.spacing.sm },
  progressFill: { height: tokens.size.progress, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.success },
  programDetails: { marginTop: tokens.spacing.md, gap: tokens.spacing.sm },
  stepCard: { alignSelf: 'stretch', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface, padding: tokens.spacing.md, gap: tokens.spacing.xs },
  completedStep: { borderColor: tokens.colors.success, backgroundColor: tokens.colors.successSurface },
  stepNumber: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  sourceCard: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.md, marginTop: tokens.spacing.md },
  sourceLabel: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700' },
  sourceTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, marginTop: tokens.spacing.xs },
  sourceUrl: { ...tokens.typography.caption, color: tokens.colors.primary, marginTop: tokens.spacing.xs },
  limitation: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
});
