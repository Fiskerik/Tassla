import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet, Button } from '../../components/ui';
import { tokens } from '../../theme/tokens';
import type { DailyRoutine, DailyRoutineDay, DailyTrainingSelection } from './daily-activity-data';
import type { HomeDailyActivity } from './daily-activity-model';
import type { HomeDailyTrainingOption } from './HomeScreen';

export function DailyActivityManagerSheet({ visible, onClose, focusRoutineId, dateKey, activities, routines, trainingOptions,
  busy, mutationMessage, mutationError, onRetryMutation, onCreateRoutine, onUpdateRoutine, onDeleteRoutine,
  onAddRoutineToDay, onRemoveRoutineFromDay, onAddTrainingToDay, onRemoveTrainingFromDay, onGoTraining }: {
  visible: boolean;
  onClose: () => void;
  focusRoutineId?: string | null;
  dateKey: string;
  activities: readonly HomeDailyActivity[];
  routines: readonly DailyRoutine[];
  trainingOptions: readonly HomeDailyTrainingOption[];
  busy: boolean;
  mutationMessage: string;
  mutationError: boolean;
  onRetryMutation?: () => void;
  onCreateRoutine?: (label: string) => void;
  onUpdateRoutine?: (routine: DailyRoutine, label: string) => void;
  onDeleteRoutine?: (routine: DailyRoutine) => void;
  onAddRoutineToDay?: (routine: DailyRoutine) => void;
  onRemoveRoutineFromDay?: (row: DailyRoutineDay) => void;
  onAddTrainingToDay?: (option: HomeDailyTrainingOption) => void;
  onRemoveTrainingFromDay?: (row: DailyTrainingSelection) => void;
  onGoTraining: () => void;
}) {
  const [newRoutineLabel, setNewRoutineLabel] = useState('');
  const [createContext, setCreateContext] = useState<{ visible: boolean; focusRoutineId: string | null; active: boolean } | null>(null);
  const creating = createContext?.visible === visible && createContext.focusRoutineId === (focusRoutineId ?? null) && createContext.active;
  const selectedRoutines = new Map(activities.filter((item) => item.routineDay)
    .map((item) => [item.routineDay?.routine_id, item.routineDay as DailyRoutineDay]));
  const selectedTraining = activities.filter((item) => item.kind === 'training' && item.trainingSelection);
  const focusedRoutine = routines.find((routine) => routine.id === focusRoutineId);

  return <BottomSheet visible={visible} title={focusedRoutine ? focusedRoutine.label : 'Dagens att göra'}
    onRequestClose={onClose} onPrimaryAction={onClose} primaryLabel="Klar">
    <Text style={styles.intro}>Välj vad som ska vara med idag. Dina val upprepas inte automatiskt.</Text>
    {mutationMessage ? <View style={[styles.message, mutationError && styles.errorMessage]}>
      <Text accessibilityRole={mutationError ? 'alert' : undefined} style={[styles.body, mutationError && styles.errorText]}>{mutationMessage}</Text>
      {onRetryMutation ? <Button variant="tertiary" label="Kontrollera samma ändring igen" accessibilityLabel="Kontrollera samma ändring igen" disabled={busy} onPress={onRetryMutation} /> : null}
    </View> : null}

    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Egna rutiner</Text>
      {routines.length === 0 ? <Text style={styles.muted}>Skapa en rutin som du vill ha med i dagens lista.</Text> : null}
      {routines.map((routine) => <RoutineTemplateRow key={`${routine.id}:${routine.label}`} routine={routine}
        selectedDay={selectedRoutines.get(routine.id) ?? null} busy={busy}
        highlighted={routine.id === focusRoutineId}
        onSave={(label) => onUpdateRoutine?.(routine, label)}
        onDelete={() => onDeleteRoutine?.(routine)}
        onAdd={() => onAddRoutineToDay?.(routine)}
        onRemove={() => {
          const row = selectedRoutines.get(routine.id);
          if (row) onRemoveRoutineFromDay?.(row);
        }} />)}
      {creating ? <View style={styles.createGroup}>
        <TextInput accessibilityLabel="Namn på egen rutin" placeholder="Namn på rutin" value={newRoutineLabel}
          onChangeText={setNewRoutineLabel} editable={!busy} maxLength={160} returnKeyType="done" style={styles.input} />
        <Button variant="primary" label="Spara rutin" accessibilityLabel="Spara rutin" disabled={busy || !newRoutineLabel.trim() || routines.some((routine) => routine.label === newRoutineLabel.trim())}
          onPress={() => onCreateRoutine?.(newRoutineLabel.trim())} />
      </View> : null}
      <Button variant="tertiary" label={creating ? 'Avbryt' : 'Skapa egen rutin'} accessibilityLabel={creating ? 'Avbryt skapa rutin' : 'Skapa egen rutin'} disabled={busy}
        onPress={() => setCreateContext({ visible, focusRoutineId: focusRoutineId ?? null, active: !creating })} />
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Valda träningssteg</Text>
      {selectedTraining.length === 0 ? <Text style={styles.muted}>Inget träningssteg valt idag.</Text> : selectedTraining.map((item) => <View key={item.id} style={styles.selectedRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{item.label}</Text>
          {item.programTitle ? <Text style={styles.muted}>{item.programTitle}</Text> : null}
        </View>
        <Button variant="tertiary" label="Ta bort idag" accessibilityLabel={`Ta bort ${item.label} från idag`} disabled={busy}
          onPress={() => item.trainingSelection && onRemoveTrainingFromDay?.(item.trainingSelection)} />
      </View>)}
      <Button variant="tertiary" label="Öppna Träning" accessibilityLabel="Öppna Träning" onPress={onGoTraining} />
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">Lägg till ett träningssteg</Text>
      {trainingOptions.length === 0 ? <Text style={styles.muted}>Inget nytt steg finns att välja just nu.</Text> : trainingOptions.map((option) => <View key={`${option.versionId}:${option.stepId}`} style={styles.optionRow}>
        <View style={styles.copy}>
          <Text style={styles.body}>{option.stepTitle}</Text>
          <Text style={styles.muted}>{option.programTitle}</Text>
        </View>
        <Button variant="tertiary" label="Lägg till" accessibilityLabel={`Lägg till ${option.stepTitle} för idag`} disabled={busy}
          onPress={() => onAddTrainingToDay?.(option)} />
      </View>)}
    </View>
    <Text style={styles.muted}>Dagsurval: {dateKey}. Träningssteg räknas som klara när sparad träningsprogress bekräftar det.</Text>
  </BottomSheet>;
}

function RoutineTemplateRow({ routine, selectedDay, busy, highlighted, onSave, onDelete, onAdd, onRemove }: {
  routine: DailyRoutine;
  selectedDay: DailyRoutineDay | null;
  busy: boolean;
  highlighted: boolean;
  onSave: (label: string) => void;
  onDelete: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(routine.label);
  return <View style={[styles.routineRow, highlighted && styles.highlightedRow]}>
    <TextInput accessibilityLabel={`Namn på rutin ${routine.label}`} value={label} onChangeText={setLabel}
      editable={!busy} maxLength={160} style={styles.input} />
    {label.trim() !== routine.label ? <Button variant="tertiary" label="Spara namn" accessibilityLabel={`Spara namn för ${routine.label}`}
      disabled={busy || !label.trim()} onPress={() => onSave(label.trim())} /> : null}
    <Button variant="tertiary" label={selectedDay ? 'Ta bort idag' : 'Lägg till idag'} accessibilityLabel={`${selectedDay ? 'Ta bort' : 'Lägg till'} ${routine.label} ${selectedDay ? 'från' : 'för'} idag`}
      disabled={busy} onPress={selectedDay ? onRemove : onAdd} />
    <Button variant="tertiary" label="Ta bort rutin" accessibilityLabel={`Ta bort rutin ${routine.label}`} disabled={busy}
      onPress={() => Alert.alert('Ta bort rutin?', `”${routine.label}” och dagens val tas bort.`, [
        { text: 'Avbryt', style: 'cancel' }, { text: 'Ta bort', style: 'destructive', onPress: onDelete },
      ])} />
  </View>;
}

const styles = StyleSheet.create({
  intro: { ...tokens.typography.body, color: tokens.colors.textSecondary },
  section: { gap: tokens.spacing.sm, paddingTop: tokens.spacing.sm, borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border },
  sectionTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary },
  body: { ...tokens.typography.caption, color: tokens.colors.textPrimary, flexShrink: 1 },
  muted: { ...tokens.typography.caption, color: tokens.colors.textSecondary, flexShrink: 1 },
  message: { gap: tokens.spacing.xs, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, backgroundColor: tokens.colors.selectedSurface },
  errorMessage: { backgroundColor: tokens.colors.dangerSurface },
  errorText: { color: tokens.colors.danger },
  routineRow: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  highlightedRow: { backgroundColor: tokens.colors.home.canvas, borderRadius: tokens.radius.sm, padding: tokens.spacing.sm },
  input: { minHeight: tokens.size.touchMin, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, borderRadius: tokens.radius.sm, paddingHorizontal: tokens.spacing.sm, color: tokens.colors.textPrimary, backgroundColor: tokens.colors.surface },
  createGroup: { gap: tokens.spacing.xs },
  optionRow: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm, paddingVertical: tokens.spacing.xs },
  selectedRow: { gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs, borderBottomWidth: tokens.size.stroke, borderBottomColor: tokens.colors.border },
  copy: { flex: 1, minWidth: 0, gap: tokens.spacing.xs / 2 },
});
