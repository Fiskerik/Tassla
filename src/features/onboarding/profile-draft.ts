import { normalizeDogProfileName, type AgeDisplayUnit, type OwnedDog, type OwnedDogAttribution } from '../../data/app-data';
import { normalizeKennelCode } from '../../onboarding-referral/referral-model';

export interface DogProfileDraft {
  name: string;
  breedId: string;
  birthDate: string;
  ageDisplayUnit: AgeDisplayUnit;
}

export interface AttributionScope {
  ownerId: string;
  accountGeneration: number;
  dogId: string;
}

export interface KennelAttributionIntent extends AttributionScope {
  attemptedCode: string | null;
  operationId: number;
  status: 'unknown' | 'mismatch';
}

export interface AttributionReadbackToken extends AttributionScope {
  operationId: number;
}

export interface ScopedValue<T> {
  scope: AttributionScope;
  value: T;
}

export function isDogProfileDraftDirty(saved: OwnedDog, draft: DogProfileDraft): boolean {
  const savedName = normalizeDogProfileName(saved.name);
  const draftName = normalizeDogProfileName(draft.name);
  const nameChanged = draftName === undefined
    ? draft.name !== saved.name
    : draftName !== savedName;
  return nameChanged
    || draft.breedId !== saved.breed_id
    || draft.birthDate.trim() !== saved.birth_date
    || draft.ageDisplayUnit !== saved.age_display_unit;
}

function canonicalKennelCode(code: string | null): string | null {
  if (code === null || code.trim() === '') return null;
  return normalizeKennelCode(code) ?? `invalid:${code.trim().toUpperCase()}`;
}

export function isKennelCodeDraftDirty(savedCode: string | null, draftCode: string): boolean {
  return canonicalKennelCode(savedCode) !== canonicalKennelCode(draftCode);
}

export function isProfileEditorDraftDirty(input: {
  profileDirty: boolean;
  kennelDirty: boolean;
  profilePending: boolean;
  hasKennelIntent: boolean;
}): boolean {
  return (input.profileDirty && !input.profilePending)
    || (input.kennelDirty && !input.hasKennelIntent);
}

export function sameAttributionScope(left: AttributionScope | null | undefined, right: AttributionScope | null | undefined): boolean {
  return Boolean(left && right)
    && left!.ownerId === right!.ownerId
    && left!.accountGeneration === right!.accountGeneration
    && left!.dogId === right!.dogId;
}

export function filterScopedValue<T>(record: ScopedValue<T> | null, currentScope: AttributionScope): T | null {
  return record && sameAttributionScope(record.scope, currentScope) ? record.value : null;
}

export function isAttributionIntentCurrent(
  intent: KennelAttributionIntent | null,
  checked: AttributionReadbackToken,
  currentScope: AttributionScope,
): boolean {
  return Boolean(intent)
    && sameAttributionScope(checked, currentScope)
    && sameAttributionScope(intent, checked)
    && intent!.operationId === checked.operationId;
}

export function matchesAttributionPostimage(attemptedCode: string | null, actual: OwnedDogAttribution | null): boolean {
  if (attemptedCode === null) return actual === null;
  return normalizeKennelCode(attemptedCode) !== null
    && normalizeKennelCode(attemptedCode) === normalizeKennelCode(actual?.code ?? '');
}

export type AttributionReadbackResult =
  | { status: 'stale'; intent: KennelAttributionIntent | null }
  | { status: 'confirmed'; intent: null; value: OwnedDogAttribution | null }
  | { status: 'mismatch'; intent: KennelAttributionIntent; value: OwnedDogAttribution | null };

export function resolveAttributionReadback(
  intent: KennelAttributionIntent | null,
  checked: AttributionReadbackToken,
  currentScope: AttributionScope,
  value: OwnedDogAttribution | null,
): AttributionReadbackResult {
  if (!isAttributionIntentCurrent(intent, checked, currentScope)) return { status: 'stale', intent };
  if (matchesAttributionPostimage(intent!.attemptedCode, value)) return { status: 'confirmed', intent: null, value };
  return { status: 'mismatch', intent: { ...intent!, status: 'mismatch' }, value };
}
