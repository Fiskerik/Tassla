# Release-log — P05 Hem och Kunskap
Datum 2026-10-06. Bas lokal commit1d9de3f. Status implementerat och lokalt verifierat; ingen push/publicering gjord av denna körning. TestFlight-build okänd.
## Major changes
Hem visar korta guideintroduktioner med Läs i Kunskap. Kunskap öppnar samma redan hämtade publicerade version, visar källor och läsbara rubriker/listpunkter/stycken. Laddning, fel med återförsök och faktiskt tomt urval är skilda lägen.
## Minor changes
Befintliga hundillustrationer, varma themefärger och Ionicons med textetiketter ger sammanhängande kort och lugn läsvy. HTTPS-källor öppnas endast efter användartryck; övriga referenser är vanlig text. Stale guideval invalideras efter ändrad profil/urval. Träningssteg/progressions-ID:n bevaras.
## Bug-fixes
Utvecklingsbrister före leverans: saknad onboarding-sluggrind kunde låta före-hemkomst matcha faktisk ålder0; nu exkluderas den före urval. Publiceringsstatus och slug kontrolleras även i lässvar. Rå Markdown i guidebody formateras till native läsblock; tomma källor ger ärlig frånvarotext utan påhittat verifieringspåstående. Äldre regressionstestfixture kompletterad med verkliga status/slugfält, assertions oförändrade.
## Verifiering och begränsningar
Exakt v3 Architect APPROVE/Critic PROCEED; renewed Reviewer PASS och statisk Security PASS. QA fokuserat12/12, pnpmcheck223/223 TypeScript/lint/tests PASS, iOSexport/diffcheck PASS. Statisk kontrastkontroll av befintliga färgpar stödjer läsbarhet, inte full native tillgänglighetsverifiering. Ingen verklig server/RLS eller fysisk UI-test. P04-råd väntar på mänsklig review/publicering; appen visar inte utkasten som fallback.
## Nästa paket
P06 Tassla-pass: sparad profil, senaste vikt och utförda hälsohändelser; exakt förhandsgranskning, PDF och ägarinitierad lokal delning. Checkpunkter: snapshot/HTML-escaping, UI, installerad Expo57-nativeadapter/filstädning, QA och Review/Security.
