import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, ChecklistItem, EmptyState, ErrorState, HeroCard, Progress, SectionHeader, Skeleton, Tabs } from '../../components/ui';
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
  onBack,
  loading = false,
}: {
  programs: readonly PublishedTrainingProgram[];
  paused: readonly PausedTrainingProgress[];
  busyStepKey: string | null;
  error: string;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<boolean>;
  onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void;
  onRetry: () => void;
  onBack?: () => void;
  loading?: boolean;
}) {
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<{ programId: string; stepId: string } | null>(null);
  const [activeTab, setActiveTab] = useState('Valpprogram');
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

  return (
    <View>
      <AppBar mode="Back" title="Träning" onAction={onBack} />
      <Tabs items={['Valpprogram', 'Alla övningar', 'Mina mål']} active={activeTab} onChange={setActiveTab} />
      {loading ? <>
        <Skeleton shape="card" />
        <Skeleton shape="row" lines={4} />
      </> : activeTab !== 'Valpprogram' ? <EmptyState title={activeTab === 'Alla övningar' ? 'Inga andra övningar ännu' : 'Inga mål ännu'} description="Det här läget visar innehåll när det finns i ditt träningsprogram." /> : <>
      <HeroCard title="Små steg, lugna stunder" meta="Bygg progression med frivillighet och belöning." />
      <MessageCard>Allmän träningsvägledning. Anpassa efter din hund. Du kan alltid pausa eller gå tillbaka. Registrering visar vad du markerat, inte vad hunden behärskar.</MessageCard>
      {error ? <ErrorState title="Träningen kunde inte uppdateras" description={error} actionLabel="Försök igen" onRetry={onRetry} /> : null}
      {paused.map((item) => (
        <MessageCard key={item.versionId} tone="error">
          En tidigare programversion har {item.completedCount} registrerade steg men är pausad. Historiken har inte flyttats eller raderats.
        </MessageCard>
      ))}
      {!error && programs.length === 0 && paused.length === 0 && (
        <MessageCard>Det finns inga publicerade träningsprogram som passar just nu. Fler granskade program visas här när de publiceras.</MessageCard>
      )}
      {programs.map((program) => {
        const isOpen = openProgramId === program.id;
        const completed = new Set(program.completedStepIds);
        const nextStep = program.steps.find((step) => !completed.has(step.id));
        const allComplete = program.steps.length > 0 && !nextStep;
        const waiting = acknowledged?.programId === program.id;
        return (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.focusCard}>
              <Text style={styles.focusEyebrow}>VECKANS FOKUS</Text>
              <Text style={styles.programTitle} accessibilityRole="header">{program.title}</Text>
              <Text style={styles.focusBody}>{program.body}</Text>
            </View>
            {program.sources.length > 0 && <View style={styles.sources}>
              <Text style={styles.sourceHeading}>Källor</Text>
              {program.sources.map((source, index) => <Text key={`${index}-${source}`} style={styles.sourceText}>{source}</Text>)}
            </View>}
            <View style={styles.progressGroup}>
              <Text style={styles.progressHeading}>STEG</Text>
              <Progress value={program.steps.length ? completed.size / program.steps.length * 100 : 0} label={`${completed.size} av ${program.steps.length} genomförda`} />
            </View>
            {allComplete && <MessageCard>Alla steg är registrerade. Det betyder inte att hunden är färdigtränad. Du kan läsa eller repetera programmet.</MessageCard>}
            <QuietButton title={isOpen ? 'Dölj övningar' : 'Visa övningar'} onPress={() => setOpenProgramId(isOpen ? null : program.id)} />
            {isOpen && <View style={styles.details}>
              <SectionHeader title="Veckans övningar" />
              {program.steps.length === 0 && <MessageCard>Programmet har inga publicerade steg ännu.</MessageCard>}
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
                <MessageCard>Steget är registrerat på ditt konto. Registreringen visar inte att hunden behärskar beteendet.</MessageCard>
                <PrimaryButton title={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} onPress={continueAfterSave} />
              </View>}
              <QuietButton title={busyStepKey === `${program.id}:reset` ? 'Rensar…' : 'Rensa registrerade steg'} disabled={Boolean(busyStepKey)} onPress={() => confirmReset(program, (selected) => { onResetProgram(selected); setAcknowledged(null); })} />
            </View>}
          </View>
        );
      })}
      </>}
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
  programCard: {
    alignSelf: 'stretch',
    borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.layout.cardPadding,
    marginTop: tokens.layout.sectionGap,
  },
  focusCard: {
    alignSelf: 'stretch',
    backgroundColor: tokens.colors.primaryPressed,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  focusEyebrow: { ...tokens.typography.caption, color: tokens.colors.successSurface, fontWeight: '700', marginBottom: tokens.spacing.xs },
  programTitle: { ...tokens.typography.heading, color: tokens.colors.onPrimary },
  focusBody: { ...tokens.typography.body, color: tokens.colors.onPrimary, marginTop: tokens.spacing.sm },
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
