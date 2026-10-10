# Införd designpolicy — 2026-10-07

Kanonisk policy för alla nya och reviderade UI-uppgifter. Införd på Eriks begäran från originalet DESIGN_RULES (1).md och jämförd med Tassla-design-policy.zip. Originalets regler och 18 kontrollpunkter följer nedan. Bilagorna är designunderlag; deras installationskommandon och gamla statusuppgifter är inte projektmandat.

## Tillämpning i aktuellt Tassla
- Detta dokument preciserar och ersätter motstridiga äldre visuella råd i docs/dev/ui-and-code-standards.md. Följ varm, lugn målbild framför äldre krav på ”modig” färg. Målstyrd rörelse som svar på en användarhandling är tillåten; loopande dekorativ rörelse är inte tillåten.
- Ingen ny appfunktion, datainsamling, delningslänk, foder-/allergi-/medicinfält, flik, flerhundsstöd eller schemaändring godkänns automatiskt av en bild eller komponentlista. Godkänt MVP-scope och faktiska uppgifter styr innehållet. Framtida design ska inte skapa spekulativa abstraktioner nu.
- ”Luna” i målbilden är exempel. Visa aktuell hunds riktiga namn. Befintliga dekorbilder får inte presenteras som ägarens hundfoto; använd en tydlig vänlig platshållare när foto saknas.
- Tvåradersregeln gäller kort förklarande copy i arbetsflöden. Flytta fördjupning till läsvy eller Läs mer; klipp inte viktig text och minska inte text/tryckytor för att uppfylla raden vid stor text. Nödvändiga säkerhetsvarningar och information som behövs för ett aktivt val måste fortfarande gå att förstå och läsa.
- Ingen teknisk drifttext i vanliga ägarflöden. Beskriv resultat och nästa handling vardagligt. Dölj inte osäker sparstatus/raderingsstatus: ”Vi kunde inte kontrollera om det sparades” är bättre än tekniska förklaringar eller falskt ”Sparat”. En toast får säga Sparat först efter verkligt lyckat sparande; ångra måste fungera. Notistext beskriver faktiskt inställnings-/tillståndsläge utan löfte om leverans.
- Delade komponenter finns i src/components/ och tokens i src/theme/tokens.ts. Inför de efterfrågade komponentvarianterna och tokens i berörd godkänd slice; befintlig kod är inte retroaktivt ombyggd genom detta dokument.
- Product har UX-copy-ansvaret och Critic granskar begriplighet och friktion. Implementer skriver korta svenska texter; Product/Critic granskar nya eller ändrade texter före leverans. Ingen ny agentorganisation införs.
- Referensskärm är ännu inte utsedd. För fler loggtyper än målbildens fyra är placeringen fortfarande ett ägarbeslut; dölj eller ta inte bort godkända funktioner som en tyst designändring.
- Visuell QA görs av en annan roll än Implementer. Dokumentera skärmdumpar bredvid målbilden, liten/större mobilbredd, stor text och relevanta tillstånd samt samtliga kontrollpunkter. Icke tillämpliga punkter motiveras; saknad rendering/evidens = NOT TESTABLE, inte GODKÄND. Konkreta Nej blockerar berörd UI-leverans tills rättade. Kodkontroll ensam är aldrig visuell QA.
- Detta inför ingen automatisk TestFlight-grind. Lokal rendering kan ge layoutbevis men bevisar inte nativebeteende. Erik väljer när fysisk telefon/TestFlight behövs. Teknisk lokal checkpoint får sparas med tydlig visuell verifieringslucka, men UI får inte påstås visuellt klart.

---
# Tassla – Design Rules

Gäller **alla** agenter och alla som ändrar UI i appen (Expo / React Native).
Reglerna är bindande för designarbetet inom godkänt scope. Dokumentera och motivera avvikelser i uppgiftsplan och PR-beskrivning när en PR finns. Aktuella mänskliga beslut, hälsosäkerhet, tillgänglighet och sanningsenlig återkoppling gäller även när målbilden förenklar något.

Grundprincip: **en hundägare ska förstå skärmen på 3 sekunder, med en hand, utan att läsa teknisk text.**

---

## 0. Målbilden är facit

Projektets tillgängliga målbild är `vision_rev01.jpg` i projektroten, visuellt inspekterad 2026-10-07. Originalets föreslagna sökväg `docs/design/malbild.png` finns inte. Använd den befintliga bilden; endast övre delen ”MVP – 6 skärmar” styr aktuella skärmar.

Rangordning när något är oklart:

1. **Målbilden** (utseende, struktur, innehåll, ton)
2. **Denna fil**
3. Befintlig kod

Regler:
- Bygger du en MVP-skärm: öppna målbilden och matcha **layout, komponenter, ikonstil, texter och ton**. Hitta inte på egna lösningar.
- Är målbilden tyst om något: använd tokens och komponenter i denna fil, och skriv ned antagandet i PR-beskrivningen.
- Vill du avvika från målbilden: gör det inte tyst. Lista avvikelsen och motivera den.
- Skärmarna under "Om tre år" **byggs inte nu**. De används för att inte låsa oss: flera hundar, delad åtkomst, roller (ägare/dagis/veterinär) och en tidslinje ska kunna läggas till utan omskrivning av datamodell och komponenter.

---

## 1. Arbetsordning (obligatorisk)

1. Läs denna fil och `AGENTS.md` innan du rör UI.
2. Öppna målbilden och den skärm du ska bygga. Titta även på referensskärmen (avsnitt 12).
3. Använd **befintliga komponenter** i `src/components/ui/` (eller motsvarande). Saknas en komponent: skapa den där, med varianter, i stället för att styla inline.
4. Efter ändring: ta skärmdump av varje berörd skärm och lägg den bredvid motsvarande skärm i målbilden.
5. Kör checklistan i avsnitt 14.
6. Den som byggt får inte vara den enda som granskar. Visuell QA görs av en separat granskningsroll.

---

## 2. Visuellt språk (så här ska Tassla kännas)

Målbilden är **varm, lugn och personlig**, inte teknisk.

- **Bakgrund:** varm gräddvit. **Ytor/kort:** vita eller svagt tonade, mjukt rundade hörn, lätt ram, inga hårda skuggor.
- **Primärfärg:** mörkgrön (en enda). Används till huvudknapp, aktiv flik, aktiv ikon i bottenmenyn och bockar.
- **Kategorifärger:** mjuka pastellfärger som *ikon-chips* (tonad bakgrund + mättad ikon). Se avsnitt 3.
- **Foto:** hunden syns. Hunden Luna med foto på Hem, Träning (hero), Kunskap, Tassla-pass. Stora, varma foton med rundade hörn. Saknas foto: använd en vänlig platshållare (hundsilhuett), aldrig en tom grå ruta.
- **Rubrik/typografi:** tydlig hierarki. Sidtitel centrerad i appbaren, sektionsrubriker fetare, metadata liten och dämpad.
- **Personligt språk:** "Idag för Luna", inte "Dagens uppgifter".
- **Luft:** hellre färre element med luft än tätt packat.

---

## 3. Designtokens – inga hårdkodade värden

All styling hämtas från tokens (t.ex. `src/theme/tokens.ts`). **Förbjudet:** hårdkodade hex-färger, magiska px-tal, egna `fontSize`/`borderRadius` i skärmfiler.

| Token | Regel |
|---|---|
| Spacing | Endast skalan 4 / 8 / 12 / 16 / 24 / 32. |
| Radius | Tre nivåer: `sm` (chips, fält), `md` (knappar, listrader), `lg` (kort, hero, sheets). |
| Färg (bas) | Semantiska namn: `primary`, `surface`, `background`, `textPrimary`, `textSecondary`, `border`, `success`, `warning`, `danger`. Behåll appens befintliga värden, de ligger nära målbilden. |
| Färg (kategori) | `category.<namn>.fg` + `category.<namn>.bg` (se nedan). Endast dessa för ikon-chips. |
| Typografi | Stilarna `title`, `heading`, `body`, `caption`, `label`. Max 3 olika storlekar per skärm. |
| Kort/ram | Ett enda kortutseende i hela appen. |

**Kategorifärger (förslag, lägg som tokens och justera mot målbilden):**

| Kategori | Ton | Ikon |
|---|---|---|
| Kiss | blå | droppe |
| Bajs | brun | bajs (vektorikon, inte emoji) |
| Mat | grön | matskål |
| Sömn/Vila | lila | måne |
| Promenad | (välj, ej grön/blå) | fotspår/gå |
| Träning | grön | träningsikon |
| Vaccination | korall/röd | spruta/skydd |
| Avmaskning | lila | pill/kapsel |
| Veterinär | blå | stetoskop |

Samma kategori har **alltid** samma färg och ikon i hela appen (logg, hem, hälsa, tidslinje).

Hittar du ett värde som saknas: lägg till token, använd den, skapa inga lokala undantag.

---

## 4. Skärmanatomi (komponenter som ska finnas)

Bygg dessa som delade komponenter. Skärmfiler sätter ihop dem, de styr inte utseendet själva.

**Appbar (`AppBar`)**
- Centrerad sidtitel. Bakåtchevron till vänster på underskärmar. Åtgärd (t.ex. klocka/notiser) till höger.
- Hemskärmen har varumärket "Tassla" till vänster och notis-ikon till höger.

**Flikar (`Tabs`)**
- Textflikar överst i skärmen (Översikt / Vaccinationer / Veterinär / Vikt). Aktiv flik: primärfärg + understreck. Inaktiv: dämpad.

**Bottenmeny (`BottomNav`)**
- Fem lika stora poster: Hem, Logg, Träning, Hälsa, Mer. Aktiv: fylld ikon + primärfärg + fet text. Inaktiv: konturikon, dämpad.
- Ikonerna är alltid samma stil (kontur/fylld-par). Ingen blandning.

**Sektion (`Section`)**
- Rubrik + innehåll. Alltid samma marginaler (se avsnitt 5).

**Listrad (`ListRow`)**
- Ikon-chip till vänster, text i mitten (titel + dämpad metarad), chevron till höger. Hela raden är tryckbar.
- Används för "Idag för Luna", Dagens logg, Hälsohändelser, Tassla-pass-rader.

**Kort (`Card`)**
- Ett kortutseende. Höjden följer innehållet.

**Hero-kort (`HeroCard`)**
- Stort foto med rundade hörn, text lagd över foto med tillräcklig kontrast (mörk gradient bakom texten). Används på Träning och Kunskap.

**Snabbloggs-ruta (`QuickLogTile`)**
- Stor, kvadratisk/rektangulär ruta med ikon-chip i kategorifärg + etikett under. Två kolumner (2×2 i målbilden). Tryck = logga direkt, med toast + ångra.

**Framsteg (`Progress`)**
- Tunn stapel med etiketten under ("3 av 5 genomförda").

**Checklista (`ChecklistItem`)**
- Rund bock (grön fylld när klar, kontur när ej klar), text, hel rad tryckbar.

**Datumgrupp**
- Relativa etiketter: "Idag", "Igår", sedan datum. Tider före text: `12:05  Mat (åt allt)`.

**Bottom sheet / Tassla-pass**
- Stängknapp (✕) uppe till höger. Innehåll i rader med ikon-chip. Primär åtgärd ("Dela som PDF") längst ned i full bredd, med en sekundär ikonknapp (delningslänk) intill.

---

## 5. Avstånd och layout

- Sidmarginal är densamma på alla skärmar.
- **Avstånd mellan sektioner:** 24. **Rubrik → innehåll:** 8–12. **Mellan kort/rader i lista:** 12.
- Rubriker sitter aldrig ihop med blocket ovanför. Varje sektionsrubrik har samma ovanmarginal.
- Inga tomma utrymmen i kort. Kortet är lika högt som innehållet plus padding (16).
- Allt tryckbart är minst **44×44 pt**.
- Huvudåtgärder ska nås med tummen (nedre halvan) när det är rimligt.
- Innehåll ska inte döljas bakom bottenmenyn: lägg tillräcklig bottenpadding i scrollvyer.

---

## 6. Knappar – en hierarki, inga undantag

Använd bara `Button` med en av varianterna:

| Variant | Används till | Utseende |
|---|---|---|
| `primary` | Skärmens huvudåtgärd ("Dela som PDF", "Spara", "Lägg till händelse") | Fylld mörkgrön, full bredd |
| `secondary` | Viktig men inte huvudåtgärd | Konturad |
| `tertiary` | Diskreta åtgärder | Textknapp med full tryckyta |
| `icon` | Små stödåtgärder (t.ex. dela länk) | Fyrkantig/rund ikonknapp med kontur |
| `destructive` | Radera/ta bort | Röd text/kontur, **aldrig fylld som primär** |

Regler:
- **Max en `primary` per skärm/vy.** Två gröna fyllda knappar under varandra är alltid fel.
- Knappar i samma grupp har samma höjd, radie och typografi.
- Radera ser aldrig ut som Ändra. Radera kräver bekräftelse (sheet/dialog) eller erbjuder ångra.
- **Ändra/Radera på listrader:** lägg inte två stora textlänkar på varje rad. Tryck på raden öppnar detaljer/redigering, och Radera ligger i redigeringsvyn eller bakom en liten meny (⋯) / svep.
- Knappar har verb: "Spara", "Lägg till", "Radera". Inte "OK".
- Alla knappar har disabled- och laddningsläge.

---

## 7. Ikoner

- **En ikonuppsättning** i hela appen. Inga emojis som ikoner (💩 i Snabb logg är ett exempel på fel).
- Ikoner ligger i **ikon-chips**: tonad bakgrund i kategorins färg + mättad ikon, samma chipstorlek i samma grupp.
- Samma storlek och linjetjocklek för ikoner i samma grupp.
- Ikonen ska vara begriplig utan förklaring. Annars byt (halvfylld cirkel för "Mat" och prick-i-cirkel för "Vaken" är inte begripliga).
- Samma kategori = samma ikon överallt.

---

## 8. Status, meddelanden och feedback

**Visa bara status när något avviker.**

- Inga "SPARAD"-etiketter på varje listrad. Sparat är normalläget och visas inte.
- Tillåtna statusar: `Sparar…`, `Väntar på uppkoppling`, `Kunde inte spara – försök igen`.
- Ingen "ÄGARREGISTRERAD"-badge på varje post. Källa visas bara när olika källor förekommer (t.ex. dagispersonal vs ägare i framtiden) och då som diskret avatar/namn, inte versaler.
- Bekräftelse efter lyckad åtgärd: kort toast (2–3 s) med ångra där det går. **Aldrig** statusruta med "Stäng status".
- Fel visas intill det som gick fel, med vad användaren kan göra.
- Informationsrutor (beige banners): högst **en per skärm**, bara om användaren måste agera.
- Tidsangivelser för kommande saker är relativa: "Om 12 dagar" + datum på rad 2.

---

## 9. Språk och copy (svenska)

Ton: kort, varm, vardaglig. Skriv till hundägaren, inte till en utvecklare eller jurist.

**Förbjudna ord/begrepp i UI-text:** server, synk/synkronisera, backend, databas, request, cache, token, endpoint, "bekräftats av servern", "underlag", "registreringar", disclaimers om vad appen *inte* förutsäger.

| Istället för | Skriv |
|---|---|
| "Loggen hämtas från ditt konto. Ändringar visas som sparade först när servern har bekräftat dem." | *(ta bort helt)* |
| "Historiskt mönsterunderlag" | "Dina senaste mönster" |
| "Sammanfattningen beskriver bara tidigare ägarregistreringar. Den förutsäger inte…" | *(ta bort, eller:* "Baserat på dina senaste loggar"*)* |
| "Enheten tillåter notiser. Det säger inte att varje påminnelse visas eller levereras." | "Notiser är på." |
| "Kiss: 0 registreringar" | "Inga kiss loggade än" |
| "Bajs: 2 registreringar · typiskt intervall 33 h 30 min" | "Bajs: 2 gånger · vanligtvis var 33:e timme" |
| "Ändringen är sparad." + "Stäng status" | Toast: "Sparat" |

Mönster från målbilden att återanvända: "Idag för Luna", "Dagens logg", "Kommande" / "Genomfört", "3 av 5 genomförda", "Lägg till händelse", "Rapportera idag", "Dela som PDF".

Regler:
- Max 2 rader förklarande text per block. Mer: länka till "Läs mer".
- Tider som människor säger dem ("33 tim 30 min" → "ca 1,5 dygn").
- Tomma tillstånd har en vänlig text och en tydlig nästa handling.
- Alla texter går via UX-copy-rollen innan de går in.
- Samma sak heter samma sak överallt. Använd hundens namn där det går.

---

## 10. Skärmar och tillstånd

Varje skärm/lista har design för fyra tillstånd:

1. **Laddar** (skeleton, inte tom skärm)
2. **Tom** (förklaring + knapp)
3. **Fel** (vad hände + vad kan jag göra)
4. **Normal**

Övrigt:
- **Dubbletter:** loggas samma sak med samma tid/datum igen: fråga "Du har redan loggat det här. Lägga till ändå?"
- Formulär: etikett ovanför fält, hjälptext under, fel under fältet, spara-knapp längst ned.
- Checkboxar/switchar: hela etiketten är tryckbar.
- Tillgänglighet: kontrast minst 4,5:1, `accessibilityLabel` på allt tryckbart, layouten klarar större textstorlek.

---

## 11. MVP-skärmarna (vad målbilden kräver)

Kort sammanfattning. Detaljer finns i målbilden.

1. **Hem:** appbar med varumärke + notis. Hundkort med foto, namn, ålder, ras. Veckoremsa med dagar (aktiv dag markerad). "Idag för Luna" som `ListRow`-lista (måltid, promenad, träning, vila, tips) med chevron.
2. **Logga:** "Snabb logg" som 2×2 `QuickLogTile` (Kiss, Bajs, Mat, Sömn). "Dagens logg" som kompakt lista med tid, händelse (+ detalj, t.ex. "Promenad (20 min)") och chevron. Ingen statusetikett per rad.
3. **Träning:** flikar (Valpprogram / Alla övningar / Mina mål). `HeroCard` med veckans fokus och framsteg ("3 av 5 genomförda"). Checklista med övningar.
4. **Hälsa:** flikar (Översikt / Vaccinationer / Veterinär / Vikt). Sektionerna "Kommande" och "Genomfört" med kort (ikon-chip, titel, "Om 12 dagar", datum). Genomfört markeras med grön bock. En `primary` knapp: "Lägg till händelse".
5. **Kunskap:** flikar (För dig / Artiklar / Checklistor / FAQ). Stort artikelkort med foto, rubrik, ingress och lästid. Två kolumner med mindre kort under.
6. **Tassla-pass:** sheet med ✕. Kort ingress, hundens kort (foto, namn, ras, födelsedatum, ålder), rader med ikon-chip (Foder, Allergier, Medicin, Viktiga rutiner). `primary` "Dela som PDF" + `icon`-knapp för länk.

**Avvikelser i nuvarande bygge att rätta (exempel):**
- Logga visar 6 lika stora rutor med blandade ikoner och emoji. Målbilden har 2×2 kategoriruta + lista. Promenad och Vaken ska lösas enligt beslut i avsnitt 12.
- Statusetiketter, tekniska banners och dubbla gröna knappar ska bort (avsnitt 6, 8, 9).
- Appbar saknas på flera skärmar.

---

## 12. Referensskärm och öppna beslut

> **Fyll i:** `src/…` – den skärm som idag ligger närmast målbilden. Nya skärmar ska följa dess mönster.

**Öppna beslut (ägaren avgör, agenter gissar inte):**
- Hur loggas fler typer än de fyra i målbilden (t.ex. Promenad, Vaken)? Alternativ: extra rad av rutor, "+"-knapp eller menyval.

---

## 13. Framtidssäkring ("Om tre år")

Bygg inget av följande nu, men gör det inte omöjligt:
- Flera hundar per konto och en hundväxlare.
- Delad åtkomst och roller (ägare, familj, dagis, veterinär): komponenter får inte anta en enda användare.
- Tidslinje som samlar händelser från alla källor.
- Tjänster/partnernätverk (karta, listor).
- Källa/avsändare på en händelse är ett datafält som kan visas, men visas inte som standardbrus.

---

## 14. Granskningschecklista (för visuell QA-roll)

Granska skärmdumpar (liten och stor telefon, stor textstorlek) **bredvid målbilden**. Varje punkt är **Ja/Nej**. Ett Nej = underkänd.

**Struktur och hierarki**
1. Finns max en `primary`-knapp i vyn?
2. Är knappar i samma grupp lika höga och likadant stylade?
3. Skiljer sig Radera tydligt från Ändra, och finns bekräftelse eller fungerande ångra? Irreversibel kontoradering behåller sin uttryckliga bekräftelse.
4. Saknas stora "Ändra/Radera"-textlänkar på varje listrad?

**Tokens och kod**
5. Följer alla avstånd spacingskalan, och har varje sektionsrubrik samma ovanmarginal?
6. Finns inga hårdkodade färger eller px-värden i diffen?

**Ikoner och färg**
7. Kommer alla ikoner från samma uppsättning, utan emoji?
8. Har varje kategori sin avsedda färg och ikon, och är den densamma överallt?
9. Är ikonerna begripliga utan förklaring?

**Status och copy**
10. Finns inga statusetiketter på normala poster ("SPARAD", "ÄGARREGISTRERAD")?
11. Är det högst en informationsruta, och kräver den att användaren agerar?
12. Innehåller texten inga förbjudna ord?
13. Är förklarande text max 2 rader och i samma ton som målbilden?

**Tillstånd och tillgänglighet**
14. Finns design för laddar/tom/fel/normal?
15. Är tryckytor minst 44×44 pt och fungerar skärmen med stor textstorlek?

**Målbild**
16. Matchar skärmen målbilden i layout, komponenter och innehåll? Är avvikelser listade och motiverade?
17. Har skärmen appbar, flikar och bottenmeny enligt målbilden?
18. Används foto/hundens namn där målbilden gör det?

Granskaren svarar:

```
Resultat: GODKÄND | UNDERKÄND
Underkända punkter: [nummer + en rad om vad som är fel + förslag]
```

### Förslag till kompletterande checklistpunkter 19–22 – väntar Eriks granskning

Punkterna nedan är förslag för framtida visuell QA. De ändrar inte checklistans beslutade punkter 1–18.

19. Är rörelse kopplad till bekräftat tillstånd och inom tokeniserad tidsgräns?
20. Försvinner eller förenklas rörelsen vid reducerad rörelse utan att information går förlorad?
21. Är valpfiguren enbart positiv eller neutral och finns betydelsen även i text bredvid?
22. Finns högst ett första-användningstips per skärm och ryms det på högst två rader?

---

## 15. Rörelse

- Använd React Natives inbyggda `Animated`; lägg inte till Lottie, Rive, Reanimated, `react-native-svg` eller haptikpaket för MOTION.
- Alla animationstider hämtas från `tokens.motion`. Varje animation varar 120–350 ms, kan avbrytas och blockerar aldrig input.
- Rörelse visar ett bekräftat tillstånd, aldrig själva trycket som om det vore en lyckad skrivning. Framgångsrörelse startar först när status är `saved` eller när data som kommer från sparat tillstånd ändras. Vid `failed` eller `unsure` visas befintlig fel-/osäkerfeedback utan framgångsrörelse.
- Animera inte vid första rendering; animera bara ändringar efter mount. Ingen idle-loop eller dekorativ rörelse.
- Respektera `useReducedMotion`: ändringen sker direkt och samma status, text, ikon och skärmläsarbetydelse finns kvar.
- Rörelse är aldrig enda feedbackkanal. Native driver används för opacity/transform. Layout får använda JS-driver endast för ett litet element, exempelvis den befintliga 4 px progressfyllningen.
- UI-copy och bekräftelse får aldrig antyda att data sparats före verkligt lyckad skrivning.

## 16. Tips vid första användning

- Högst ett litet, avfärdbart tips per skärm och endast vid användarens första besök på den skärmen.
- Tipset har högst två rader, försvinner vid första interaktion och tar inte plats från formulär, huvudhandling eller sparstatus.
- Tipset är inte en `InfoBanner` och räknas inte som den tillåtna handlingskrävande informationsrutan. Det ska vara diskret och inte kräva att användaren agerar.
- Spara en "sett"-flagga per ägare i SecureStore enligt `src/notifications/notification-storage.ts`. Rensa flaggorna vid kontoborttagning. Inget nytt databasfält eller analytics-event.
- Hälsotips ger inte veterinärmedicinska råd. Ny svensk copy granskas av Product och Critic före leverans.

## 17. Valpfigur

- Figuren får endast ha positiva eller neutrala lägen: lugn, glad, stolt och vilar. Inga ledsna, besvikna, sjuka eller skuldbeläggande lägen.
- Figuren speglar endast appaktivitet: bekräftad logg, bekräftat träningssteg eller ett klart program. Den antyder aldrig hundens hälsa, känslor, lydnad eller färdighet. Träningsdelens reservation får inte motsägas.
- Reaktionen spelas en gång efter bekräftad händelse, aldrig som loop. En text bär alltid betydelsen bredvid figuren.
- Figuren är dekorativ för skärmläsare. Första placering är vid första bekräftade loggen och bekräftat träningssteg; ingen hälsobaserad eller Hem-baserad hälsning.
- Illustration ska vara varm och lugn i Tasslas cream/gröna palett, tydligt illustrerad, utan specifik ras, text eller logotyp och får inte kunna misstas för ägarens hund.

## 18. Vad agenter inte får göra

- Lägga till nya färger, ikonstilar eller knappstilar utan att uppdatera tokens/komponenter.
- Lägga till förklarande bannertexter "för säkerhets skull".
- Visa interna tillstånd (synk, serverstatus) för användaren.
- Bygga skärmar från "Om tre år" nu.
- Ändra skärmar som inte ingår i uppgiften.
- Markera en UI-uppgift som klar utan skärmdump jämförd med målbilden och ifylld checklista.
