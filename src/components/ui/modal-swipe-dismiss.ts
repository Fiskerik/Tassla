import { createElement, useEffect, useLayoutEffect, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View, type GestureResponderHandlers, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/tokens';

export const MODAL_SWIPE_START = 10;
export const MODAL_SWIPE_DOMINANCE = 1.25;
export const MODAL_SWIPE_DISTANCE = 72;
export const MODAL_SWIPE_MIN_FLICK_DISTANCE = 24;
export const MODAL_SWIPE_VELOCITY = 0.65;
export const MODAL_CLOSE_DECISION_MS = 140;

export function shouldClaimModalSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) >= MODAL_SWIPE_START && Math.abs(dx) > Math.abs(dy) * MODAL_SWIPE_DOMINANCE;
}

export function shouldDismissModalSwipe(dx: number, vx: number): boolean {
  const distance = Math.abs(dx);
  return distance >= MODAL_SWIPE_DISTANCE
    || (distance >= MODAL_SWIPE_MIN_FLICK_DISTANCE && Math.abs(vx) >= MODAL_SWIPE_VELOCITY && Math.sign(dx) === Math.sign(vx));
}

export function modalSwipeOffset(dx: number): number {
  return Math.max(-144, Math.min(144, dx));
}

export type ModalSwipeInputs = { enabled: boolean; reduced: boolean; onRequestClose: () => void };

/** A guarded horizontal gesture that exists only on a modal's dedicated top handle. */
export function createModalSwipeDismiss(translateX: Animated.Value) {
  let inputs: ModalSwipeInputs = { enabled: false, reduced: true, onRequestClose: () => undefined };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let animation: Animated.CompositeAnimation | null = null;

  function stopMotion() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const previous = animation;
    animation = null;
    previous?.stop();
    translateX.stopAnimation();
  }

  function settle() {
    stopMotion();
    if (inputs.reduced) { translateX.setValue(0); return; }
    const next = Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 });
    animation = next;
    next.start(() => { if (animation === next) animation = null; });
  }

  function requestClose() {
    stopMotion();
    inputs.onRequestClose();
    if (!inputs.enabled) return;
    timer = setTimeout(() => {
      timer = null;
      if (inputs.enabled) settle();
    }, MODAL_CLOSE_DECISION_MS);
  }

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => inputs.enabled && shouldClaimModalSwipe(gesture.dx, gesture.dy),
    onPanResponderGrant: stopMotion,
    onPanResponderMove: (_, gesture) => { if (inputs.enabled) translateX.setValue(modalSwipeOffset(gesture.dx)); },
    onPanResponderRelease: (_, gesture) => {
      if (!inputs.enabled) return;
      if (shouldDismissModalSwipe(gesture.dx, gesture.vx)) requestClose();
      else settle();
    },
    onPanResponderTerminate: () => { if (inputs.enabled) settle(); },
    onPanResponderTerminationRequest: () => false,
  });

  return {
    panHandlers: responder.panHandlers,
    update(next: ModalSwipeInputs) {
      const availabilityChanged = next.enabled !== inputs.enabled;
      const reducedChanged = next.reduced && !inputs.reduced;
      inputs = next;
      if (availabilityChanged || reducedChanged) stopMotion();
      if ((availabilityChanged && next.enabled) || reducedChanged) translateX.setValue(0);
    },
    dispose: stopMotion,
  };
}

export function useModalSwipeDismiss(enabled: boolean, onRequestClose: () => void, reduced: boolean) {
  const [translateX] = useState(() => new Animated.Value(0));
  const [controller] = useState(() => createModalSwipeDismiss(translateX));

  useLayoutEffect(() => {
    controller.update({ enabled, reduced, onRequestClose });
  }, [controller, enabled, onRequestClose, reduced]);
  useEffect(() => () => controller.dispose(), [controller]);
  return { translateX, panHandlers: controller.panHandlers };
}

export function ModalSwipeHandle({ panHandlers, style }: { panHandlers: GestureResponderHandlers; style?: StyleProp<ViewStyle> }) {
  return createElement(View, {
    ...panHandlers,
    testID: 'modal-swipe-dismiss-handle',
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
    style: [styles.handle, style],
  }, createElement(View, { style: styles.bar }));
}

const styles = StyleSheet.create({
  handle: { minHeight: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  bar: { width: tokens.size.touchMin, height: tokens.spacing.xs, borderRadius: tokens.radius.full, backgroundColor: tokens.colors.textSecondary, opacity: 0.35 },
});
