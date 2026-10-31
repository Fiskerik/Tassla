import { useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import * as KeepAwake from 'expo-keep-awake';

type WakeApi = {
  activateKeepAwakeAsync(tag: string): Promise<void>;
  deactivateKeepAwake(tag: string): Promise<void>;
};

let sequence = 0;

function subscribeToAppState(onChange: () => void) {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}

function currentAppState() { return AppState.currentState; }

export function hasVisibleExerciseInstruction({ historical, historicalReady, program, step, focused, selected, waiting }: {
  historical: boolean; historicalReady: boolean; program: boolean; step: boolean; focused: boolean; selected: boolean; waiting: boolean;
}): boolean {
  return historical ? historicalReady : program && step && (focused || (selected && !waiting));
}

export function shouldKeepExerciseAwake(instructionVisible: boolean, appState: string | null, platform: string): boolean {
  return instructionVisible && appState === 'active' && platform !== 'web';
}

/** A late activation is released even if its view has already closed. */
export function beginExerciseWakeLock(api: WakeApi, tag: string): () => void {
  let closed = false;
  const release = () => {
    try { void Promise.resolve(api.deactivateKeepAwake(tag)).catch(() => undefined); } catch { /* Best effort. */ }
  };
  try {
    void Promise.resolve(api.activateKeepAwakeAsync(tag)).then(() => {
      if (closed) release();
    }).catch(() => undefined);
  } catch { /* Training remains usable if wake lock is unavailable. */ }
  return () => { if (!closed) { closed = true; release(); } };
}

export function useExerciseKeepAwake(instructionVisible: boolean) {
  const appState = useSyncExternalStore(subscribeToAppState, currentAppState, () => null);
  useEffect(() => {
    if (!shouldKeepExerciseAwake(instructionVisible, appState, Platform.OS)) return;
    return beginExerciseWakeLock(KeepAwake, `tassla-exercise-${++sequence}`);
  }, [instructionVisible, appState]);
}
