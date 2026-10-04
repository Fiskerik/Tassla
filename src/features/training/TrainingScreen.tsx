import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MessageCard, PageHeading, PrimaryButton, QuietButton } from '../../components/AppPrimitives';
import { theme } from '../../theme/tokens';
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
            <Text style={styles.programTitle} accessibilityRole="header">{program.title}</Text>
            {program.audience && <Text style={styles.audience}>{program.audience}</Text>}
            <Text style={styles.body}>{program.introduction}</Text>
            <Text style={styles.progress}>{completed.length} av {program.steps.length} steg registrerade</Text>
            {completed.length === program.steps.length && (
              <MessageCard>Alla steg är registrerade i testläget. Det säger inget om hundens färdighet. Läs stegen igen eller rensa programmets registreringar.</MessageCard>
            )}
            <PrimaryButton
              title={isOpen ? 'Dölj program' : completed.length ? 'Fortsätt eller läs igen' : 'Visa program'}
              onPress={() => setOpenProgramId(isOpen ? null : program.id)}
            />
            {isOpen && (
              <View style={styles.programDetails}>
                <MessageCard tone="error">{program.stopText}</MessageCard>
                {program.steps.map((step, index) => {
                  const isCompleted = completed.includes(step.id);
                  return (
                    <View key={step.id} style={[styles.stepCard, isCompleted && styles.completedStep]}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>Steg {index + 1}</Text>
                        {isCompleted && <Text style={styles.registered}>REGISTRERAT</Text>}
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.body}>{step.body}</Text>
                      {!isCompleted && nextStep?.id === step.id && !waitingForContinue && (
                        <PrimaryButton title="Markera steg som genomfört" onPress={() => onCompleteStep(program, step.id)} />
                      )}
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
  previewLabel: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: '#E5EFE8', paddingHorizontal: 11, paddingVertical: 7 },
  previewLabelText: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  programCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 16, marginTop: 20 },
  programTitle: { color: theme.colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800' },
  audience: { color: '#785716', backgroundColor: '#F5E7BF', overflow: 'hidden', alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, marginTop: 9, fontSize: 12, fontWeight: '700' },
  body: { color: theme.colors.mutedText, fontSize: 15, lineHeight: 22, marginTop: 8 },
  progress: { color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 14 },
  programDetails: { marginTop: 16 },
  stepCard: { borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBF8F1', padding: 14, marginBottom: 10 },
  completedStep: { borderColor: '#94B39E', backgroundColor: '#F0F6F0' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepNumber: { color: theme.colors.mutedText, fontSize: 12, fontWeight: '800' },
  registered: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stepTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 5 },
  sourceCard: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 13, marginTop: 14 },
  sourceLabel: { color: theme.colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  sourceTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 5 },
  sourceUrl: { color: theme.colors.accent, fontSize: 12, lineHeight: 18, marginTop: 4 },
  limitation: { color: theme.colors.mutedText, fontSize: 12, lineHeight: 18, marginTop: 7 },
});
