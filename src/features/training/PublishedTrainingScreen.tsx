import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppBar, BottomSheet, Button, HeroCard, ListRow, Progress, SectionHeader, Tabs, Toast } from '../../components/ui';
import type { PausedTrainingProgress, PublishedTrainingProgram } from '../../data/workspace-data';
import { tokens } from '../../theme/tokens';

export function PublishedTrainingScreen({ programs, paused, busyStepKey, error, onCompleteStep, onContinue, onResetProgram, onRetry }: {
  programs: readonly PublishedTrainingProgram[]; paused: readonly PausedTrainingProgress[]; busyStepKey: string | null; error: string;
  onCompleteStep: (program: PublishedTrainingProgram, stepId: string) => Promise<boolean>; onContinue: () => void;
  onResetProgram: (program: PublishedTrainingProgram) => void; onRetry: () => void;
}) {
  const [tab, setTab] = useState('Valpprogram');
  const [programId, setProgramId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ programId: string; stepId: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const pending = useRef(false);
  const active = programs.find((program) => program.id === programId) ?? programs[0];
  const selectedProgram = programs.find((program) => program.id === selection?.programId);
  const selectedStep = selectedProgram?.steps.find((step) => step.id === selection?.stepId);
  const nextStep = selectedProgram?.steps.find((step) => !selectedProgram.completedStepIds.includes(step.id));

  async function complete() {
    if (pending.current || busyStepKey || !selectedProgram || !selectedStep) return;
    pending.current = true;
    try {
      if (await onCompleteStep(selectedProgram, selectedStep.id)) {
        setSaved(true); setSelection(null); onContinue();
      }
    } finally { pending.current = false; }
  }
  function rows(program: PublishedTrainingProgram) {
    return <View style={styles.rows}>{program.steps.map((step) => <ListRow key={step.id} category="training" title={step.title} titleSize="compact"
      complete={program.completedStepIds.includes(step.id)} onPress={() => setSelection({ programId: program.id, stepId: step.id })} />)}</View>;
  }
  return <View>
    <AppBar mode="Title" title="Träning" />
    <Tabs items={['Valpprogram', 'Alla övningar', 'Framsteg']} active={tab} onChange={setTab} />
    <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
    <Toast visible={saved} tone="success" confirmed message="Övningen är genomförd" autoDismissMs={2500} onAutoDismiss={() => setSaved(false)} />
    {paused.map((item) => <Text key={item.versionId} style={styles.note}>Ett tidigare program är pausat. Dina {item.completedCount} genomförda steg finns kvar.</Text>)}
    {programs.length === 0 ? <><HeroCard title="Träning i er takt" meta="Här samlas övningarna för din hund." /><Text style={styles.note}>Fler program kommer när de är färdiga att använda.</Text></> : null}
    {tab === 'Valpprogram' && active ? <>
      <HeroCard title={active.title} meta="Ett steg i taget">
        <View style={styles.progress}><Progress light value={percentage(active)} label={`${active.completedStepIds.length} av ${active.steps.length} genomförda`} /></View>
      </HeroCard>
      <SectionHeader title="Övningar" />
      {rows(active)}
      <Button variant="tertiary" label="Om programmet" accessibilityLabel="Läs om programmet och dess källor" onPress={() => setSelection({ programId: active.id, stepId: '' })} />
      {programs.length > 1 ? <><SectionHeader title="Fler program" />{programs.filter((program) => program.id !== active.id).map((program) => <ListRow key={program.id} category="training" title={program.title} titleSize="compact" onPress={() => setProgramId(program.id)} />)}</> : null}
    </> : null}
    {tab === 'Alla övningar' ? programs.map((program) => <View key={program.id}><SectionHeader title={program.title} />{rows(program)}</View>) : null}
    {tab === 'Framsteg' ? programs.map((program) => <View key={program.id} style={styles.progressCard}>
      <Text style={styles.heading}>{program.title}</Text><Progress value={percentage(program)} label={`${program.completedStepIds.length} av ${program.steps.length} genomförda`} />
      {program.completedStepIds.length ? <Button variant="destructive" label="Börja om" accessibilityLabel={`Börja om med ${program.title}`} disabled={Boolean(busyStepKey)} onPress={() => Alert.alert('Börja om?', `Dina markeringar i ”${program.title}” tas bort.`, [{ text: 'Avbryt', style: 'cancel' }, { text: 'Börja om', style: 'destructive', onPress: () => onResetProgram(program) }])} /> : null}
    </View>) : null}
    <BottomSheet visible={Boolean(selectedProgram)} title={selectedStep ? 'Övning' : 'Om programmet'} onRequestClose={() => { if (!busyStepKey) setSelection(null); }}>
      <Text style={styles.heading}>{selectedStep?.title ?? selectedProgram?.title}</Text>
      <Text style={styles.body}>{selectedStep?.instruction ?? selectedProgram?.body}</Text>
      <Text style={styles.note}>Anpassa efter din hund och pausa när det behövs.</Text>
      {!selectedStep ? <><SectionHeader title="Källor" />{selectedProgram?.sources.map((source) => <Text key={source} style={styles.note}>{source}</Text>)}</> : null}
      <Toast visible={Boolean(error)} tone="error" message={error || undefined} onRetry={onRetry} />
      {selectedStep && selectedProgram?.completedStepIds.includes(selectedStep.id) ? <Text style={styles.note}>Genomförd. Ni kan gärna öva igen.</Text> : selectedStep ? <>
        {nextStep?.id !== selectedStep.id ? <Text style={styles.note}>Börja med {nextStep?.title} innan du markerar den här övningen.</Text> : null}
        <Button label="Markera som genomförd" accessibilityLabel="Markera övningen som genomförd" loading={Boolean(busyStepKey)} disabled={Boolean(busyStepKey) || nextStep?.id !== selectedStep.id} onPress={() => { void complete(); }} />
      </> : null}
    </BottomSheet>
  </View>;
}
function percentage(program: PublishedTrainingProgram) { return program.steps.length ? program.completedStepIds.length / program.steps.length * 100 : 0; }
const styles = StyleSheet.create({
  rows: { gap: tokens.spacing.xs }, progress: { marginTop: tokens.spacing.sm },
  progressCard: { backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.md, padding: tokens.spacing.lg, gap: tokens.spacing.md, marginBottom: tokens.spacing.md },
  heading: { ...tokens.typography.heading, color: tokens.colors.textPrimary }, body: { ...tokens.typography.body, color: tokens.colors.textPrimary }, note: { ...tokens.typography.caption, color: tokens.colors.textSecondary, marginVertical: tokens.spacing.md },
});
