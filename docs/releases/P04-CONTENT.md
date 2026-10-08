# Release-log — P04 MVP-innehåll

Uppdaterad 2026-10-08. Jämförelsebas P03 lokal88b2ed8; tidigare lokala mellancommit3d25345 (fx) bevarad. Erik har bekräftat att bundle v1 är godkänd och att hundexperten verifierat den; se `docs/content/mvp-content-approval-v1.md`. Tio runtimeversioner är publiceringsförberedda. Onboarding-only-versionen förblir draft tills runtime kan upprätthålla dess kontext.

## Major changes

Åtta svenska guider/checklistor och tre träningsprogram med nio steg. Stabil identitet, åldersurval och claim-spår per version. Tio versioner har status `published` i bundlen, medan onboarding-only-versionen förblir `draft` för att inte läcka till den vanliga åldersbaserade feeden.

## Verifiering och begränsningar

Approval-recorden dokumenterar Eriks produktägarbekräftelse av sakkunnigverifieringen och innehållsgodkännandet. `python tools/validate_content_bundle.py --publication-check`, content-bundle-tester och `git diff --check` körs för denna uppdatering. Publicerings-SQL är förberedd och transaktionell men har inte körts mot Supabase. Därför återstår målmiljöns RLS/readback och kontroll att runtime visar samma version-id:n. Tidigare statisk/native QA från P04 gäller oförändrade delar; ingen TestFlight-build verifierades här.

## Nästa steg

Kör `supabase/content/mvp-content-v1.sql`, därefter `supabase/content/publish-mvp-content-v1.sql` i avsedd Supabase-miljö. Verifiera published rows och appens urval där. Bygg en separat context-aware onboardingväg innan `before-homecoming` publiceras.
