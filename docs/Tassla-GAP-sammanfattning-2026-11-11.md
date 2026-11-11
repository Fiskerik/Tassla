# Tassla – GAP-analys i sammanfattning

**Datum:** 2026-11-11
**Repo:** [Fiskerik/Tassla](https://github.com/Fiskerik/Tassla), `main` @ `b294d15`
**Granskat:** dagens commits `9fab614` (framstegsstapel i träningsvyn) och `b294d15` (merge av PR #42, 15 commits, 339 filer, +8 680/−471)

## Metod och begränsningar

- Repot klonades i sandbox. Kod, innehållsfiler, dokumentation och de renderade skärmdumparna i `docs/design/evidence/` lästes.
- `typecheck`, `lint` och testsviten kördes: alla gröna (931 av 932 tester, 1 skippat).
- Appen har **inte** körts på telefon eller simulator, och Supabase har inte nåtts. Bedömningar av "känsla" bygger på kod och skärmdumpar. Vad som är publicerat i live-databasen är okänt.

## Övergripande bedömning

Tekniskt och processmässigt är projektet ovanligt noggrant, men noggrannheten ligger på fel ställen. Felhantering, sanningsenlighet och kantfall är gjorda i detalj. Det som får en valpägare att öppna appen igen är tunnast: innehåll, den egna hunden, snabb loggning och personlighet.

Dagens commit `9fab614` är typisk. Cirka 20 rader appkod fick fem granskningsroller, en task-fil, 108 rader verifieringsskript och 10 skärmdumpar, medan de stora luckorna nedan ligger orörda.

## 1. Det som får appen att kännas "AI"

| Område | Fynd | Förslag |
|---|---|---|
| Bilder | `assets/images/README.md` dokumenterar bilderna som AI-genererade. Hem visar en golden retriever-valp som placeholder, inte användarens hund. Maskoten är clip-art i annan stil än fotona. | Användarens egen bild på Hem. För redaktionella bilder: riktiga licensierade foton eller en enhetlig, människoskapad illustrationsstil. |
| Text | Systemspråk, t.ex. "Den senaste ändringen behöver kontrolleras. Den räknas inte som sparad ännu." Notisen är "En påminnelse från Tassla". | Röstguide på tre meningar. Fel i två lager: mänsklig rad först, detaljer bakom "Visa mer". Låt ägaren välja att visa hundens namn i notiser. |
| AI-märkning | "AI-genererat innehåll" visas i Träning, Utveckling och Kunskap. Checklistläsaren kräver `is_ai_generated === true`. Varje checklista har 3 punkter. | Låt en människa med namn och kompetens skriva eller omskriva texten och märk "Granskad av …". Ta inte bort märkningen utan det, och låt compliance granska formuleringen. |
| Formspråk | Systemtypsnitt överallt, creme/grön wellness-palett, Hem som tre likvärdiga kort med chevron. | Eget rubrik-typsnitt (`expo-font` finns redan), en egen accentfärg och ett återkommande motiv. |

## 2. Användarupplevelse

- **Tom första dag.** Ingen förifylld rutin hittades. Förslag: åldersanpassade rutinförslag som läggs till med ett tryck.
- **Ingen egen hund i bild.** Fotofunktion saknas. Minsta steg: foto lagrat bara på telefonen. Kräver troligen ett bildvalspaket (nytt beroende, kräver Eriks godkännande).
- **Inloggning.** Google på primärkontot utlöser App Stores regel 4.8, som kräver ett likvärdigt alternativ. Sign in with Apple är det säkra. Om enbart e-postlänk räknas som likvärdigt är oklart. Magic link innebär appbyte, så ompröva e-postkod (OTP).
- **Nattläge saknas.** Appen är låst till ljust läge, men valpägare loggar på natten.
- **Android saknas.** Distributionen går via uppfödarens QR, så en köpare med Android når en återvändsgränd. Ett beslut behövs.
- **Delat hushåll saknas.** Datamodellen är ägarbaserad, och det blir dyrare att lägga till i efterhand. Besluta tidigt.

## 3. Smidigt och tillfredsställande

- **Snabbloggen är inte "Tryck → klart".** I `LogScreen.tsx:330` är alla plattor avstängda tills föregående skrivning är serverbekräftad, och det finns ingen offlinekö. Haptik och animation spelas först efter bekräftelse.
  - *Förslag:* visa raden direkt med klientgenererat ID (idempotenta mutations-ID:n finns redan), diskret "synkar"-markör, offlinekö och haptik vid tryck. Räkna bara bekräftat i ringen. **Största enskilda förbättringen av känslan.**
- **Handbyggd navigation.** En enda route (`/` → `AppFlow`), egna `PanResponder`-gester och `ProductWorkspace.tsx` på 4 290 rader med cirka 60 `useState`. Risker: ingen native swipe-back, inga djuplänkar, långsammare utveckling. Flytta stackskärmar stegvis till Expo Router och dela upp workspace.
- **Nästan inget firande.** Ringanimation och lätt haptik finns, men inga "stora ögonblick". Förslag: några få sällsynta ögonblick (första loggen, första veckan, tandbyte, 1 år) med delbart kort. Undvik streak-straff, räkna hellre "dagar ni gjort något tillsammans".
- **Hem saknar huvudkort.** BabyJourney-känslan kommer från ett tydligt veckokort ("Vecka 12 med Luna"). Det kräver innehåll.

## 4. Innehåll

**Nuläge (bundle v1):**
- Tio publicerade poster: sex guider (tre av dem förklarar bara hur Tassla används), en checklista och tre träningsprogram.
- Ålderstäckning: 8–12, 13–16, 17–26 (checklista) och 27–52 veckor. Inget för vuxna eller seniora.
- FAQ (4 st) och fasschecklistor (6 × 3 punkter) är utkast och AI-flaggade. Inkallningsprogrammet saknar mänsklig slutgranskning.
- Källorna är brittiska och amerikanska (RSPCA, AVSAB, MSD, Dogs Trust, VCA, PDSA).
- Visionen "varje inloggning visar nytt innehåll" går inte att uppfylla med denna volym.

**Vad hundägare vill ha (generellt, inte bara valp):**
- **Vardag:** matmängd, sömnlängd, promenad med tid och sträcka (fält saknas).
- **Hälsa:** viktkurva, återkommande ägarvalda påminnelser (fästing, avmaskning), giftiga ämnen som snabbreferens, samlad plats för försäkrings- och chipnummer.
- **Svensk vardag:** noll träffar på försäkring, fästing, huggorm och ID-märkning/registrering.
- **Livsfaser:** tonår (6–18 månader), vuxen och senior.
- **Minnen:** foto, tidslinje, "Året med X".
- **Praktik:** jourveterinär, hundkurs, resa.

**Förslag i ordning:**
1. **Veckospine 8–52.** Ett kort, människoskrivet kort per vecka (cirka 150 ord) med en handling som länkar till träningssteg eller checklista. Cirka 45 kort.
2. **Svensk basuppsättning (cirka 10):** ID-märkning/registrering, försäkring (neutralt), fästing, huggorm, kopplingstvång, vaccinationsöversikt, giftigt, första veterinärbesöket, valpkurs, bilresa. Svenska källor (t.ex. SKK, Jordbruksverket, SLU), verifierade av redaktör.
3. **Frigör `before-homecoming`.** Den är kvar som utkast eftersom databasen saknar kontextfält, men det är då utrustning (ArkenZoo) och försäkring (Agria) har högst köpavsikt. Intäktsben 1 (försäkring) har idag ingen ingång i appen.
4. **Redaktionell kapacitet.** En namngiven redaktör (hundinstruktör eller veterinär) plus Drive-synken (`sync-drive-articles.yml`) som redan finns.

## 5. Övrigt att tänka på

- **Testerna säger mindre än de verkar.** 73 av 112 testfiler läser filer som text, och stickprovet matchar regex mot JSX-källa. Det bevisar inte beteende, och komponent- och E2E-tester saknas. Lägg till 3–5 Maestro-flöden (login → profil → logga → träningssteg → radera konto).
- **Process i förhållande till värde.** AGENTS.md är 26 kB med tio agentroller. Använd den befintliga riskklass-principen: copy och visuella justeringar rakt till merge med skärmdump, full gate bara för hälsodata, auth och radering.
- **Inga verkliga användare i underlaget.** Haptik, gester och Dynamic Type är NOT TESTABLE i projektets egna dokument. Låt fem valpägare testa via TestFlight och studera deras första tio minuter.
- **Widget.** Lös integritetsfrågan genom att inte visa hundnamn, bara ikonerna Kiss/Bajs.
- **Behåll det som redan är bra:** ärliga laddnings- och felstatus, respekt för reducerad rörelse, idempotenta omförsök, raderingsflöde med 30 dagars gallring och källspårning per påstående (`claim_trace`).

## Prioriterad lista

| # | Åtgärd | Varför | Storlek (grov) |
|---|---|---|---|
| 1 | Direktvisad snabblogg + offlinekö | Kärnan i "Tryck → klart" | M |
| 2 | Egen hundbild lokalt på Hem | Känsla, motverkar AI-look | S–M |
| 3 | Förifyllda åldersrutiner | Tom första dag | S |
| 4 | Röst- och felmikrocopy-pass, notistext | Systemspråk → människa | S |
| 5 | Sign in with Apple (+ e-postkod) | Releaserisk och friktion | S–M |
| 6 | Veckospine 8–52 + svensk basuppsättning | Återkomst | L (redaktionellt) |
| 7 | Byt AI-foton mot illustrationsstil eller riktiga foton | AI-känsla | M |
| 8 | Frigör `before-homecoming`, försäkringsingång | Intäkt | M |
| 9 | Nattläge | Verklig användning | S–M |
| 10 | Test med 5 ägare + Maestro-smoke | Känsla går inte att läsa ur kod | S |
| Beslut | Android, hushållsdelning | Distribution och datamodell | — |

*Storlekarna är grova uppskattningar (S/M/L), inte planerad tid.*
