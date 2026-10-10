import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
import { useReducedMotion } from './Motion';

export type ToastTone = 'success' | 'error' | 'neutral' | 'uncertain';
type ToastBaseProps = {
  visible: boolean;
  tone: ToastTone;
  message?: string;
  onUndo?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  confirmed?: boolean;
  autoDismissMs?: number;
  onAutoDismiss?: () => void;
  onExitComplete?: () => void;
};
type ToastProps = ToastBaseProps & ({ tone: 'uncertain'; onRetry: () => void } | { tone: Exclude<ToastTone, 'uncertain'>; onRetry?: () => void });

export function Toast({ visible, tone, message, onUndo, onRetry, onCancel, confirmed = false, autoDismissMs, onAutoDismiss, onExitComplete }: ToastProps) {
  const reduced = useReducedMotion();
  const initiallyVisible = useRef(visible);
  const previousVisible = useRef(visible);
  const generation = useRef(0);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitNotified = useRef(false);
  const exitPending = useRef(false);
  const autoDismissMsRef = useRef(autoDismissMs);
  const onAutoDismissRef = useRef(onAutoDismiss);
  const onExitCompleteRef = useRef(onExitComplete);
  const [phase, setPhase] = useState<'visible' | 'exiting' | 'hidden'>(visible ? 'visible' : 'hidden');
  const [phaseInputs, setPhaseInputs] = useState({ visible, reduced });
  if (phaseInputs.visible !== visible || phaseInputs.reduced !== reduced) {
    setPhaseInputs({ visible, reduced });
    if (phaseInputs.visible !== visible) setPhase(visible ? 'visible' : reduced ? 'hidden' : 'exiting');
    else if (!visible && reduced) setPhase('hidden');
  }
  const [motion] = useState(() => new Animated.Value(visible ? 1 : 0));
  const effectiveTone = tone === 'success' && !confirmed ? 'uncertain' : tone;
  const effectiveMessage = effectiveTone === 'uncertain' ? 'Vi kunde inte kontrollera om det sparades' : message ?? (effectiveTone === 'error' ? 'Kunde inte spara' : 'Sparat');
  const currentContent = { tone: effectiveTone, message: effectiveMessage, onUndo, onRetry, onCancel };
  const [retainedContent, setRetainedContent] = useState(currentContent);
  if (visible && (retainedContent.tone !== currentContent.tone || retainedContent.message !== currentContent.message || retainedContent.onUndo !== currentContent.onUndo || retainedContent.onRetry !== currentContent.onRetry || retainedContent.onCancel !== currentContent.onCancel)) {
    setRetainedContent(currentContent);
  }
  const displayContent = visible ? currentContent : retainedContent;
  const action = displayContent.tone === 'success' && displayContent.onUndo ? { label: 'Ångra', onPress: displayContent.onUndo, disabled: false } : (displayContent.tone === 'error' || displayContent.tone === 'uncertain') ? { label: 'Försök igen', onPress: displayContent.onRetry ?? (() => undefined), disabled: !displayContent.onRetry } : undefined;

  const scheduleAutoDismiss = useCallback((currentGeneration: number) => {
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    if (autoDismissMsRef.current === undefined || !onAutoDismissRef.current) return;
    autoDismissTimer.current = setTimeout(() => {
      if (generation.current === currentGeneration) onAutoDismissRef.current?.();
    }, autoDismissMsRef.current);
  }, []);
  const completeExit = useCallback(() => {
    if (!exitPending.current || exitNotified.current) return;
    exitNotified.current = true;
    exitPending.current = false;
    onExitCompleteRef.current?.();
  }, []);

  useEffect(() => {
    autoDismissMsRef.current = autoDismissMs;
    onAutoDismissRef.current = onAutoDismiss;
    onExitCompleteRef.current = onExitComplete;
  }, [autoDismissMs, onAutoDismiss, onExitComplete]);

  useEffect(() => {
    if (initiallyVisible.current) {
      initiallyVisible.current = false;
      if (visible) scheduleAutoDismiss(generation.current);
      return;
    }
    if (previousVisible.current === visible) {
      if (reduced) {
        const currentGeneration = generation.current;
        motion.stopAnimation();
        if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
        if (visible) {
          motion.setValue(1);
          scheduleAutoDismiss(currentGeneration);
        } else {
          completeExit();
        }
      }
      return;
    }
    previousVisible.current = visible;
    const currentGeneration = ++generation.current;
    if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    motion.stopAnimation();
    if (visible) {
      exitNotified.current = false;
      exitPending.current = false;
      if (reduced) { motion.setValue(1); scheduleAutoDismiss(currentGeneration); return; }
      motion.setValue(0);
      const animation = Animated.timing(motion, { toValue: 1, duration: tokens.motion.toastEnter, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      animation.start(({ finished }) => {
        if (finished && generation.current === currentGeneration) scheduleAutoDismiss(currentGeneration);
      });
      return () => animation.stop();
    }
    exitPending.current = true;
    if (reduced) {
      completeExit();
      return;
    }
    const animation = Animated.timing(motion, { toValue: 0, duration: tokens.motion.toastExit, easing: Easing.in(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => {
      if (!finished || generation.current !== currentGeneration) return;
      setPhase('hidden');
      completeExit();
    });
    return () => animation.stop();
  }, [visible, reduced, motion, scheduleAutoDismiss, completeExit]);

  useEffect(() => () => { generation.current += 1; if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current); motion.stopAnimation(); }, [motion]);

  if (phase === 'hidden') return null;
  const exposed = visible && phase === 'visible';
  const opacity = motion;
  const translateY = motion.interpolate({ inputRange: [0, 1], outputRange: [tokens.motion.distance, 0] });
  return <Animated.View accessibilityRole={exposed ? 'alert' : undefined} accessibilityLabel={exposed ? displayContent.message : undefined}
    accessibilityElementsHidden={!exposed} importantForAccessibility={exposed ? 'auto' : 'no-hide-descendants'}
    pointerEvents={exposed ? 'auto' : 'none'} style={[styles.toast, (displayContent.tone === 'error' && displayContent.onCancel) && styles.withCancel, displayContent.tone === 'error' && styles.error, displayContent.tone === 'success' && styles.success, displayContent.tone === 'uncertain' && styles.uncertain, { opacity, transform: [{ translateY }] }]}>
    <Text style={styles.message} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{displayContent.message}</Text>
    {action ? <Button variant="tertiary" label={action.label} accessibilityLabel={action.label} onPress={action.onPress} disabled={action.disabled || !exposed} /> : null}
    {displayContent.tone === 'error' && displayContent.onCancel ? <Button variant="secondary" label="Avbryt" accessibilityLabel="Avbryt" onPress={displayContent.onCancel} disabled={!exposed} /> : null}
  </Animated.View>;
}
const styles = StyleSheet.create({ toast: { alignSelf: 'stretch', minHeight: tokens.size.touchMin, padding: tokens.spacing.md, gap: tokens.spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: tokens.radius.md, borderWidth: tokens.size.stroke, borderColor: tokens.colors.border, backgroundColor: tokens.colors.selectedSurface }, withCancel: { flexDirection: 'column', alignItems: 'stretch' }, error: { backgroundColor: tokens.colors.dangerSurface, borderColor: tokens.colors.dangerBorder }, success: { backgroundColor: tokens.colors.successSurface, borderColor: tokens.colors.success }, uncertain: { backgroundColor: tokens.colors.warningSurface, borderColor: tokens.colors.warning }, message: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 } });
