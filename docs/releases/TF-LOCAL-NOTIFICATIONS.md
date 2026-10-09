# Release-logg — TF-LOCAL-NOTIFICATIONS

Datum: 2026-10-08. Status: kod- och checklistförberedelse klar; TestFlight-build och iPhone-prov återstår.

## Major changes

Inga. Befintliga lokala påminnelser får explicit Expo config-plugin och TestFlight-verifieringsplan.

## Minor changes

- Expo-notifications Android default channel matchar tjänstens `tassla-reminders-v1`.
- Dokumenterat att Codemagic/TestFlight inte kräver EAS project ID och att Apples push identifier/APNs inte används av lokal schemaläggning.

## Bug-fixes

Inga konstaterade runtimefel ändrade. Lägg till förebyggande konfigurations-/kontrakttest för notifications-plugin, behörighetsflöde, fjärrtokenavgränsning och bundle-ID.

## Verifiering och begränsningar

`node --test tests/local-notification-config.test.mjs` passerade (tre fokuserade kontroller); `git diff --check` passerade. Expo CLI saknas i den aktuella `node_modules`, så config-pluginens native prebuild-validering kunde inte köras. Native signering, upload, OS-dialog och faktisk iPhone-leverans är ännu ej verifierade. Ingen credential, EAS project ID eller APNs-token har fabricerats eller lagts in.

## Nästa paket

Erik startar manuellt Codemagic `tassla-ios`, installerar den behandlade versionen via intern TestFlight och fyller i [telefonchecklistan](../tasks/dev/testflight-local-notifications.md). Nästa checkpoint: bifoga build-ID/version och utfall, inklusive nekad/tillåten permission och kald/varm notisöppning.
