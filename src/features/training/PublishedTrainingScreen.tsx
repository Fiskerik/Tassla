import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button, ChecklistItem, EmptyState, HeroCard, InfoBanner, Progress, SectionHeader, Skeleton } from '../../components/ui';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';

export function PublishedTrainingScreen({
  programs,
  paused,
  busyStepKey,
  error,
  onCompleteStep,
  onContinue,
  onResetProgram,
  onRetry,
  loadState = 'ready',
}: {
  programs: readonly PublishedTrainingProgram[];
  paused: readonly PausedTrainingProgress[];
  busyStepKey: string | null;
  error: string;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<boolean>;
  onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void;
  onRetry: () => void;
  loadState?: 'loading' | 'ready' | 'error';
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<{ programId: string; stepId: string } | null>(null);
  const pending = useRef(false);

  async function complete(program: PublishedTrainingProgram, stepId: string) {
    if (pending.current || busyStepKey || acknowledged) return;
    pending.current = true;
    try {
      if (await onCompleteStep(program, stepId)) setAcknowledged({ programId: program.id, stepId });
    } finally {
      pending.current = false;
    }
  }

  function continueAfterSave() {
    if (!acknowledged) return;
    setAcknowledged(null);
    onContinue();
  }

  if (loadState === 'loading') return <View><Skeleton shape="card" lines={3} /></View>;

  return (
    <View>
      <Text style={styles.caption}>Allmän vägledning: anpassa efter din hund. Registrering visar vad du markerat, inte vad hunden behärskar.</Text>
      {error
        ? <InfoBanner action={<Button label="Försök igen" accessibilityLabel="Försök igen" variant="secondary" onPress={onRetry} />}>{error}</InfoBanner>
        : paused.length > 0 ? <InfoBanner>En tidigare programversion har registrerade steg men är pausad. Historiken har inte flyttats eller raderats.</InfoBanner> : null}
      {!error && programs.length === 0 && paused.length === 0 && (
        <EmptyState title="Inget träningsprogram ännu" actionLabel="Försök igen" onAction={onRetry} />
      )}
      {programs.map((program) => {
        const isOpen = openProgramId === program.id;
        const completed = new Set(program.completedStepIds);
        const nextStep = program.steps.find((step) => !completed.has(step.id));
        const allComplete = program.steps.length > 0 && !nextStep;
        const waiting = acknowledged?.programId === program.id;
        return (
          <View key={program.id} style={styles.programCard}>
            <HeroCard title={program.title} meta={program.body} />
            {program.sources.length > 0 && <View style={styles.sources}>
              <Text style={styles.sourceHeading}>Källor</Text>
              {program.sources.map((source, index) => <Text key={`${index}-${source}`} style={styles.sourceText}>{source}</Text>)}
            </View>}
            <View style={styles.progressGroup}>
              <Text style={styles.progressHeading}>Progress</Text>
              <Progress value={program.steps.length ? completed.size / program.steps.length * 100 : 0} label={`${completed.size} av ${program.steps.length} steg registrerade`} />
            </View>
            {allComplete && <Text style={styles.caption}>Alla steg är registrerade. Det betyder inte att hunden är färdigtränad.</Text>}
            <Button label={isOpen ? 'Dölj övningar' : 'Visa övningar'} accessibilityLabel={isOpen ? 'Dölj övningar' : 'Visa övningar'} variant="tertiary" onPress={() => setOpenProgramId(isOpen ? null : program.id)} />
            {isOpen && <View style={styles.details}>
              <SectionHeader title="Veckans övningar" />
              {program.steps.length === 0 && <Text style={styles.caption}>Programmet har inga publicerade steg ännu.</Text>}
              {program.steps.map((step, index) => {
                const isComplete = completed.has(step.id);
                const isCurrent = nextStep?.id === step.id;
                return (
                  <View key={step.id} style={[styles.stepCard, isComplete && styles.completedStep]}>
                    <Text style={styles.stepNumber}>Steg {index + 1}</Text>
                    <ChecklistItem
                      label={step.title}
                      checked={isComplete}
                      disabled={!isCurrent || Boolean(busyStepKey) || Boolean(waiting)}
                      onPress={() => { void complete(program, step.id); }}
                    />
                    <Text style={styles.body}>{step.instruction}</Text>
                    {busyStepKey === `${program.id}:${step.id}` && <Text style={styles.saving}>Sparar…</Text>}
                  </View>
                );
              })}
              {waiting && <View>
                <Text style={styles.caption}>Steget är registrerat på ditt konto. Det visar inte att hunden behärskar beteendet.</Text>
                <Button label={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} accessibilityLabel={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} onPress={continueAfterSave} />
              </View>}
              <Button label={busyStepKey === `${program.id}:reset` ? 'Rensar…' : 'Rensa registrerade steg'} accessibilityLabel="Rensa registrerade steg" variant="tertiary" disabled={Boolean(busyStepKey)} onPress={() => confirmReset(program, (selected) => { onResetProgram(selected); setAcknowledged(null); })} />
            </View>}
          </View>
        );
      })}
    </View>
  );
}

function confirmReset(program: PublishedTrainingProgram, onReset: (program: PublishedTrainingProgram) => void) {
  Alert.alert('Rensa registrerade steg?', `Registreringarna för ”${program.title}” tas bort från ditt konto.`, [
    { text: 'Avbryt', style: 'cancel' },
    { text: 'Rensa', style: 'destructive', onPress: () => onReset(program) },
  ]);
}

const styles = StyleSheet.create({
  caption: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginTop: tokens.spacing.md, marginBottom: tokens.spacing.sm },
  programCard: {
    alignSelf: 'stretch',
    borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.layout.cardPadding,
    marginTop: tokens.layout.sectionGap,
  },
  progressGroup: {
    alignSelf: 'stretch',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.selectedSurface,
    padding: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  progressHeading: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700', marginBottom: tokens.spacing.sm },
  details: { marginTop: tokens.spacing.md, gap: tokens.spacing.sm },
  stepCard: {
    alignSelf: 'stretch',
    borderRadius: tokens.radius.md,
    borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
  },
  completedStep: { borderColor: tokens.colors.success, backgroundColor: tokens.colors.successSurface },
  stepNumber: { ...tokens.typography.caption, color: tokens.colors.primary, fontWeight: '700' },
  body: { ...tokens.typography.body, color: tokens.colors.textSecondary, marginTop: tokens.spacing.sm },
  saving: { ...tokens.typography.caption, color: tokens.colors.textSecondary },
  sources: {
    borderTopWidth: tokens.size.stroke,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  sourceHeading: { ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700' },
  sourceText: { ...tokens.typography.caption, color: tokens.colors.primary, marginTop: tokens.spacing.xs },
});
