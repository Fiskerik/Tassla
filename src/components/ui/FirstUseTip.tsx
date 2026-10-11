import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { isUuid } from '../../notifications/notification-model';
import { markFirstUseTipSeen, readFirstUseTipStatus, type FirstUseTipScreenId } from '../../notifications/notification-storage';
import { tokens } from '../../theme/tokens';
import { Button } from './Button';

export function useFirstUseTip(ownerId: string | undefined, screenId: FirstUseTipScreenId, enabled: boolean) {
  const normalizedOwnerId = isUuid(ownerId) ? ownerId.toLowerCase() : undefined;
  const [resolution, setResolution] = useState<{ ownerId: string; status: 'seen' | 'unseen' | 'unavailable' } | null>(null);
  const [dismissedOwnerId, setDismissedOwnerId] = useState<string | null>(null);
  const resolvedForOwner = Boolean(normalizedOwnerId && resolution?.ownerId === normalizedOwnerId);
  const visible = Boolean(enabled && normalizedOwnerId && resolvedForOwner
    && resolution?.status === 'unseen' && dismissedOwnerId !== normalizedOwnerId);

  useEffect(() => {
    let active = true;
    if (!enabled || !normalizedOwnerId) return () => { active = false; };

    void readFirstUseTipStatus(normalizedOwnerId, screenId).then((status) => {
      if (!active) return;
      setResolution({ ownerId: normalizedOwnerId, status });
    });

    return () => { active = false; };
  }, [enabled, normalizedOwnerId, screenId]);

  const dismiss = useCallback(() => {
    if (!enabled || !normalizedOwnerId || (!visible && resolvedForOwner)) return;
    setDismissedOwnerId(normalizedOwnerId);
    void markFirstUseTipSeen(normalizedOwnerId, screenId);
  }, [enabled, normalizedOwnerId, resolvedForOwner, screenId, visible]);

  return { visible, dismiss };
}

export function FirstUseTip({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return <View style={styles.tip}>
    <Text style={styles.text}>{text}</Text>
    <Button variant="icon" label="Stäng" accessibilityLabel="Stäng tipset" iconName="close" onPress={onDismiss} />
  </View>;
}

const styles = StyleSheet.create({
  tip: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.xs,
    borderWidth: tokens.size.stroke,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
  },
  text: { ...tokens.typography.body, color: tokens.colors.textPrimary, flex: 1, flexShrink: 1 },
});
