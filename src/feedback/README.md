# Confirmed check feedback

`confirmation-intent.ts` tracks one in-memory, user-armed check by identity. Loading/hydrating saved data cannot arm it. Pending, failed and unknown reads cannot consume it. An exact confirmed check consumes it once; unchecking, scope changes and unmount discard it. No identifiers are stored or sent to the device API.

`use-confirmed-check-feedback.ts` connects that policy to real checkbox props. Callers provide the persisted confirmation state and a dog/day/row/item or account/dog/template-version/item key. It consumes silently under reduced motion and checks the current committed lifetime/preference immediately before the optional effect.

`confirmation-haptics.ts` uses Expo57-compatible `expo-haptics`57.0.3 (`selectionAsync`). iOS maps to UISelectionFeedbackGenerator; Android ships the package's VIBRATE manifest permission, without a runtime permission dialog. Web is an explicit no-op. Synchronous errors and rejected native promises are caught; no save waits for feedback or claims hardware delivery. No analytics, persistent preference, new data purpose or general tap vibration is added.

Production integration: `ChecklistItem` receives confirmed readback state from PuppyChecklistScreen; daily routine rows receive confirmed snapshots from Home, DailyChecklist and DailyProgress. Preview-only local lists remain silent. Existing disabled/unknown save guards are preserved.

Verify with `pnpm check`, `tests/confirmation-feedback.test.mjs`, the real-component browser probe and public iOS export. Browser SDK substitution verifies lifecycle/call policy, not native sensation. Physical iPhone/Android feedback and accessibility remain separate device checks. Haptics may be suppressed by system/device settings or hardware availability.
