import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
type Status = 'saving' | 'offline' | 'error';
const labels: Record<Status, string> = { saving: 'Sparar…', offline: 'Väntar på uppkoppling', error: 'Kunde inte spara – försök igen' };
export function StatusBadge({ status }: { status: Status }) { const failed = status === 'error'; return <View accessibilityRole="text" accessibilityLabel={labels[status]} style={[styles.badge, failed && styles.error]}><Text style={[styles.label, failed && styles.errorLabel]}>{labels[status]}</Text></View>; }
const styles = StyleSheet.create({ badge: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, justifyContent: 'center', paddingHorizontal: tokens.spacing.md, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.warningSurface }, error: { backgroundColor: tokens.colors.dangerSurface }, label: { ...tokens.typography.caption, color: tokens.colors.warning }, errorLabel: { color: tokens.colors.danger } });
