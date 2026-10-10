# MOTION-03 – Tips vid första användning

Status: Architect APPROVE, Critic PROCEED och Product copy godkänd
Version: 4
Datum: 2026-10-10

## Mandat och användaruppgift

MOTION-03 ingår i Eriks MOTION-beställning, beslut 0004. Erik har uttryckligen godkänt att den byggs efter MOTION-02 och att telefonprovet samlas till en senare mobil-QA-runda, beslut 0005. Implementationen ska hjälpa en förstagångsanvändare att förstå en skärms huvudsakliga möjlighet utan att avbryta uppgiften.

Användaren ska kunna förstå tipset, fortsätta använda skärmen direkt och aldrig behöva svara på eller stänga tipset för att komma vidare.

## UI-kontrakt

- Högst ett diskret, avfärdbart tips per skärmyta; högst två korta rader vid normal textstorlek. Denna slice lägger tipset endast i LogScreen.
- Tipset visas bara första gången aktuell kontoägare öppnar LogScreen och när loggen är användbar (inte laddar eller visar första-hämtningens fel).
- En avsiktlig kontrollaktivering avfärdar tipset och sparar visningsstatus. Passiv scrollning och skärmläsarens fokusförflyttning avfärdar det inte.
- Tipset får inte uppta formulärutrymme, täcka eller ta över huvudhandlingen, eller se ut som `InfoBanner`. Innehåll får flöda nedåt runt tipset.
- Nära tillvikten formateras med befintliga UI-komponenter/tokens. Ingen ny färgpalett eller rörelse krävs. Stängkontrollen ska ha minst 44 pt tryckyta och tillgängligt namn.
- Ingen hälsotext eller hemhälsning läggs till. Träning och Hälsa får inga tips i denna slice.

## Copy efter Product-granskning

| Yta | Förslag | Syfte |
|---|---|---|
| Logg | ”Tryck på Fler för fler loggtyper.” | Hjälpa nya ägare hitta loggtyper som ligger bakom Fler. |

Product rekommenderar att utelämna Hem-tipset eftersom det upprepar skärmens funktion och Hälsa-tipset eftersom kategorier och huvudhandling redan syns. Critic rekommenderar en första slice endast i LogScreen: tipset ska förklara en konkret funktion som inte redan står i tomlägestexten. Denna text lär ut `Fler`, utan att upprepa snabbloggens instruktion. Critic ska granska reviderad copy före implementation; texten ska rymmas i två rader vid normal textstorlek.

## Lagring, ägarskap och radering

- Spara endast boolesk visningsstatus per `ownerId` och stabilt skärm-ID (`log`) i SecureStore. Denna slice skapar en enda stabil nyckel.
- Status används enbart för att avgöra om just det tipset ska visas. Ingen historik, analys, serverpost eller nytt konto-/hundfält.
- Kontoägare byts: läs aktuell ägares nyckel; föregående ägares status får inte påverka nästa ägare.
- Efter bekräftad kontoradering tas MOTION-03:s `log`-nyckel bort genom befintligt lokalt städflöde i `ProductWorkspace.tsx`. Raderingsfelet går in i samma aggregerade cleanup-fel som notifieringspreferenser och övriga lokala data.
- SecureStore-läs- eller skrivfel döljer tipset under resten av den aktuella appsessionen för den ägaren/skärmen. En volatil minnesspärr per ägare/skärm överlever remounts men inte processomstart. Inget fel blockerar loggen. Persistent status påstås inte sparad.
- En effektlivstid per ägar-ID avvisar sena lässvar efter ägarbyte eller avmontering. Avfärdandet uppdaterar UI direkt; det sena skrivresultatet får inte visa tipset igen eller ändra ny ägares UI. Ett misslyckat SecureStore-anrop ändrar inte persistent status.
- Compliance-bedömningen 2026-10-10 klassar flaggorna som personuppgifter eftersom de kan knytas till ägar-ID. Bedömningen godkänner den begränsade implementeringen med minimering, ägarseparation och radering. Slutlig rättslig grund och information inför betadrift är fortsatt öppen i `docs/privacy/beta-information.md`.

## Skärmar och visuellt ansvar

Planerad placering: Logg, direkt efter appbaren och före Snabb logg. Tipset ligger utanför formulärfält och deras åtgärder, täcker inte eller tar över huvudhandlingen och förblir åtkomligt vid stor text. Innehållet får flöda nedåt runt tipset.

LOGGA-QUICK:s egen visuella status är fortsatt blockerad. Eriks beslut 0005 prioriterar enbart denna begränsade tip-integration i `LogScreen`; det är inte visuellt godkännande av hela loggflödet. Även DS-CODE-01 och UI-08 behåller sina separata visuella grindar.

Designreglernas skärmbildsmatris, stor text, skärmläsare och liten/större bredd ska redovisas. Om körmiljön saknar native-/webbrendering dokumenteras dessa som NOT TESTABLE; kodtest ersätter inte visuell QA. Telefonprovet görs i Eriks gemensamma mobil-QA efter MOTION-slicarna.

## Arkitekturskiss

- `FirstUseTip` presenterar copy och en tillgänglig avfärdandeknapp; dess hook äger läs-/sessionstatus i komponentfilen.
- `notification-storage.ts` äger nyckelvalidering, läsning, markering och radering; inga nya dependencies.
- `LogScreen` använder redan `layoutOwnerId`; denna är explicit kontoägare för tipstatus. Preview utan ett giltigt konto-ID visar inget tips och skriver ingen ägarstatus.
- Kontrollernas aktiveringscallbacks markeras explicit via en gemensam wrapper runt respektive `onPress`/`onLongPress`; samma callbackväg hanterar fysisk touch, VoiceOver/TalkBack och tangentbord. Passiv scrollning/fokus och tryck på tom yta räknas inte. Stängknappen är separat och dess aktivering gör bara avfärdning.
- Avfärdandet göms direkt i lokal state och skrivs till SecureStore. Effektens `active`-guard ogiltigförklarar gamla läsresultat; skrivningar använder alltid fångat ägar-ID och deras resultat får inte påverka en senare ägares UI.

## Berörda filer (föreslagen omfattning)

- `src/components/ui/FirstUseTip.tsx`
- `src/components/ui/index.ts`
- `src/components/README.md`
- `src/notifications/notification-storage.ts`
- `src/notifications/README.md`
- `src/features/home/ProductWorkspace.tsx` (confirmed account-delete cleanup caller)
- `src/features/puppy-log/LogScreen.tsx`
- `src/features/puppy-log/README.md`
- `tests/first-use-tip-policy.test.mjs`
- `tests/account-delete.test.mjs` (existing account-delete test suite)
- `tests/README.md`
- `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/releases/HISTORY-2026.md#motion-02`, `docs/releases/HISTORY-2026.md#motion-03`
- `docs/design/evidence/motion-03/` endast när bilder finns tillgängliga

## Acceptans och verifiering

1. Endast LogScreen visar tipset; bara efter laddning och före första avsiktliga kontrollaktivering. Det göms omedelbart.
2. Passiv scrollning/fokus lämnar tipset synligt. Fysisk kontrolltryckning, VoiceOver/TalkBack-aktivering och tangentbordsaktivering avfärdar det utan att stoppa kontrollens handling.
3. Redan sedd ägare och annan ägare isoleras; previewläge utan ägar-ID visar eller skapar ingen persistent status.
4. Bekräftad kontoradering tar bort `log`-nyckeln. All cleanup försöks även om annan lokal cleanup misslyckas; aggregerat fel går till befintlig rapportering.
5. Läs-/skrivfel sätter en volatil, ägar- och skärmspecifik spärr för resten av den aktuella appprocessen; inga återkommande tips vid remount. Processomstart gör nytt SecureStore-försök.
6. Test täcker sen läsning efter avfärdning, ägarbyte/avmontering under read/write, ägarisolering, read/write-fel, återmontering och deletion.
7. Product-copy är godkänd och Critic granskar nytta/friktion före kod. Större text och skärmläsarsemantik får ingen fokusfälla eller blockerad scroll/touch.
8. Kör fokuserade policytester, `pnpm check`, iOS-export och `git diff --check`. Oberoende QA och Reviewer ska granska implementationen. Rendering/nativeinteraktion/telefon redovisas som NOT TESTABLE tills gemensam mobil-QA.

## Granskningar

- Product: rekommenderar enbart Logg-tipset och att utelämna Hem/Hälsa; se granskning i arbetsrapporten.
- Architect: v1–v3 CHANGES on queue/scope alignment; v4 APPROVE.
- Critic: v1/v2 CHANGES; v3 PROCEED subject to path alignment; v4 PROCEED with minor duplicate-path cleanup applied.
- Compliance: granskning klar, se sparad bedömning i arbetsrapporten. Inget nytt ändamål får införas utan ny review.

## Nästa steg

Plan v4 är godkänd av Architect, Critic och Product. Implementation pågår på `motion-03-first-use-tip` enligt den lästa Tassla Consumer UX-skillen. Efter lokal QA/review checkpoint går MOTION-04 vidare enligt sitt eget kontrakt; fysisk telefon-QA samlas enligt beslut 0005.
