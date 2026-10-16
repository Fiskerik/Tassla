# MVP v2 — relevansmatris för befintligt innehåll (V2-01)

Status: dokumentationskontrakt, baserat på `main` @ `00d4d4a3e38c08a6bb7d4c541cc509457126276f`. Innehållsfakta kommer från [`mvp-content-bundle-v1.json`](mvp-content-bundle-v1.json), ägarens v1-bekräftelse från [`mvp-content-approval-v1.md`](mvp-content-approval-v1.md), och fältgränser från [`mvp-content-review-v1.md`](mvp-content-review-v1.md). Ingen contentversion eller runtime ändras här.

## Urvalskontrakt

Eligibility och redaktionell relevans är två separata grindar:

1. Eligibility: versionen är publicerad och uppfyller exakt publicerat ålders- och rasvillkor. Draft är aldrig publicerat.
2. Relevans: versionen passar uttryckligen hundens behov/kontext och tillåten visningsyta. Funktionshjälp är inte automatiskt hundråd. Expertgodkännande av v1 betyder inte automatiskt godkännande för vuxen tillämpning.
3. Ordning: Main dokumenterar ännu ingen redaktionell prioritet eller tie-break för automatiska personliga rekommendationer. V2-01 fastställer därför inte vilken av flera relevanta kandidater som ska rekommenderas först; den luckan kräver en separat, ägargranskad produktregel före sådan implementation. Användarstyrd katalog, sökning och filter får visa publicerat innehåll först när både eligibility och godkänd redaktionell målgrupp/visningsyta matchar. Vuxenråd och vuxenträning kräver dessutom versionsspecifik Dog Expert-bedömning av vuxentillämpning. För innehåll som passerat grindarna används neutral svensk titelordning stigande, med stabil slug som tie-break; den ordningen är inte en personlig rekommendation. Databasens indataordning är inte en godkänd urvalsregel.
4. Tomt/fel: om inget objekt är relevant visas ärligt att inget personligt förslag passar; läsfel/okänd källa visas som fel eller okänt, inte som tomt publicerat urval.

Nuvarande Main-schema/runtime har publiceringsstatus, innehållsversion, ålder och ras, men saknar deklarerad redaktionell målgrupp, behovsprioritet, hemmekontext och stabil prioritet. Denna matris definierar inte ett nytt schema eller runtime-urval.

## Inventering

| Innehåll | Version / status | Publicerad eligibility | Redaktionell roll och yta | 11 veckor | 5 år / adult-gate |
|---|---|---|---|---|---|
| `before-homecoming` | v1 `...0001`, draft | Ålder 0–0; inga rasmål; `onboarding-only` i bundle | Förberedelse före hemkomst; saknar godkänd runtime-kontekstväg | Får inte visas som publicerat; kräver separat onboarding-kontext | Inte relevant |
| `first-week` | v1 `...0002`, published | 8–12 veckor; inga rasmål | Valpguide; texten förutsätter nylig hemkomst. Ingen sådan signal finns i Main-profilen. | Åldern matchar, men får inte bli personlig rekommendation enbart av ålder. Kandidat först med bekräftad hemkomstkontext. | Åldern matchar inte; exkludera |
| `daily-log-routines` | v1 `...0003`, published | 0+; inga rasmål | Appfunktionshjälp för Logg/rutiner; inte hundråd | Nära funktionen vid behov | Kan visas som funktionshjälp, inte som vuxenrelevant hundråd |
| `handling-guide` | v1 `...0004`, published | 13–16 veckor; inga rasmål | Valpspecifik hanteringsguide | Exkludera på ålder | Exkludera på ålder; ändra inte fönstret tyst |
| `environment-checklist` | v1 `...0005`, published | 17–26 veckor; inga rasmål | Valpspecifik miljöchecklista | Exkludera på ålder | Exkludera på ålder; ändra inte fönstret tyst |
| `being-alone-guide` | v1 `...0006`, published | 27–52 veckor; inga rasmål | Valpspecifik ensamhetsguide | Exkludera på ålder | Exkludera på ålder; ändra inte fönstret tyst |
| `weight-history-guide` | v1 `...0007`, published | 0+; inga rasmål | Hjälp för viktregistrering/historik i Hälsa; inte bedömning av lämplig vikt | Visa i relevant funktionskontext | Visa endast som funktionshjälp; inte som individuell vikt- eller hälsorådgivning |
| `health-records-guide` | v1 `...0008`, published | 0+; inga rasmål | Hjälp att registrera utförd vaccination/veterinärhändelse | Visa i motsvarande registreringskontext | Funktionshjälp är möjlig; inga automatiska schema- eller hälsopåståenden |
| `handling-program` | v1 `...0009`, published | 8+; maxålder saknas; inga rasmål | Träningsprogram; v1-expertkontroll bekräftad av ägaren, men adult applicability inte specificerad per version | Tekniskt åldersvalbart; kräver relevant valt behov | Inte vuxengodkänt enbart av öppet intervall; kräver per-versions Dog Expert-bedömning av målgrupp och begränsningar |
| `environment-program` | v1 `...0010`, published | 8+; maxålder saknas; inga rasmål | Träningsprogram; v1-expertkontroll bekräftad av ägaren, men adult applicability inte specificerad per version | Tekniskt åldersvalbart; kräver relevant valt behov | Inte vuxengodkänt enbart av öppet intervall; kräver per-versions Dog Expert-bedömning |
| `being-alone-program` | v1 `...0011`, published | 8+; maxålder saknas; inga rasmål | Träningsprogram; v1-expertkontroll bekräftad av ägaren, men adult applicability inte specificerad per version | Tekniskt åldersvalbart; kräver relevant valt behov | Inte vuxengodkänt enbart av öppet intervall; särskild Dog Expert-bedömning av målgrupp, progression, begränsningar och när ägaren bör söka professionell hjälp krävs |

Versionssuffixen ovan motsvarar de fullständiga ID:n i bundle (`62000000-0000-4000-8000-00000000000N`). Bundle och approval record innehåller tio publicerade versioner. `before-homecoming` är fortfarande draft. `mvp-content-approval-v1.md` registrerar att Erik 2026-10-08 bekräftade att v1-bundlen var expertverifierad; granskningsmallen har fält för sakgranskare, datum och bedömning men de individuella fälten är tomma. Bekräftelsen dokumenterar v1-scope och bevisar inte adult applicability.

## Syntetiska acceptansfall

- 11 veckor, ingen hemkomstsignal: `first-week` visas inte som personlig Hem-rekommendation bara för att åldern matchar.
- 11 veckor, bekräftad nylig hemkomst: `first-week` kan vara kandidat efter publicerings-/ålderskontroll; Main saknar för närvarande runtime-signalen.
- 5 år, tom historik: valpguider filtreras bort; appmanualer förekommer endast nära motsvarande funktion; inget vuxengodkänt hundråd innebär ärligt tomläge.
- Vuxenhund med valt träningsbehov: program väljs bara efter adult applicability-review för exakt version.
- Samma kvalificerade kandidater i olika databasordning: automatiskt personligt rekommenderat innehåll är odefinierat tills ägargranskad prioritet/tie-break finns. Användarstyrd katalog/sökning/filter får bara innehålla publicerat innehåll som passerat eligibility-, målgrupps- och visningsytegrindarna; vuxenråd och vuxenträning kräver dessutom versionsspecifik Dog Expert-bedömning. De godkända resultaten sorteras på svensk titel stigande och slug som stabil tie-break; detta får inte beskrivas som personlig ranking.
- Draft, läsfel och saknad metadata går till separata, sanningsenliga statusar.

## Öppna grindar

- Dog Expert behöver granska adult applicability för `handling-guide` v1 `...0004`, `environment-checklist` v1 `...0005`, `being-alone-guide` v1 `...0006`, `handling-program` v1 `...0009`, `environment-program` v1 `...0010` och `being-alone-program` v1 `...0011` innan de visas som adult råd/träning.
- Ägarbekräftad hemkomstdag eller motsvarande signal krävs om `first-week` ska rekommenderas automatiskt.
- Adultpilotens innehållsmål om minst tre objekt och vuxenresans minsta ett objekt är skilda nivåer; exakt pilotgrind ska beslutas innan rekrytering eller publicering.
- Inga publicerade texter, versionsstatusar, schemafält, profilfält, datainsamling eller runtimeurval ändras i V2-01.
