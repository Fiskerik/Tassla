# UI-EMPTY-FEEDBACK-KNOWLEDGE-TRAINING — verifiering

Datum: 2026-10-19
Branch: codex/tassla-ui-ux-bundle-2026-10-18
Plan: docs/tasks/dev/UI-ACCESSIBILITY-PHASE-2-5.md, amendment v9
Utgångspunkt före 5b: 04c398069af5ede91ef10d05d7e925597376058a
Verifieringsomfång: lokal kod, tester, headless-renderade produktkomponenter och offentligt JavaScript-exportpaket. Detta är inte en native-/TestFlight- eller full rev02-visuell sign-off.

## Resultat och avgränsning

5b:s lokala implementation är verifierad med fokuserade tester, hela projektsviten och iOS JavaScript-export. Headless-bilderna visar de faktiska Knowledge-, Training- och Profile-komponenterna i namngivna tillstånd, och interaktiva steg kördes i Playwright. Return-resorna verifierades i en liten syntetisk presentationsvärd. Värden simulerar scoped navigationscallbacks; den monterar inte hela ProductWorkspace, auth-flödet eller Supabase-klienten. Källtester kontrollerar den verkliga ProductWorkspace-wiringen separat.

Det finns därför stöd för komponenternas återkoppling, för de avsedda callback-resorna och för källkontraktet. Rapporten påstår inte att en signerad native build, fysisk skärm, native safe area, VoiceOver/TalkBack, Dynamic Type, live Supabase/RLS, aktivt hundbyte i appen eller faktisk appnavigation har verifierats. Dessa begränsningar står kvar i checkpointen och i den planerade enhetsverifieringen.

## Körningar

- node --experimental-strip-types --test tests/knowledge-training-empty-feedback.test.mjs tests/knowledge-review-content.test.mjs tests/training-overview.test.mjs tests/main-refresh.test.mjs — PASS, 29/29.
- pnpm check — PASS: typecheck, edge-account typecheck, lint samt 583/583 tester.
- pnpm bundle:ios — PASS: public-channel guard och iOS JavaScript-export, 1 447 moduler.
- git diff --check — PASS efter att rapporten och queueposten färdigställts.
- PYTHONUTF8=1 python tools/dev_flow.py validate — PASS efter att rapporten och queueposten färdigställts.
- Vissa befintliga TypeScript-testmoduler visar Node-varningen MODULE_TYPELESS_PACKAGE_JSON. Den gav inga fel och ändrades inte i denna checkpoint.

## Headless-metod

En tillfällig renderer utanför repot laddade produktionens KnowledgeScreen, PublishedTrainingScreen, EditDogProfileScreen, PuppyChecklistScreen via KnowledgeScreen, AppScreen och BottomNav. Playwright kördes headless i Chrome vid 375×844 CSS-pixlar och device scale factor 1. Skärmbilderna är PNG-filer i denna katalog. Checklistor-vyn får ett syntetiskt client-objekt och dogId; public-läget är avsiktligt valt så den riktiga komponenten visar sitt publika tomtillstånd utan Supabase-läsning eller skrivning. Aktiva knappar användes för öppna, rensa, gå tillbaka, spara, slutföra och försöka igen där det anges. Inga produktfiler ändrades för renderingsvärden.

Fixture-varianter:

- fixture-dog-no-dob: Luna utan födelsedatum, för Training → Hundprofil → tillbaka samt bekräftat spara → Training.
- fixture-dog-12w: Luna med DOB 2026-07-27, 12 veckor den 2026-10-19, för åldersfiltrerat tomt resultat → Kunskap → tillbaka till Training.
- Efter profiländring används DOB 2026-08-01, vilket ger 11 veckor den 2026-10-19.

Alla bilder nedan använder 375×844 och den fixture som anges. Äldre kompletterande bilder markeras som sådana när en senare capture visar samma eller en mer komplett resa.

## Bildindex

### Kunskap

| Bild | Tillstånd och full resa | Fixture |
|---|---|---|
| [knowledge-loading-375x844.png](knowledge-loading-375x844.png) | Kunskap öppnas; korrekt laddningsskelett under väntande läsning. | fixture-dog-no-dob |
| [knowledge-zero-search-375x844.png](knowledge-zero-search-375x844.png) | Kunskap → Artiklar → sök på Luna → noll träffar och synlig Rensa sökning-handling. | fixture-dog-no-dob |
| [knowledge-zero-search-cleared-375x844.png](knowledge-zero-search-cleared-375x844.png) | Aktivera Rensa sökning → aktiv hunds syntetiska artikel visas igen. | fixture-dog-no-dob |
| [knowledge-zero-published-375x844.png](knowledge-zero-published-375x844.png) | Kunskap utan publicerade guider → tomtillstånd med vägar till Checklistor och FAQ. | fixture-dog-no-dob |
| [knowledge-checklist-open-375x844.png](knowledge-checklist-open-375x844.png) | Noll publicerade guider → aktivera Checklistor → den riktiga komponenten visar ”Inga checklistor publicerade ännu.” och tillbaka-handlingen. | fixture-dog-no-dob |
| [knowledge-checklist-return-375x844.png](knowledge-checklist-return-375x844.png) | Checklistor → aktivera tillbaka → För dig återställs. | fixture-dog-no-dob |
| [knowledge-faq-return-375x844.png](knowledge-faq-return-375x844.png) | Kunskap → FAQ-vyn visas. | fixture-dog-no-dob |
| [knowledge-faq-home-return-375x844.png](knowledge-faq-home-return-375x844.png) | FAQ → aktivera tillbaka → För dig återställs. | fixture-dog-no-dob |
| [knowledge-no-published-375x844.png](knowledge-no-published-375x844.png) | Äldre kompletterande capture av noll publicerade guider; använd den senare zero-published-bilden för synliga nästa handlingar. | fixture-dog-no-dob |
| [knowledge-training-return-375x844.png](knowledge-training-return-375x844.png) | Äldre kompletterande Knowledge/Training-returvy; full no-match-resa finns i de nyare Training-bilderna nedan. | fixture-dog-12w |

### Träning och profil

| Bild | Tillstånd och full resa | Fixture |
|---|---|---|
| [training-no-age-375x844.png](training-no-age-375x844.png) | Training med saknat födelsedatum → tydlig åldersförklaring och Lägg till födelsedatum. | fixture-dog-no-dob |
| [training-no-age-to-profile-375x844.png](training-no-age-to-profile-375x844.png) | Aktivera CTA → Hundprofilens editor. | fixture-dog-no-dob |
| [training-profile-back-return-375x844.png](training-profile-back-return-375x844.png) | Hundprofil → använd Back → Training återkommer; Back-kontrollens tillgänglighetsnamn är Tillbaka till Träning. | fixture-dog-no-dob |
| [training-profile-save-return-375x844.png](training-profile-save-return-375x844.png) | Hundprofil → bekräfta spara DOB 2026-08-01 → Training med åldersfiltrering för 11 veckor. | fixture-dog-no-dob, därefter DOB 2026-08-01 |
| [training-no-match-to-knowledge-375x844.png](training-no-match-to-knowledge-375x844.png) | 12-veckors Training utan match → Öppna Kunskap → Knowledge visas. | fixture-dog-12w |
| [training-knowledge-back-return-375x844.png](training-knowledge-back-return-375x844.png) | Knowledge från no-match-flödet → aktivera tillbaka → Training återkommer. | fixture-dog-12w |
| [training-no-program-375x844.png](training-no-program-375x844.png) | Äldre kompletterande tomt Training-tillstånd; huvudevidensen för åldersfiltrerat no-match är resan via Knowledge ovan. | fixture-dog-12w |
| [training-empty-program-375x844.png](training-empty-program-375x844.png) | Öppna ett enskilt tomt program → förklaring om att inga övningar finns och befintlig program-/källväg. | fixture-dog-12w |
| [training-completed-program-375x844.png](training-completed-program-375x844.png) | Översikten visar ett färdigtränat program och dess befintliga fortsättningshandling; öppning av detalj och återupptagning är inte fångad (NOT TESTABLE). | fixture-dog-12w |
| [training-complete-success-375x844.png](training-complete-success-375x844.png) | Aktivera slutför på övning → bekräftat success-meddelande. | fixture-dog-12w |
| [training-error-375x844.png](training-error-375x844.png) | Läsfel i Training → felåterkoppling och Försök igen visas. | fixture-dog-12w |
| [training-retry-success-375x844.png](training-retry-success-375x844.png) | Aktivera Försök igen → läsningen lyckas och korrekt tomtillstånd visas. | fixture-dog-12w |
| [profile-return-route-375x844.png](profile-return-route-375x844.png) | Äldre kompletterande profilreturvy; den fullständiga CTA → profil → Back-resan finns i de nyare bilderna ovan. | fixture-dog-no-dob |

## Designregler §14 — implementerarens observationslogg

Detta är en begränsad evidenslogg från implementationen. Oberoende QA ska göra sin egen bedömning. NOT TESTABLE betyder att kravet saknar rätt jämförelse eller miljö; det är inte ett godkännande.

1. **Ja, för de fångade tillstånden** — varje berört tomt/laddat/felaktigt läge har en tydlig relevant nästa handling; tom Training utan ålder använder en namngiven profilväg. Zero-published erbjuder två likvärdiga val, Checklistor och FAQ.
2. **Ja** — Checklistor och FAQ presenteras som likvärdiga fortsättningar i zero-published-tillståndet; ingen av dem utges som primär.
3. **Ej tillämpligt** — checkpointen ändrar ingen radering.
4. **Ej tillämpligt** — checkpointen ändrar inga Hem-rader eller Hem-hantering.
5. **NOT TESTABLE** — komponentbilderna har dokumenterad 375×844 viewport, men jämförbar rev02-specifikation och native safe-area-/fri-marginalmätning ingår inte.
6. **Ja, på källnivå** — komponenterna använder befintliga delade primitives/tokens; fokuserad källa/test verifierar ägarskap. Detta är inte en rev02-likhetsbedömning.
7. **Ja, på källnivå** — befintlig ikonfamilj och befintliga symboler används för berörda actions.
8. **NOT TESTABLE** — ingen godkänd rev02-paneljämförelse eller kontrastmätning för denna checkpoint gjordes.
9. **Ja, i de fångade flödena** — CTA/etikett leder till den visade destinationen; Knowledge- och Training-returer kördes genom syntetiska presentationscallbacks.
10. **Ja** — ingen persistent Sparat-badge införs; övningsbekräftelse visas först efter att slutför-handlingen bekräftats av testvärdens callback.
11. **Ja, begränsat till fångade lägen** — läsfel, retry och bekräftad framgång är åtskilda; inga falska sparpåståenden syns i de fångade tillstånden.
12. **Ja** — synlig copy är vardaglig svenska utan interna drifttermer.
13. **NOT TESTABLE** — ton, metadatahierarki och bildandel kan inte godkännas utan den avsedda målbilden och jämförelse i samma skala.
14. **Ja** — relevanta Knowledge- och Training-lägen i denna checkpoint har bilder: loading, sök utan träff, lyckad rensning, noll publicerat innehåll, Checklistor/FAQ-retur, no-age, no-match, profilretur/spara, tomt program, genomfört, bekräftad completion, läsfel och retry.
15. **NOT TESTABLE** — ingen fysisk 44×44 pt-mätning, VoiceOver/TalkBack, Dynamic Type eller reducerad-rörelseverifiering kördes.
16. **NOT TESTABLE** — rev02-panelen saknas i denna jämförbara körning; layout, färgfördelning, typografi, komponentform, bildspråk och innehållstäthet godkänns inte genom kodtester eller headless-fixture.
17. **Ja för de isolerade komponentresorna; faktisk appnavigation NOT TESTABLE** — testvärden använde de avsedda destinationscallbacks och profilen visade korrekt contextual Back-namn. Hela ProductWorkspace monterades inte i renderingen.
18. **NOT TESTABLE mot målbilden** — Luna och relevant ålders-/hundkontext visas i berörda komponentflöden, men hundnamn/bildroll/innehåll kan inte jämföras med rev02-panelen utan den panelen.

## Öppna verifieringar

- Architect godkände amendment v9 efter att ha matchat queue, testkommando och evidensregister.
- Oberoende QA gav PASS för den avgränsade lokala checkpointen och bekräftade de kompletterande bilderna; detaljöppning/återupptagning av färdigt program är fortsatt NOT TESTABLE eftersom klickresan inte fångades.
- Oberoende Reviewer gav **PASS** på den frysta diffen: inga åtgärdskrävande fynd; scope, returflöden, tom-/fel-/ålderslägen och evidensgränser följer amendment v9. Ingen utökad lagring, nätverkstrafik eller persondatamängd infördes.
- Riktig ProductWorkspace/appnavigation, aktivt hundbyte och verklig Supabase/RLS-ingång är inte monterade i headless-värden.
- Native safe area, fysisk målstorlek, VoiceOver/TalkBack, Dynamic Type, reducerad rörelse, tangentbord och gester kräver enhetskörning.
- Ingen signerad iOS-build, TestFlight-körning eller faktisk backendläsning verifierades.
- Full §14 punkt 16 (rev02-panelens visuella matchning) är fortsatt NOT TESTABLE.

Ingen visuell/native fullleverans eller production-dataacceptans hävdas här.
