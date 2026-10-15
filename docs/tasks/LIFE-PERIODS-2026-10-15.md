# LIFE-PERIODS – livsperioder i MVP

Utgångspunkt: `main` vid `f1c272d13d21b2160094dcdf91eea868ccebceff` (2026-10-15 kl. 18.15 svensk tid). Beställningen är att införa tio kronologiska perioder, fem övergripande faser och separata milstolpar utan att radera sparat innehåll. Arbetskopian är isolerad från andra pågående grenar.

## Arbetsdelar och verifiering

1. **Modell och Hem** – `src/features/onboarding/life-stages.ts`, `dog.ts`, `src/features/home/*`, periodtester. Klart när tio perioder har entydiga gränser, Hem visar rätt period och saknat/ogiltigt datum hanteras. Ingen ändring av profilfält.
2. **Befintligt innehåll och progression** – `src/features/knowledge/checklist-model.ts`, tester och dokumentation. Klart när gamla ID:n, item keys, innehållsversioner och träningsprogression bevaras och historiska veckofönster översätts centralt. Ingen databasradering.
3. **Individuell seniorstatus** – endast efter beslut om källa, ansvar och användarflöde. Den centrala modellen tar redan emot individuell bedömning; nuvarande hundprofil saknar storlek, bedömning och proveniens. Ingen seniorstatus gissas av enbart ålder.
4. **Publicerat nytt innehåll** – separat redaktionellt paket med hundexpertgranskning. Nuvarande elva innehållsversioner ändras inte tyst; senare perioder saknar egna granskade artiklar.

## Gränskontrakt

Perioderna har inkluderad start och exkluderat slut: 0–<8 veckor, 8 veckor–<3 kalendermånader, 3–<6, 6–<9, 9–<18, 18–<36, 36–<84, 84–<120, 120–<156 och ≥156 kalendermånader. Formuleringen ”8–12 veckor” är en läsetikett; 12 veckor och tre kalendermånader infaller inte alltid samma dag. Åldern beräknas från kalenderdatum utan tidszonsförskjutning. De fem övergripande faserna är `VALP`, `UNGHUND`, `VUXEN`, `SENIOR` och `LIVETS_SLUTSKEDE`. För vuxna hundar från sju år utan individuell seniorbedömning kan övergripande fas vara okänd; den kronologiska perioden visas ändå. Livets slutskede kräver uttrycklig vårdkontext och följer aldrig av ålder.

`before_homecoming`, `homecoming` och `first_days_home` är milstolpar/kontext, inte åldersperioder. Den äldre checklistkontexten `before_homecoming` eller `first_days` förblir ett uttryckligt val. En hund under åtta veckor får därför ingen automatisk ”inför hemkomsten”-rekommendation.

## Korrelation till befintliga ID:n

| Sparat checklist-ID (`review-v1:`) | Ny tolkning | Bevarande |
|---|---|---|
| `before-homecoming` | Händelse före hemkomst | ID, egna punkter och bockar kvar |
| `first-days` | Händelse första dagarna hemma | ID, egna punkter och bockar kvar |
| `8-12-weeks` | Valpen flyttar hem | ID och punkter kvar |
| `3-6-months` | Den nyfikna valpen | ID och punkter kvar |
| `6-12-months` | På väg mot tonåren + del av Unghunden | ID och punkter kvar |
| `over-1-year` | Senare delen av Unghunden + alla följande perioder | ID och punkter kvar |

`dog_checklist_progress` och egna punkter refererar mallarnas ID:n. Ingen mall eller punkt döps om och ingen destruktiv migrering behövs i denna del. Den gamla veckomappningen är fortsatt 8–12, 13–25, 26–51 och ≥52 *hela* veckor. Den ligger i samma modul som periodresolvern, eftersom checklistornas befintliga veckofönster inte är likadana som kalendermånadernas gränser.

| Befintligt innehållsversion-ID (slutnummer) | Nuvarande fönster i hela veckor | Korrelation |
|---|---|---|
| `...001` inför hemkomst | 0–0, utkast | Milstolpe, bara onboarding |
| `...002` första veckan hemma | 8–12 | Valpen flyttar hem |
| `...003` vardagslogg/rutiner | 0–∞ | Tvärgående |
| `...004` trygg hantering | 13–16 | Den nyfikna valpen |
| `...005` nya miljöer | 17–26 | Nyfikna valpen, gränsen mot tonåren |
| `...006` vara själv | 27–52 | Tonåren, Unghunden |
| `...007` vikt | 0–∞ | Tvärgående hälsoguide |
| `...008` vårdhistorik | 0–∞ | Tvärgående hälsoguide |
| `...009`–`...011` träningsprogram | 8–∞ | Progressionsstyrda program, ingen kalenderstyrd nivåhöjning |

Innehålls-ID:n börjar `61000000-0000-4000-8000-0000000000` och versions-ID:n `62000000-0000-4000-8000-0000000000`, med slutnummer enligt tabellen. `content_versions.min_age_weeks/max_age_weeks` är fortsatt inkluderande heltalsveckor. `selectContent`, Home-läsningen och serverkontrollen för vald dag använder samma befintliga veckofönster. Det bevarar publiceringsurval, äldre framsteg och träningssteg. Framtida innehåll för de senare perioderna behöver egna godkända versioner, inte nya texter på befintliga ID:n.

## Genomgång av flöden

| Område | Nuvarande beroende | Åtgärd |
|---|---|---|
| Hundprofil/onboarding | födelsedatum, ras-ID; ålder i veckor | gemensam resolver, ingen ny insamling |
| Hem | separat grov 3-fasberäkning | visar en av tio kronologiska perioder |
| Artiklar/Kunskap | publiceringsstatus, ras och inkluderande veckointervall | gamla fönster/ID:n kvar; mappning ovan |
| Checklistor | sex mallar och tre sparade kontextvärden | samma mall-ID:n, central vecköversättning |
| Träning | programversion och stegprogression; åldersfönster för tillgänglighet | oförändrad progression och serverkontroll |
| Hälsa och påminnelser | ägarregistrerade datum/tider, ingen livsfasstyrning | ingen migrering eller klinisk tidtabell |
| Tester | gränser 7/8/13/26/52 och innehålls-ID:n | nya periodgränser testas separat |

## Kvarstående beslut och spärrar

Raslistan innehåller bara ID och namn, hundprofilen saknar storlek och en individuell seniorbedömning. En automatisk seniorgräns per ras skulle därför bygga på data som ännu inte finns och kräver sakkunnigt granskade riktvärden. Detsamma gäller nytt material för senioråren. Destruktiva migreringar av checklistor eller innehåll ska läggas fram för uttryckligt godkännande innan de körs.
