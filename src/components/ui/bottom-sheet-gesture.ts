export function shouldClaimBottomSheetDismissGesture(dx: number, dy: number, intentDistance: number): boolean {
  return dy >= intentDistance && dy > Math.abs(dx);
}

export function shouldDismissBottomSheet(dy: number, dismissDistance: number): boolean {
  return dy >= dismissDistance;
}

export function getBottomSheetDragOffset(startOffset: number, claimedDistance: number, postGrantDistance: number): number {
  return Math.max(0, startOffset + Math.max(0, claimedDistance + postGrantDistance));
}

export type BottomSheetDragSession = {
  begin: () => number;
  isCurrent: (sessionId: number) => boolean;
  invalidate: () => void;
};

export function createBottomSheetDragSession(): BottomSheetDragSession {
  let currentSessionId = 0;
  let active = false;
  return {
    begin: () => {
      currentSessionId += 1;
      active = true;
      return currentSessionId;
    },
    isCurrent: (sessionId) => active && sessionId === currentSessionId,
    invalidate: () => {
      currentSessionId += 1;
      active = false;
    },
  };
}
