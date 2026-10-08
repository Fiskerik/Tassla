import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MessageCard, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { AppBar, HeroCard, Progress } from '../../components/ui';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { theme } from '../../theme/tokens';

export function PublishedTrainingScreen({
  programs,
  paused,
  busyStepKey,
  error,
  onCompleteStep,
  onContinue,
  onResetProgram,
  onRetry,
}: {
  programs: readonly PublishedTrainingProgram[];
  paused: readonly PausedTrainingProgress[];
  busyStepKey: string | null;
  error: string;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<boolean>;
  onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void;
  onRetry: () => void;
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

  return (
    <View>
      <AppBar mode="Title" title="Träning" />
      <HeroCard title="Små steg, lugna stunder" meta="Bygg progression med frivillighet och belöning." />
      <MessageCard>Allmän träningsvägledning. Anpassa efter din hund. Du kan alltid pausa eller gå tillbaka. Registrering visar vad du markerat, inte vad hunden behärskar.</MessageCard>
      {error ? <>
        <MessageCard tone="error">{error}</MessageCard>
        <PrimaryButton title="Försök igen" onPress={onRetry} />
      </> : null}
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
            <Text style={styles.programTitle} accessibilityRole="header">{program.title}</Text>
            <Text style={styles.body}>{program.body}</Text>
            {program.sources.length > 0 && <View style={styles.sources}>
              <Text style={styles.sourceHeading}>Källor</Text>
              {program.sources.map((source, index) => <Text key={`${index}-${source}`} style={styles.sourceText}>{source}</Text>)}
            </View>}
            <Progress value={program.steps.length ? completed.size / program.steps.length * 100 : 0} label={`${completed.size} av ${program.steps.length} steg registrerade`} />
            {allComplete && <MessageCard>Alla steg är registrerade. Det betyder inte att hunden är färdigtränad. Du kan läsa eller repetera programmet.</MessageCard>}
            <PrimaryButton title={isOpen ? 'Dölj program' : 'Visa program'} onPress={() => setOpenProgramId(isOpen ? null : program.id)} />
            {isOpen && <View style={styles.details}>
              {program.steps.length === 0 && <MessageCard>Programmet har inga publicerade steg ännu.</MessageCard>}
              {program.steps.map((step, index) => {
                const isComplete = completed.has(step.id);
                const isCurrent = nextStep?.id === step.id;
                return (
                  <View key={step.id} style={[styles.stepCard, isComplete && styles.completedStep]}>
                    <Text style={styles.stepNumber}>Steg {index + 1}{isComplete ? ' · REGISTRERAT' : ''}</Text>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.body}>{step.instruction}</Text>
                    {isCurrent && !waiting && <PrimaryButton
                      title={busyStepKey === `${program.id}:${step.id}` ? 'Sparar…' : busyStepKey ? 'Vänta…' : 'Markera steg som genomfört'}
                      disabled={Boolean(busyStepKey)}
                      onPress={() => complete(program, step.id)}
                    />}
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
  hero: { height: 148, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: theme.radius.card, marginBottom: 10 },
  heroImage: { borderRadius: theme.radius.card },
  heroCaption: { alignSelf: 'flex-start', margin: 12, borderRadius: 14, backgroundColor: 'rgba(255,250,240,0.92)', paddingHorizontal: 11, paddingVertical: 7 },
  heroText: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  programCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 16, marginTop: 20 },
  programTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800' },
  body: { color: theme.colors.mutedText, fontSize: 15, lineHeight: 22, marginTop: 8 },
  progress: { color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 14 },
  details: { marginTop: 16 },
  stepCard: { borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBF8F1', padding: 14, marginBottom: 10 },
  completedStep: { borderColor: '#94B39E', backgroundColor: '#F0F6F0' },
  stepNumber: { color: theme.colors.mutedText, fontSize: 12, fontWeight: '800' },
  stepTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  sources: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 13, marginTop: 14 },
  sourceHeading: { color: theme.colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  sourceText: { color: theme.colors.accent, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
