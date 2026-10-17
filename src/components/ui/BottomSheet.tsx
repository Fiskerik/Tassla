import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';
import { useReducedMotion } from './Motion';
import { createBottomSheetDragSession, getBottomSheetDragOffset, shouldClaimBottomSheetDismissGesture, shouldDismissBottomSheet } from './bottom-sheet-gesture';

type BottomSheetBaseProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  footer?: ReactNode;
  keyboardAware?: boolean;
  onDismiss?: () => void;
};

type BottomSheetCloseProps =
  | { dragToDismiss?: false; onRequestClose: () => void }
  | { dragToDismiss: true; onRequestClose: () => boolean };

export type BottomSheetProps = BottomSheetBaseProps & BottomSheetCloseProps;

type FocusedTextInput = ReturnType<typeof TextInput.State.currentlyFocusedInput> | HTMLElement | null;

function getCurrentlyFocusedTextInput(): FocusedTextInput {
  if (Platform.OS === 'web') {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLElement && activeElement !== document.body ? activeElement : null;
  }
  return TextInput.State.currentlyFocusedInput() ?? null;
}

export function BottomSheet(props: BottomSheetProps) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(0));
  const [panHandlers, setPanHandlers] = useState<ReturnType<typeof PanResponder.create>["panHandlers"] | null>(null);
  const focusRestoreFrame = useRef<number | null>(null);

  const dragEnabled = props.dragToDismiss === true;
  const onRequestClose = props.onRequestClose;
  const dragCloseProps = props.dragToDismiss === true ? props : null;
  const requestClose = useCallback(() => {
    onRequestClose();
  }, [onRequestClose]);
  const requestDragClose = useCallback(() => {
    return dragCloseProps !== null && dragCloseProps.onRequestClose() === true;
  }, [dragCloseProps]);
  const settleDrag = useCallback(() => {
    if (reduced) {
      translateY.setValue(0);
      return;
    }
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
  }, [reduced, translateY]);
  useEffect(() => {
    if (!dragEnabled) return;
    let claimedDistance = 0;
    let dragStartOffset = 0;
    let postGrantDistance = 0;
    let dragPositionReady = false;
    const dragSession = createBottomSheetDragSession();
    let focusedInputBeforeGesture: FocusedTextInput = null;
    const cancelFocusRestore = () => {
      if (focusRestoreFrame.current !== null) cancelAnimationFrame(focusRestoreFrame.current);
      focusRestoreFrame.current = null;
    };
    const restoreFocusedInput = () => {
      const focusedInput = focusedInputBeforeGesture;
      focusedInputBeforeGesture = null;
      if (!focusedInput) return;
      cancelFocusRestore();
      focusRestoreFrame.current = requestAnimationFrame(() => {
        focusRestoreFrame.current = null;
        if (!props.visible) return;
        const currentlyFocusedInput = getCurrentlyFocusedTextInput();
        if (currentlyFocusedInput && currentlyFocusedInput !== focusedInput) return;
        if (Platform.OS === 'web' && focusedInput instanceof HTMLElement) {
          focusedInput.focus({ preventScroll: true });
          return;
        }
        TextInput.State.focusTextInput(focusedInput as Exclude<FocusedTextInput, HTMLElement | null>);
      });
    };
    const responder = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        cancelFocusRestore();
        focusedInputBeforeGesture = getCurrentlyFocusedTextInput();
        return false;
      },
      onMoveShouldSetPanResponder: (_event, gesture) => {
        const shouldClaim = shouldClaimBottomSheetDismissGesture(gesture.dx, gesture.dy, tokens.motion.sheetDragIntent);
        if (shouldClaim) claimedDistance = gesture.dy;
        return shouldClaim;
      },
      onPanResponderGrant: () => {
        const currentSessionId = dragSession.begin();
        dragPositionReady = false;
        postGrantDistance = 0;
        translateY.stopAnimation((currentOffset) => {
          if (!dragSession.isCurrent(currentSessionId)) return;
          dragStartOffset = currentOffset;
          dragPositionReady = true;
          translateY.setValue(getBottomSheetDragOffset(dragStartOffset, claimedDistance, postGrantDistance));
        });
      },
      onPanResponderMove: (_event, gesture) => {
        postGrantDistance = gesture.dy;
        if (dragPositionReady) {
          translateY.setValue(getBottomSheetDragOffset(dragStartOffset, claimedDistance, postGrantDistance));
        }
      },
      onPanResponderRelease: (_event, gesture) => {
        dragPositionReady = false;
        dragSession.invalidate();
        if (!shouldDismissBottomSheet(claimedDistance + gesture.dy, tokens.motion.sheetDismiss)) {
          settleDrag();
          restoreFocusedInput();
          return;
        }
        const closeAccepted = requestDragClose();
        if (!closeAccepted) {
          settleDrag();
          restoreFocusedInput();
          return;
        }
        cancelFocusRestore();
        focusedInputBeforeGesture = null;
      },
      onPanResponderTerminate: () => {
        dragPositionReady = false;
        dragSession.invalidate();
        settleDrag();
        restoreFocusedInput();
      },
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => true,
    });
    setPanHandlers(responder.panHandlers);
    return () => {
      dragPositionReady = false;
      dragSession.invalidate();
      cancelFocusRestore();
    };
  }, [dragEnabled, props.visible, requestDragClose, settleDrag, translateY]);

  useEffect(() => {
    if (props.visible) return;
    translateY.setValue(0);
    if (focusRestoreFrame.current !== null) cancelAnimationFrame(focusRestoreFrame.current);
    focusRestoreFrame.current = null;
  }, [props.visible, translateY]);

  useEffect(() => () => {
    if (focusRestoreFrame.current !== null) cancelAnimationFrame(focusRestoreFrame.current);
    focusRestoreFrame.current = null;
  }, []);

  const heading = dragEnabled ? (
    <View {...(panHandlers ?? {})} testID="bottom-sheet-drag-region" style={styles.dragHeader}>
      <View style={styles.dragIndicatorArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
        <View style={styles.dragIndicator} />
      </View>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{props.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={requestClose} style={styles.close}>
          <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  ) : (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>{props.title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={requestClose} style={styles.close}>
        <Ionicons name="close" size={tokens.size.iconMd} color={tokens.colors.textPrimary} />
      </Pressable>
    </View>
  );

  const sheetStyle = [styles.sheet, props.keyboardAware && styles.keyboardAwareSheet, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }];
  const content = <>
    {heading}
    <ScrollView testID={dragEnabled ? 'bottom-sheet-scroll-view' : undefined} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={[styles.scroll, props.keyboardAware && styles.keyboardAwareScroll]} contentContainerStyle={styles.content}>
      {props.children}
    </ScrollView>
    {props.footer ? <View style={styles.footer}>{props.footer}</View> : null}
    {props.onPrimaryAction ? <Button label={props.primaryLabel ?? 'Klar'} accessibilityLabel={props.primaryLabel ?? 'Klar'} onPress={props.onPrimaryAction} /> : null}
  </>;

  return <Modal visible={props.visible} transparent animationType={dragEnabled || reduced ? 'none' : 'slide'} onRequestClose={requestClose} onDismiss={props.onDismiss} accessibilityViewIsModal>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' || props.keyboardAware ? 'padding' : undefined} style={styles.backdrop}>
      <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={requestClose} style={styles.dismissArea} />
      {dragEnabled ? (
        <Animated.View testID="bottom-sheet-surface" accessibilityRole="summary" accessibilityLabel={props.title} style={[sheetStyle, { transform: [{ translateY }] }]}>
          {content}
        </Animated.View>
      ) : (
        <View accessibilityRole="summary" accessibilityLabel={props.title} style={sheetStyle}>
          {content}
        </View>
      )}
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.colors.overlay },
  dismissArea: { flex: 1 },
  sheet: { alignSelf: 'stretch', maxHeight: '90%', padding: tokens.spacing.lg, gap: tokens.spacing.md, borderTopLeftRadius: tokens.radius.lg, borderTopRightRadius: tokens.radius.lg, backgroundColor: tokens.colors.surface },
  keyboardAwareSheet: { height: '90%', minHeight: 0, overflow: 'hidden' },
  dragHeader: { minHeight: tokens.size.touchMin, gap: tokens.spacing.xs, userSelect: 'none' },
  dragIndicatorArea: { height: tokens.spacing.md, justifyContent: 'center', alignItems: 'center' },
  dragIndicator: { width: 36, height: tokens.size.stroke * 4, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.border },
  heading: { minHeight: tokens.size.touchMin, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm },
  title: { ...tokens.typography.heading, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
  close: { minWidth: tokens.size.touchMin, minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  keyboardAwareScroll: { flex: 1, minHeight: 0 },
  content: { gap: tokens.spacing.md, paddingBottom: tokens.spacing.md },
  footer: { borderTopWidth: tokens.size.stroke, borderTopColor: tokens.colors.border, paddingTop: tokens.spacing.md, gap: tokens.spacing.sm, backgroundColor: tokens.colors.surface },
});
