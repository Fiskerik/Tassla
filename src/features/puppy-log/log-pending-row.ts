/** An insert is shown as pending only while its initial write is in flight. */
export function unresolvedInsertForDay<T extends { kind: string; status: string; id: string; occurredAt: string }>(
  mutation: T | null | undefined,
  selectedDate: string,
  eventIds: readonly string[],
  localDate: (occurredAt: string) => string,
): T | null {
  if (!mutation || mutation.kind !== 'add' || mutation.status !== 'pending') return null;
  if (localDate(mutation.occurredAt) !== selectedDate || eventIds.includes(mutation.id)) return null;
  return mutation;
}
