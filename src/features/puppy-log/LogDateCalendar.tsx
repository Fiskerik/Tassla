import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../../theme/tokens';
import { monthCalendarDays, shiftMonth } from './log-calendar-model';

const WEEKDAYS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
const WEEKDAY_NAMES = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];

export function LogDateCalendar({ month, selectedDate, today, markers, status, onMonthChange, onSelectDate, onRetry }: {
  month: string;
  selectedDate: string;
  today: string;
  markers: readonly string[];
  status: 'loading' | 'ready' | 'error';
  onMonthChange: (month: string) => void;
  onSelectDate: (date: string) => void;
  onRetry?: () => void;
}) {
  const cells = monthCalendarDays(month);
  const currentMonth = today.slice(0, 7);
  const nextDisabled = month >= currentMonth;
  const monthDate = new Date(`${month}-01T12:00:00`);
  const monthLabel = monthDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  const markerSet = new Set(markers);

  return <View style={styles.container} accessibilityLabel={`Kalender, ${monthLabel}`}>
    <View style={styles.monthHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa föregående månad" onPress={() => onMonthChange(shiftMonth(month, -1))} style={styles.monthButton}>
        <Ionicons name="chevron-back" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.monthTitle}>{monthLabel}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Visa nästa månad" accessibilityState={{ disabled: nextDisabled }} disabled={nextDisabled} onPress={() => onMonthChange(shiftMonth(month, 1))} style={styles.monthButton}>
        <Ionicons name="chevron-forward" size={tokens.size.iconMd} color={nextDisabled ? tokens.colors.textSecondary : tokens.colors.textPrimary} />
      </Pressable>
    </View>
    <View style={styles.grid}>
      {WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} accessibilityLabel={WEEKDAY_NAMES[index]} style={styles.weekday}>{day}</Text>)}
      {cells.map(({ dateKey, day }, index) => {
        if (!dateKey || day === null) return <View key={`blank-${index}`} style={styles.dayCell} />;
        const hasLogs = markerSet.has(dateKey);
        const selected = dateKey === selectedDate;
        const isToday = dateKey === today;
        const disabled = dateKey > today;
        const weekday = WEEKDAY_NAMES[(index % 7)];
        const humanDate = new Date(`${dateKey}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
        const state = [weekday, humanDate, hasLogs ? 'har loggar' : '', selected ? 'vald' : '', isToday ? 'idag' : '', disabled ? 'avstängd' : ''].filter(Boolean).join(', ');
        return <Pressable key={dateKey} accessibilityRole="button" accessibilityLabel={state} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => onSelectDate(dateKey)} style={[styles.dayCell, selected && styles.selectedDay, isToday && styles.todayDay, selected && isToday && styles.selectedTodayDay, disabled && styles.disabledDay]}>
          <Text style={[styles.dayText, selected && styles.selectedText, disabled && styles.disabledText]}>{day}</Text>
          {hasLogs ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.marker, selected && styles.selectedMarker]} /> : <View style={styles.markerPlaceholder} />}
        </Pressable>;
      })}
    </View>
    <View accessibilityLiveRegion="polite" accessibilityState={{ busy: status === 'loading' }} style={styles.status}>
      {status === 'loading' ? <Text style={styles.statusText}>Hämtar loggdagar…</Text>
        : status === 'error' ? <View style={styles.errorRow}><Text style={styles.errorText}>Loggdagar kunde inte hämtas.</Text>{onRetry ? <Pressable accessibilityRole="button" accessibilityLabel="Försök hämta loggdagar igen" onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Försök igen</Text></Pressable> : null}</View>
          : markers.length === 0 ? <Text style={styles.statusText}>Inga loggar den här månaden</Text> : <Text style={styles.statusText}>Prick visar dagar med loggar</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.sm, gap: tokens.spacing.sm, borderRadius: tokens.radius.md, backgroundColor: tokens.colors.surface },
  monthHeader: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full, backgroundColor: tokens.colors.selectedSurface },
  monthTitle: { ...tokens.typography.label, color: tokens.colors.textPrimary, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', ...tokens.typography.caption, color: tokens.colors.textSecondary, fontWeight: '700' },
  dayCell: { width: `${100 / 7}%`, minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.full },
  selectedDay: { backgroundColor: tokens.colors.primary },
  todayDay: { borderWidth: 1, borderColor: tokens.colors.primary },
  selectedTodayDay: { borderColor: tokens.colors.onPrimary },
  disabledDay: { opacity: 0.45 },
  dayText: { ...tokens.typography.caption, color: tokens.colors.textPrimary },
  selectedText: { color: tokens.colors.onPrimary, fontWeight: '700' },
  disabledText: { color: tokens.colors.textSecondary },
  marker: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.primary },
  selectedMarker: { backgroundColor: tokens.colors.onPrimary },
  markerPlaceholder: { position: 'absolute', bottom: 5, width: 5, height: 5 },
  status: { minHeight: tokens.size.touchMin, justifyContent: 'center' },
  statusText: { ...tokens.typography.caption, color: tokens.colors.textSecondary, textAlign: 'center' },
  errorRow: { alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs },
  errorText: { ...tokens.typography.caption, color: tokens.colors.danger, textAlign: 'center' },
  retryButton: { minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md },
  retryText: { ...tokens.typography.label, color: tokens.colors.primary },
});
