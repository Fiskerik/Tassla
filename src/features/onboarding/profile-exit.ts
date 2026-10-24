export type ProfileExitScope = {
  ownerId: string;
  accountGeneration: number;
  dogId: string;
};

export type ProfileExitSnapshot = {
  scope: ProfileExitScope;
  profileDirty: boolean;
  kennelDirty: boolean;
};

export type ProfileExitLocks = {
  profileBusy: boolean;
  profilePending: boolean;
  profileConflict: boolean;
  attributionBusy: boolean;
  attributionUnresolved: boolean;
};

export type ProfileExitDecision =
  | { kind: 'allow' }
  | { kind: 'confirm-discard' }
  | { kind: 'block'; reason: 'snapshot-unavailable' | keyof ProfileExitLocks };

export type ProfileExitBlockReason = Extract<ProfileExitDecision, { kind: 'block' }>['reason'];

export type ProfileRecoveryIdentity = { ownerId: string; accountGeneration: number; resolvedRequestId: string | null };

export function profileRecoveryRequestMatches(
  snapshot: ProfileRecoveryIdentity,
  ownerId: string,
  accountGeneration: number,
  storedRequestId: string | null,
): boolean {
  return snapshot.ownerId === ownerId
    && snapshot.accountGeneration === accountGeneration
    && snapshot.resolvedRequestId === storedRequestId;
}
export function profileExitScopeKey(scope: ProfileExitScope): string {
  return `${scope.ownerId}:${scope.accountGeneration}:${scope.dogId}`;
}

export function decideProfileExit(
  snapshot: ProfileExitSnapshot | null,
  activeScope: ProfileExitScope,
  locks: ProfileExitLocks,
): ProfileExitDecision {
  if (!snapshot || profileExitScopeKey(snapshot.scope) !== profileExitScopeKey(activeScope)) {
    return { kind: 'block', reason: 'snapshot-unavailable' };
  }
  for (const reason of ['profileBusy', 'profilePending', 'profileConflict', 'attributionBusy', 'attributionUnresolved'] as const) {
    if (locks[reason]) return { kind: 'block', reason };
  }
  return snapshot.profileDirty || snapshot.kennelDirty
    ? { kind: 'confirm-discard' }
    : { kind: 'allow' };
}
