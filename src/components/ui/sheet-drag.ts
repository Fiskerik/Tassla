import { Animated, PanResponder } from 'react-native';
import { sheetDragOffset, shouldDismissSheet, shouldStartSheetDrag } from './sheet-dismiss';

// A guarded parent can keep the sheet open while asking whether to discard.
export const SHEET_CLOSE_DECISION_MS = 120;

export interface SheetDragInputs {
  visible: boolean;
  reduced: boolean;
  onRequestClose: () => void;
}

/** One controller per mounted sheet; inputs are refreshed after each commit. */
export function createSheetDrag(translateY: Animated.Value) {
  let inputs: SheetDragInputs = { visible: false, reduced: true, onRequestClose: () => undefined };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let animation: Animated.CompositeAnimation | null = null;

  function cancelMotion() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const previous = animation;
    animation = null;
    previous?.stop();
    translateY.stopAnimation();
  }

  function springBack() {
    cancelMotion();
    if (inputs.reduced) { translateY.setValue(0); return; }
    const next = Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 });
    animation = next;
    next.start(() => { if (animation === next) animation = null; });
  }

  function requestDismiss() {
    cancelMotion();
    // Never bypass a parent's busy or unsaved-draft guard.
    inputs.onRequestClose();
    if (!inputs.visible) return;
    timer = setTimeout(() => {
      timer = null;
      if (inputs.visible) springBack();
    }, SHEET_CLOSE_DECISION_MS);
  }

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => inputs.visible && shouldStartSheetDrag(gesture.dx, gesture.dy),
    onPanResponderGrant: cancelMotion,
    onPanResponderMove: (_, gesture) => { if (inputs.visible) translateY.setValue(sheetDragOffset(gesture.dy)); },
    onPanResponderRelease: (_, gesture) => {
      if (!inputs.visible) return;
      if (shouldDismissSheet(gesture.dy, gesture.vy)) requestDismiss();
      else springBack();
    },
    onPanResponderTerminate: () => { if (inputs.visible) springBack(); },
    onPanResponderTerminationRequest: () => false,
  });

  return {
    panHandlers: responder.panHandlers,
    update(next: SheetDragInputs) {
      const visibilityChanged = next.visible !== inputs.visible;
      const reduceChanged = next.reduced && !inputs.reduced;
      inputs = next;
      if (visibilityChanged || reduceChanged) cancelMotion();
      if ((visibilityChanged && next.visible) || reduceChanged) translateY.setValue(0);
    },
    dispose: cancelMotion,
  };
}
