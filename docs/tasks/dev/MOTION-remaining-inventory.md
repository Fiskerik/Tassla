# Återstående arbete och samlad mobil-QA

Datum: 2026-10-10
Underlag: `docs/tasks/dev/queue.json`, beslut 0005 och de senaste användarrapporterade kontrollerna.
Avgränsning: inventering, inte PASS för tester eller release.

## MOTION

| Paket | Status | Vad återstår |
|---|---|---|
| MOTION-02 | Godkänt av Erik för fortsatt arbete; lokala kodkontroller och branchpush klara. Telefon/native är ännu inte verifierat i denna session. | Ta med sparade/rörliga loggrader, träningssteg, reduced motion, VoiceOver/TalkBack och större text i den gemensamma mobil-QA:n. |
| MOTION-03 | Lokalt implementerad på `motion-03-first-use-tip`; QA/review checkpoint återstår. | Reviewer ska bekräfta rättad race i SecureStore-sessionspärren. Statisk QA blockerade QA-PASS eftersom planerade policytester saknas. Övriga typecheck/lint/export/kö/diff-kontroller passerar. Telefonkontroll samlas till senare. |
| MOTION-04 | Erik har uttryckligen begärt paketet. Planutkast v1 finns; status är fortfarande planned och det finns ingen kod/asset. | Exakt Architect/Critic-planreview återstår. Implementation startar efter MOTION-03:s lokala QA, Reviewer och checkpoint; därefter egen QA/Reviewer. Ingen Home-hälsning. Telefonkontroll samlas till senare. |

## Övriga öppna uppgifter

| Paket | Köstatus | Nästa konkreta steg |
|---|---|---|
| DS-CODE-01 | Blockerad på separat visuell QA. Erik har tidigare rapporterat att den fungerar på telefon; rapporten har inte renderingar eller oberoende visuell checklista. | Spara galleri på liten/större bredd och stor text, fyll designchecklistan, gör oberoende visuell QA och förnya Reviewer. |
| LOGGA-QUICK | Blockerad på separat visuell QA. Erik har tidigare rapporterat att den fungerar på telefon. | Fånga laddar/tom/fel/normal, Fler, sparat/ångra, failed/unsure, dubblett samt bredd/stor text; genomför oberoende visuell QA. MOTION-03:s smala LogScreen-ändring stänger inte detta paket. |
| UI-08 | Blockerad på visuell QA. | Rendera berörda vyer/toast i 360/430 px och 140 % text, fyll checklistan och gör oberoende visuell QA. |
| FOUNDATION-DB-VERIFY | Planerad; verklig Supabase-kontroll saknas. | Granska Eriks tidigare exekveringsunderlag och registrera evidens. Kör inte migrationen igen. |
| APP-01-PHONE | Klar enligt Eriks användarrapport 2026-10-10. | Google Sign-In/OAuth fungerar i Codemagic. Build/version och separat oberoende verifiering saknas; ingen ny callback- eller telefonkontroll begärs. |
| APP-04A-PHONE | Köstatus planerad men ett separat arbetsunderlag registrerar Eriks passerade resultat 2026-10-06. | Användarrapporterat PASS; build/version saknas. Lägg till tillgängliga detaljer i befintlig checkpoint. Upprepa inte bara på grund av gammal köstatus. |
| APP-05-PHONE-DB | Planerad; riktig telefon/Supabase/RLS-kontroll saknas. | Kräver Eriks mandat för ny signerad kontroll och utvecklings-Supabase-åtkomst enligt köposten. |

## Samlad mobil-QA

Erik godkände MOTION-02 och bad uttryckligen att senare kontrollera alla MOTION-paket tillsammans. Beslut 0005 ersätter därför telefonstoppet efter varje MOTION-slice. Varje slice kräver fortfarande lokal check, oberoende QA, Reviewer och checkpoint. Inga telefon- eller visuella resultat får rapporteras som PASS innan faktisk granskning har gjorts.

Den gemensamma telefonrundan täcker minst MOTION-02 och MOTION-03/04 i relevant slutlig build. De övriga paketen ovan kräver egna artefakter, Supabase-data eller signerade resor och kan inte automatiskt stängas av en MOTION-QA-runda.
