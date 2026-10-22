# FLOW-KNOWLEDGE-01 — Kunskap från sökning till källmärkt läsning

Datum: 2026-10-22 · Plan v3 · Panel 7 enligt `vision_rev02.jpg`.

## Användaruppgift och målbild

Hundägaren ska hitta en relevant guide, öppna dess fulltext och källa, och nå FAQ eller en faschecklista i samma Kunskapsresa. Panel 7 visar vänstertitel, sökfält, ämnesfilter endast när datan stöder dem, ett stort guidkort, två mindre kort och tydliga separata ingångar till Checklistor och FAQ.

## Faktiskt datakontrakt och urval

- `fetchHomeContent` returnerar redan laddat, publicerat urval för aktiv hund och åldersfas. Kunskapens guideurval är uttryckligen `contentType === 'article' || contentType === 'guide'`; `checklist` och `training_program` får inte bli sökresultat eller guidkort.
- Datakällan ger ingen rekommendationsrangordning eller ämnestaxonomi. Sortera guidekort deterministiskt efter svensk titel och märk inte första kortet som rekommenderat. Första kortet är endast visuellt större enligt panelen. Visa inga ämneschips förrän taxonomin finns.
- Startsidan visar ett större första guidkort, högst två mindre kort och `Visa alla` när fler än tre guider finns. `Visa alla` öppnar alla guider i samma vy. Aktiv sökning söker hela guideurvalet, visar neutralt antal resultat och håller varje träff nåbar; sökträff får aldrig markeras rekommenderad. Sökning omfattar titel och parsad text i det redan laddade urvalet, inte serversökning.
- Tomt publicerat guideurval skiljs från sökning utan träffar och från innehållsladdning/-fel. FAQ och Checklistor får alltid egna destinationer även om guideurvalet är tomt.
- Bildspråket ska vara ämnesrelevant. Lägg till ett explicit `contentId:version`-manifest i appens `editorial-image-assignment.ts` för de sex godkända artikelguiderna. Id:n och version 1 nedan kommer från `supabase/content/publish-mvp-content-v1.sql`, som är enbart läskälla i denna slice och får inte ändras eller köras.

  | `contentId` (`content_version` version 1) | Bildasset |
  |---|---|
  | `61000000-0000-4000-8000-000000000002` (`first-week`) | `knowledge-card-puppy-sheltie-window.jpg` |
  | `61000000-0000-4000-8000-000000000003` (`daily-log-routines`) | `knowledge-card-puppy-cocker-coast.jpg` |
  | `61000000-0000-4000-8000-000000000004` (`handling-guide`) | `knowledge-guide-handling.jpg` |
  | `61000000-0000-4000-8000-000000000006` (`being-alone-guide`) | `puppy-resting-carousel.png` |
  | `61000000-0000-4000-8000-000000000007` (`weight-history-guide`) | `knowledge-guide-weight.jpg` |
  | `61000000-0000-4000-8000-000000000008` (`health-records-guide`) | `knowledge-guide-vet.jpg` |

  Återanvänd inte samma bild inom samma tillgängliga hund-/åldersurval. Behåll befintliga uttryckliga `review-v1:training:*`-bilder och samma icke-null bildfunktion för HomeCarousel. Lägg till en separat nullable Knowledge-lookup som använder endast sexmappsmanifestet: framtida guider utan manifest visas som textkort utan bild tills en relevant asset mappats, aldrig med hashfoto från en annan guide.
- Generera tre nya, separata dekorativa hundbilder: frivillig lugn hantering i hemmet; en hund stående avslappnat i helfigur i neutralt hemmaljus; en lugn, positiv veterinärkontakt utan behandling/nålar/medicinskt påstående. De kombineras enligt manifestet med befintliga bilder för hemstart, vardagsaktivitet och ensamhet. Bilderna föreställer inte användarens hund eller verifierad händelse. Lägg till spårbar genereringsprompt, källa, filstorlek, crop och dekorativ VoiceOver/TalkBack-fallback i `assets/images/README.md`.

## Publicering, checklistor och beslut

- Faschecklistmallarna har alla `review-v1`-identiteter och visas bara när `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true`. Utan flaggan visar appen korrekt att inga checklistor är publicerade och gör inga checklistanrop. Ikonförbättringen påverkar endast märkta syntetiska review-mallar; den skapar inte en produktionskatalog eller publicerat sakgranskat innehåll. Hundexpertkontroll krävs innan checklistoråden exponeras offentligt. Denna slice validerar i public-läge att otillgängligheten är tydlig och i review-läge hela checklistresan; full produktionschecklista är fortsatt öppen.
- Checklistans fasprogress, ägarens egna punkter, FAQ-publiceringsgräns, källor och review-flagga förblir intakta. Checklistpunkter och dagliga rutiner behåller olika betydelse och ägarskap; de delar bara den visuella ikon-/radgrammatiken. Inga valbara eller persistenta ikoner för egna Kunskapspunkter införs eftersom modellen saknar ikonfält.
- Tilldela varje befintlig review-mallspunkt en fast semantisk Ionicons-ikon via explicit nyckelkarta; okänd eller egen punkt får neutral `list-outline`. Validera alla glyphnamn mot installerade `@expo/vector-icons` 15.0.2. ChecklistIteminnehavare utan `leadingIcon` behåller exakt nuvarande utseende och beteende.
- Söktext scope:as till session/konto och hund, töms om scope byts och bevaras när en guide öppnas och när ägaren backar. FAQ och faschecklista fortsätter använda sina befintliga flöden. Ingen ny persistens, RPC, tabell, migration eller dataanvändning.

## Navigation som måste bevaras

- Bevara inkommande `focusedContentId`, `CHECKLIST_DESTINATION_ID`, `FAQ_DESTINATION_ID`, `onSelectContent`, `onDetailChange`, `returnToTraining` och `returnToDevelopment`.
- Kort och sök visar endast article/guide. En redan inkommande `focusedContentId` fortsätter öppna exakt samma `HomeContent`-rad via nuvarande ID så befintliga Träning-/Hem-djuplänkar inte går förlorade.
- Guide/back ska lämna sökfråga och vald guidevy intakta. FAQ/faschecklista ska återgå till Kunskap och fortsätta avbryta/invalidera läsning och mutation enligt befintlig checklistlogik. Tillbaka till Utveckling/Träning ska fortsätta landa i rätt huvudskärm.
- `FAQScreen.tsx`, `guide-search.ts`, innehålls- och datalager skrivs inte om utan ny planreview om exakt behov uppstår.

## Exakta skrivvägar

- App: `src/features/knowledge/KnowledgeScreen.tsx`, `src/features/knowledge/PuppyChecklistScreen.tsx`, `src/features/knowledge/editorial-image-assignment.ts`, `src/components/ui/ChecklistItem.tsx`, `src/features/knowledge/README.md`, `assets/images/knowledge-guide-handling.jpg`, `assets/images/knowledge-guide-weight.jpg`, `assets/images/knowledge-guide-vet.jpg`, `assets/images/README.md`.
- Presentationstester: `tests/knowledge-search-screen.test.mjs`, `tests/checklist-ui.test.mjs`. Kunskapstestet verifierar alla sex explicita `contentId:version`-nycklar/bilder, de tre befintliga `review-v1:training:*`-bilderna, nullable lookup för okänd guide och textkort utan bild när guide saknar manifest.
- Koordinator: denna plan, `docs/tasks/dev/FLOW-KNOWLEDGE-01.md`, `docs/tasks/dev/queue.json`, `docs/tasks/dev/rapport.md`, `docs/design/evidence/flow-knowledge-01/VERIFICATION.md`, `docs/design/evidence/flow-knowledge-01/public/`, `docs/design/evidence/flow-knowledge-01/review/`.
- Koordinatorn skriver gemensamma kö-/rapport-/evidensregister sekventiellt; appskrivare delar inte dessa koordinatorytor.

## Visuell och funktionell acceptans

1. Vid 375/430 pt visas sökfält, ett större guidkort, högst två mindre kort, separata FAQ-/Checklistor-ingångar och vid fler än tre guider en `Visa alla`-åtgärd utan horisontell klippning. 375×667 och 140 %-proxy scrollar naturligt.
2. Startsökning inkluderar endast faktiska publicerade article/guide-objekt för aktiv hund/ålder. Sökning, Visa alla och tillbaka gör hela det laddade guideurvalet nåbart; inga chips eller rekommendationslöften saknar dataunderlag.
3. Distinkta lägen för laddning, innehållsfel, inga publicerade guider och noll sökträffar. Sökfråga är kvar efter artikelöppning/back och rensas vid konto-/hundbyte.
4. Öppna guide använder exakt laddat `HomeContent`-id/version med fulltext/källor och bevarar inkommande retur till Träning/Utveckling. FAQ och checklistdestinationer öppnas, återgår och behåller review-/cache-scope.
5. Review-checklistans redaktionella ikoner och checkboxrad känns besläktade med Hem men inte dubblar dess rutinsemantik. Egen punkt får neutral ikon. ChecklistItem i befintliga Tränings- och komponentgallerianrop utan ikon är oförändrad.
6. Testa preset-bock, custom save/update/delete, fasval och tidigare bekräftad data vid både `failed` och `unknown`; draft och konto/hund/review-scope bevaras, okänd skrivning kräver befintlig Kontrollera. Sök-/guide-/FAQ-checklistnavigation får inte ändra mutationer.
7. Färska public/review-render jämförs med rev02 panel 7 vid 375×844, 430×844, 375×667 och 140 %-proxy. Alla sex godkända guider har uttryckliga relevanta bilder; varje förekomst av ett omappat framtida guide-id är textbaserad och registrerad i §14. Dekorativa bilder är dolda från hjälpmedel. Fyll i §14 separat. Saknad renderer/native prova är NOT TESTABLE; ingen full panel-7-bildacceptans utan dessa captures.

Riskklass H — behåller befintlig konto-/hundscope:ad läsning och checklista-writes samtidigt som review/public-gräns påverkas. Security-review före implementation och slutlig review granskar scope, stale responses, review-gating före läsning/skrivning, cache, dog/account-isolering och inget publiceringsläckage. Live RLS är NOT TESTABLE om rätt utvecklingsmiljö saknas. Compliance är inte tillämplig eftersom ändamål, mottagare, lagring och datafält inte ändras. Dog expert-review är inte tillämplig på ikonpresentation av oförändrade, review-only fixtures; sakgranskning krävs före offentlig checklista.

Critic måste godkänna exakta produktbeslut och sök-/tomlägen före implementation. Architect och Security granskar denna version före köstatus `ready`.

Skills: `tassla-consumer-ux`, `mobile-ios-design`; `docs/design-rules.md` §§0–4 och 14.
