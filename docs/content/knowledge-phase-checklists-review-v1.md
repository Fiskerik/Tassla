# Kunskap: faschecklistor v1 — innehållsgranskning

Status: **DOG EXPERT PASS — remains unpublished**
Bundle: `docs/content/knowledge-phase-checklists-v1.json`
Scope: six phase intros, six age/context mappings, eighteen existing item keys, item and version-level source refs.

## Granskningsrundor

### Runda 1 — 2026-10-26

Dog Expert granskade den första sammansatta JSON-versionen mot källsammanfattningar. Granskaren kunde inte själv öppna URL:erna; bedömningen var rådgivande och inte ett publiceringsgodkännande. Tre punkter saknade tillräckligt stöd (`routine`, `adapt`, `play`). Fynden korrigerades före den slutliga rundan. De gamla formuleringarna får inte importeras.

### Källor som öppnats för den korrigerade rundan

| ID | Källa | Granskningsomfång |
|---|---|---|
| `rspca-puppy-care` | [RSPCA — Caring for your puppy](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/puppycare) | Valpspecifika punkter om lugn vila, förberedelser, gradvis hantering och att hitta veterinär. Ingen vårdplan eller veterinär tidsgräns förs över. |
| `rspca-environment` | [RSPCA — Creating a good home for your dog](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment) | Ostörd viloplats, säker reträtt och risker i hemmiljön för hundar. |
| `rspca-left-alone` | [RSPCA — How to train your dog to stay home alone](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/leftalone) | Gradvis och individuell ensamhetsträning; backa vid oro. Ingen fast tidsplan. |
| `rspca-come-when-called` | [RSPCA — Train your dog to come when called](https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/come) | Belöningsbaserad inkallning på säker plats/långlina och stegvis ökat avstånd. |
| `dogstrust-routine` | [Dogs Trust — How to get your dog into a routine](https://www.dogstrust.org.uk/dog-advice/training/home/create-routine) | Förutsägbara rutiner kan hjälpa hunden att förutse vardagen; anpassa schemat till hushållet och ta hänsyn till bland annat mat, promenader och vila. |
| `avsab-humane-2021` | [AVSAB — Position Statement on Humane Dog Training](https://avsab.org/wp-content/uploads/2021/08/AVSAB-Humane-Dog-Training-Position-Statement-2021.pdf) | Belöningsbaserade metoder för vanlig hundträning; aversiva metoder ska undvikas. Position statement, inte individuell behandlingsplan. |
| `avsab-socialization` | [AVSAB — Puppy Socialization Position Statement](https://avsab.org/wp-content/uploads/2024/12/Puppy-Socialization-Position-Statement-FINAL.pdf) | Säkra, positiva exponeringar utan överstimulering. Amerikanska vaccin-/kursintervall används inte som svensk rekommendation. |

Källsidorna öppnades av koordinatorn den 2026-10-26. Dog Expert kan inte själv öppna sidorna i granskningsmiljön; dess nästa omdöme måste därför tydligt ange att det bygger på dessa kontrollerade källutdrag och inte är en oberoende källöppning. Ingen veterinär har därmed godkänt innehållet.

## Exakt granskning av korrigerad bundle

Dog Expert läste om hela aktuella JSON-filen den 2026-10-26 efter att copy och källrefar korrigerats. Alla faser, intros och 18 punkter fick **PASS**. Inga `NEEDS CAVEAT`, `UNSUPPORTED` eller `UNSAFE` återstår mot de kontrollerade källuppgifterna. Granskaren bekräftade att ID:n, kontexter, åldersfönster, positionsordning och stabila nycklar matchar D3, och att fasernas källistor exakt motsvarar punktrefarna.

| Fas | Resultat |
|---|---|
| `before_homecoming` | 3/3 punkter PASS; intro PASS |
| `first_days` | 3/3 punkter PASS; intro PASS |
| `8-12-weeks` | 3/3 punkter PASS; intro PASS |
| `3-6-months` | 3/3 punkter PASS; intro PASS |
| `6-12-months` | 3/3 punkter PASS; intro PASS |
| `over-1-year` | 3/3 punkter PASS; intro PASS |

Alla punkter har item-nivå-källrefar i JSON. Reviewed payload SHA-256: `3835d86531ea3ecd7450bdb982e4c2b0cead2be55e0b6ad54434125f9a61e7a8`. Digesten beräknas på JSON-objektet `{sources, templates}` med sorterade nycklar och kompakt UTF-8-serialisering; endast workflowstatus/reviewmetadata är exkluderad. Det gör att statusmetadata kan ändras utan att den granskade copy-/källpayloaden byts ut.

Granskarens begränsning kvarstår: Dog Expert kunde inte själv öppna URL:erna. Koordinatorn öppnade de officiella sidorna och lämnade kontrollerade sammanfattningar; bedömningen är mot dessa sammanfattningar, inte en oberoende källöppning. Detta är innehållsgranskning, inte veterinärsignoff eller ägarens publiceringsgodkännande.

Stabil template-identitet och samtliga arton `item_key`-värden bevaras. Copy använder inga individuella hundnamn eller hundpronomen. Åldersfönstren är urvalsmetadata, inte milstolpar. JSON-bundlen är markerad `reviewed`; samtliga databaseversioner ligger kvar i `draft` i importfilen tills en separat import körs.

## Ägarbeslut och begränsningar

- Denna granskning gäller endast den nya faschecklistkatalogen. Den ersätter inte separat veterinärgranskning av artiklarna.
- Ägarens acceptans av runtime-/RLS-verifiering för Insikter (D2), granskade milstolps-/sömnkällor (D5), native/runtime-kontroll av hundradering och den separata checklistbock-granskningen är avgränsningsbeslut. Det är inte verifieringsresultat och ändrar inte denna innehållsgrind.
- Den fristående SQL-proben är en lokal/disposable kontroll. Den körs inte mot live Supabase.
