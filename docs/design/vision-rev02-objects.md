# Vision rev02 — produktobjekt och innehållskontrakt

Version 1.0, 2026-10-13. Status: byggunderlag. Befintliga källor är kodverifierade; föreslagna objekt är ännu inte API:er eller databasändringar.

**Aktuell status 2026-10-13:** Inventeringen nedan beskriver kodens startläge före de nya profiländringarna. R02-2 är `done` i den lokala kön; v11 fick Home-QA PASS och Reviewer PASS för public/review-rendering. Supabase/RLS-runtime, gallring/scheduler och tvåsessionsprov kvarstår som NOT TESTABLE. Ägarbeslut om dagsuppgifter: ägaren markerar egna rutiner; träning härleds från sparad träningsprogress; guideöppning, vårdplan och olänkad logg räknas inte. Valbar åldersvisning finns i Slice A:s appkod och migration; statisk QA PASS, Reviewer PASS och Security APPROVE. Verklig databas/RLS-runtime är fortsatt blockerad. Sökbar rassnapshot och Mix-delraser är blockerade: Erik har valt Wikidata CC0 men exportfrågan returnerar HTTP 403 i miljön. Se [profilplanen](../tasks/dev/vision-rev02-dog-profile-v2.md), [renderingsunderlaget](evidence/vision-rev02/dog-profile/README.md), [paketstatus](../tasks/VISION-REV02.md) och [preciserat Hem-kontrakt](../plans/HOME-REV02-visual-ux-spec.md). Presentationstitel, fotoexempel och färgroller får inte ändra dessa datakällor.

## Gemensam betydelse

**Loggat** = ägarregistrerad händelse. **Planerat** = framtida avsikt. **Markerat klart** = uttrycklig bekräftad markering. **Härlett** = beräknad presentation från identifierade källor. Ingen av dessa betyder automatiskt verifierad färdighet, välmående eller att en vårdåtgärd utförts.

Behåll separata källor och bygg gemensamma läsvyer. Skapa inte en universell completed-flagga på alla händelser och inte en andra kopia av tränings-/checklistprogress. En ny vardagsuppgift som saknar källa behöver däremot explicit persistens för att överleva appstart och kunna ge verklig dagsprogress.

## Inventering: vad som faktiskt finns

| Objekt | Befintlig källa | Får uttrycka | Får inte antas |
|---|---|---|---|
| Hundidentitet | `OwnedDog` i `src/data/app-data.ts`, `dogs`: id/name/breed_id/birth_date/age_display_unit | Namn, ras, härledd levnadsålder och ägarens presentationsval | Foto, flera hundar per ägare eller utvecklingsobservationer |
| Hundprofilens planerade Mix-utökning | Profilplan v8: två nullable Mix-ras-ID:n på samma `dogs`-rad | Ägarens uppgift om två kända delraser | Delraser får inte påverka innehållsurval. Katalog/Mix är blockerad av verifierat snapshot; Slice A:s åldersenhet finns lokalt med statisk QA-PASS, Reviewer PASS och Security APPROVE, men migration/RLS-runtime återstår. |
| Raskatalog (planerad) | `breeds`, med vald och dokumenterad licensierad snapshot | Referensnamn för rasval; gemensamma katalogposter | Raskälla får inte importeras utan återanvändningsrätt; katalognamn är inte hundägarens egen text |
| Vardagslogg | `dog_events`, via `src/data/workspace-data.ts` och `log-model.ts` | Typ, verklig händelsetid, anteckning | Att alla dagens händelser är inlästa; Home har begränsat urval |
| Vikt/utförd hälsa | Också `dog_events`, andra eventtyper och datumfält | Sparad vikt/vaccination/veterinärhistorik | Att de är valploggens vanliga händelser |
| Hälsoplan | `dog_health_plans`, `due_on`, valfri `due_time`, separata påminnelsefält | Planerad åtgärd och vald tid | Genomförd vård eller automatisk plan→historik |
| Träningsprogram/steg | `content_versions`, `training_steps` | Publicerad versionsbunden övning | Att öppnat steg är utfört |
| Träningsprogress | `training_progress`, dog/program_version/step + completed_at | Ägarens sparade stegmarkering | Behärskad färdighet, automatiskt överförd progress till ny version |
| Faschecklista | `checklist-content.ts`, `checklist-data.ts`, `202610110002_puppy_checklists.sql` | Versionerad mall, bockar/egna punkter per hund | Daglig återkomst; preset-bockar saknar tidpunkt för dagens statistik |
| Guider/kunskap | `HomeContent` och publicerade innehållsversioner | Samma artikelversion på Hem/Kunskap | Läsbevis, bild-/tagg-/durationfält som ännu inte finns i API:t |
| Nuvarande Hem | `home-today.ts`, `home-timeline.ts`, `HomeScreen.tsx` | Senaste vanliga logg, tillgängligt träningssteg, dagens planer | Gemensam dagslista eller progressräknare |
| Insikter | `summarizePottyPatterns` i `log-model.ts` | Deskriptiv sammanfattning av inlästa kiss-/bajshändelser | Komplett månad, medicinsk prognos eller giltig sömntidslinje |

Checklistor/FAQ har review-gating som måste respekteras. När daglig aktivitet väljs får en reviewmall aldrig behandlas som publicerad produktionskälla. Migrationers förekomst bevisar inte att målmiljön använder dem.

## Föreslagen läsmodell för Hem

Föreslagna fältnamn, inte nuvarande exporter:

```ts
type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T; coverage: 'complete' | 'partial' }
  | { status: 'error' };

type HomeViewModel = {
  scope: { ownerId: string; accountGeneration: number; dogId: string };
  day: { localDate: string; timeZone: string };
  identity: Loadable<DogIdentityView>;
  relevantContent: Loadable<ContentCardView | null>;
  activities: Loadable<DailyActivityView[]>;
  // Progress är härledd från komplett aktivitetsmängd, aldrig separat sparad.
};
```

`DogIdentityView`, `ContentCardView` och `DailyActivityView` är föreslagna presentationskontrakt som konkretiseras i implementationplanen. Workspace gör läsningar; rena selectors formar vyn; komponenter får data och callbacks. Inget extra generellt state-/dataframework behövs.

## Dagliga aktiviteter: rekommenderat kontrakt att besluta före R02-2

Syfte: samma dagsuppgifter och samma räknare i Hem, full Checklista och Dagens framsteg. Faschecklistan och träningsprogrammet fortsätter vara egna produkter.

1. **Urval:** första versionen använder ägarvalda aktiviteter från publicerat innehåll eller befintlig tillgänglig övning. Ingen automatisk ny hälsorutin, fast kvot om fem uppgifter eller AI-genererad dagsplan. Automatiska scheman/återkomst är senare uttryckliga val.
2. **Identitet:** en dagsaktivitet får stabilt ID, dogId, dateKey, tidszon vid skapandet, versionerad definition eller sourceRef, ordning och aktiv/borttagen-status. Dessa är föreslagna fält; inga tabellnamn är beslutade.
3. **Källstyrd markering:** en länk till träningssteget öppnar dess befintliga markering. Dagsvyn härleder klart från exakt sparad källreferens, med tidsregel nedan. Ingen andra träningsskrivning.
4. **Manuell aktivitet:** exempelvis en ägarvald vardagsrutin utan annan källa behöver en egen uttrycklig markering med activityId, actor, bekräftad tidpunkt och revisions-/konfliktskydd. Det är ny persistens och kräver konkret migrerings-/RLS-plan.
5. **Loggkoppling:** en aktivitet kan hänvisa till en specifik sparad händelse efter uttrycklig koppling. En valfri promenad i loggen matchar inte automatiskt flera olika uppgifter.
6. **Plan:** ”Kontrollera vaccinationsplan” kan betyda en manuell granskning av planen. Den betyder aldrig att vaccinationen utförts. ”Genomför vaccination” får inte bli bockad från planens datum.
7. **Faschecklista:** befintlig bock utan tid får visas som klar i sin fas, men får inte räknas som utförd idag. Daglig återkomst kan inte härledas genom att nollställa fasens bockar.

### Datum och upprepning

Välj och registrera en IANA-tidszon vid skapande av dagsaktiviteten; dess dateKey ligger fast. Nya dagar beräknas med kalenderdatum i aktiv tidszon, inte genom +24 timmar i millisekunder. Vid midnatt och app-resume uppdateras dagens vy. Tidszonsbyte flyttar inte tidigare dagsinstanser eller skapar nya dubbletter för samma instans.

Källstyrd markering måste avse rätt dag: exempelvis träningsstegets completed_at i aktivitetens tidszon. Ett redan avslutat steg från förra veckan är inte dagens prestation och ska inte föreslås som nytt steg. Träningsåterställning/radering av källpost tar bort den härledda kopplingen vid nästa bekräftade läsning. Historisk fryst prestationsjournal ingår inte i första kontraktet; om sådan önskas krävs egen uttrycklig modell.

### Progress, borttagning och okända resultat

- Nämnare = alla aktiva dagsinstanser för hund/dag; täljare = unika bekräftat klara instanser i exakt samma mängd. Visning av fem rader begränsar inte nämnaren.
- En källpost får inte uppfylla flera identiska instanser; kontrollera unikhet på hund/dag/definition/källreferens enligt den konkreta lagringsplanen.
- Borttagen uppgift försvinner ur både täljare och nämnare. Ångra återställer samma instans, inte en ny kopia.
- Empty är inte unknown. Vid partiell laddning döljs samlad räknare; redan verifierade rader kan visas med lokal återhämtning.
- Retry använder stabilt operations-ID; osäkert resultat kontrolleras genom återläsning före ny skrivning. Dubbeltryck skapar inte två instanser/markeringar. Ingen påstådd offlinekö.
- Manuell ångra skriver till aktivitetens egen källa. Källstyrd ångra sker i källflödet med dess befintliga konsekvenser och bekräftelse.
- Veckomål kräver uttrycklig målpopulation. Summera inte sju dagars procent eller använd bildens 3/6 som standard.

### Säkerhet och livscykel

Alla läsningar/skrivningar är hund- och ägaravgränsade. Återanvänd konto-generation och dogId för att kassera sena svar. Rensa presentation, pending intents och bildreferenser vid scopebyte. En UI-check är inte åtkomstskydd: nya tabeller behöver ägar-RLS och syntetiska tvåägarprov. Nya instanser/markeringar måste ingå i befintlig konto-/hundradering. Spara inte kompletta artikelkopior eller godtyckliga användaruppgifter i progressobjekt.

Exakt DB-schema, constraints, readback/konfliktlösning och migrations-/raderingsprov ska godkännas av Architect och Security före denna datadel. Detta dokument är inte det tekniska godkännandet.

## Utveckling, milstolpar och insikter

Utvecklingsvyn kan härleda ålder och visa publicerat fasrelevant innehåll. En milstolpsdefinition behöver version, åldersintervall, relevant målgrupp, källa, publiceringsstatus och text som anger variation. En faktiskt observerad milstolpe är ett annat, ännu saknat, objekt med observationstid och källa. Inget automatiskt ”i fas/efter” från födelsedatum.

`docs/mvp.md` nämner utvecklingshändelser kronologiskt, men aktuella eventtyper saknar en sådan källa. Behandla det som en uttrycklig implementationslucka, inte som ett färdigt API.

Insikter är föreslagna läsvyer med period, tidszon, källtyper och datatäckning. Läs hela periodens relevanta sidor innan ett fullständigt diagram påstås. En dag utan poster kan visa ”inga loggar”, inte ”hunden kissade 0 gånger”. Sömn/vaken kräver verifierade intervallregler: ofullständiga/överlappande intervall och saknat slut visas som luckor. Mönstertext med jämförelse kräver bestämt minsta urval före implementation; inga medicinska slutsatser eller förutsägelser.

## Innehåll och bilder

Föreslagen redaktionell presentation per innehållsversion: korttitel, ingress, imageAssetRef/roll/beskärning, ämnestaggar och eventuell duration. `HomeContent` har ännu inte alla dessa fält. Börja med ett versionsbundet manifest för redan kända lokala bildresurser där det räcker; anta inte en ny CMS-tjänst eller godtycklig extern bild-URL.

Publicerat urval, version och källor återanvänds mellan Hem/Träning/Kunskap. Nya hälsa-/beteende-/träningsråd kräver sakgranskning före publicering. Syntetisk review är tydligt märkt, håller state separat och anropar aldrig produktionsskrivare.

Personligt foto är föreslagen separat feature: privat stabil asset-referens, ägarinitierat tillägg/byte/radering, läsbehörighet, bildstorlek/metadatahantering, laddningsfel och radering av lagringsobjekt. Spara inte en utgången signerad URL som identitet. Nytt lagringsflöde kräver konkret foto-/säkerhetskontrakt. Redaktionella bilder kan utvecklas oberoende av detta.

## Kvarstående beslut för framtida byggdelar

| Fråga | Gällande riktning | Blockerar |
|---|---|---|
| Bildens nya vård-/utvecklingsråd? | Publicerade sakgranskade versioner; annars neutralt tomt tillstånd | Berört innehåll, inte komponentlayout |
| Fotoinsamling? | Eget valfritt fotopaket; ingen insamling utan separat kontrakt | Endast personligt foto |
| Sömnintervall/veckomål? | Inga påhittade intervall/mål; kontrakt och fullständigt urval först | Berörd graf/veckoprogress |

Dagsurval, utebliven automatisk återkomst, tidszon och completion är redan beslutade i `docs/tasks/dev/vision-rev02-r02-2-v11.md`; ställ inte dessa frågor på nytt. Tabellen ovan innehåller kvarstående beslut och ska uppdateras när de avgörs. Visuell referens och komponentarbete kan fortsätta med tydliga fixtures när det ligger inom godkänt scope. Full produktfunktion kräver fortfarande verkliga objekt och verifierad livscykel.
