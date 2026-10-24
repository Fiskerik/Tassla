# UI-R02-03 — UX-spec för Logg och Hälsa

Datum: 2026-10-23 · **plan v3**. Källa: actionplan §5, GAP G04/G06/G09/G10/G11/G13/G16/G19, målbild `vision_rev02.jpg` panel 5 och aktuella stödskärmsregler. Plan v3 tar in Architect, Critic och Securitys ändringskrav från v1 samt UX Criticens v2-fynd om att okänt resultat/konflikt inte får låsa användaren. Ägarens tidigare vikt-/tangentbordsprov och generella native accessibility/Supabase-besked är ägarrapporterade, inte nya testresultat.

## Produktmål

Ändra en befintlig logg- eller hälsopost utan knappvägg eller dubbla rubriker. Tangentbordet ska inte täcka Spara. En vald plan ska gå att känna igen direkt, ändra exakt och återvända från till samma Hälsa-flik/position. Snabbregistrering och skillnaden mellan planerat och utfört består.

## Presentation och handlingar

| Område | Presentation | Primär handling | Avslut/destruktiv handling |
|---|---|---|---|
| Logg edit | Befintligt `BottomSheet`, en rubrik, sammanhållen fältyta | En fast Spara-footer | X/backdrop/swipe/back använder dirty-close; soptunna → namngiven dialog → Radera |
| Utförd hälsohändelse | Befintligt `BottomSheet`; fälten utan inre kort/dubbla modalrubriker | En fast Spara-footer | Samma dirty/delete-kontrakt |
| Vikt add/edit | `BottomSheet` över viktsidans lista; sidan behåller list/status/navigation | En fast Spara-footer över tangentbordet | Samma dirty/delete-kontrakt; befintlig exakt event scope |
| Plan add/edit | `BottomSheet` över planlistan; sidan behåller lista/status/navigation | En fast Spara-footer över tangentbordet | Samma dirty/delete-kontrakt; plan förblir plan |

Endast en editor kan vara öppen åt gången. Ingen ny global draftmanager eller AppScreen-footer ändras. Sidans Back är fortsatt navigation; formulärets lokala stängning använder dess X/modal close affordance.

Dirty jämför aktuella fält med verkliga startvärden. Clean close stänger; dirty close bekräftar att utkastet kastas. Ett aktivt skrivsteg får tillfälligt hindra stängning medan befintlig mutation kör. När utfallet är `pending/unknown` eller konflikt kan sheetet minimeras till ägarsidan; råa fält, pending intent och recovery-context bevaras i en smal ProductWorkspace in-memory snapshot nycklad med owner/accountGeneration, `selectionKey`, dog, relevant lifetime, editor kind och object ID. Den överlever navigation bort/tillbaka inom samma scope och är single-flight. Ägarsidan visar en tydlig återhämtningsrad med status, **Kontrollera/Granska** och **Öppna**; Öppna återställer exakt samma editor. Minimering avbryter inte, duplicerar inte och rapporterar inte skrivningen som sparad. Ingen generell draft manager, permanent UI-draft store eller note i route state. Konto/hund/scope-byte invaliderar presentation/fokus; befintlig intent förblir scope-bunden och kan aldrig återanvändas för ny hund. Sena resultat/retry/cleanup måste bekräfta scope innan state uppdateras. `failed` behåller fälten och befintlig retry. Vid delete öppnar ikonen bara dialogen. Dialogen beskriver exakt post (och datum om det finns); Avbryt muterar/rensar/stänger inget, Radera kör befintlig villkorad mutation på exakt bekräftat ID och den befintliga preimage/scope/readback-regeln. Vikt använder exakt `dog_id + event_type='weight' + id` samt readback utan ny CAS/preimage; inga adapterändringar.

## Hälsa-planflöde och återgång

- Hälsa-flikens state ägs av `ProductWorkspace` och återställs vid retur. Health source-state är separat från Checklistors A03-state och innehåller `{selectionKey, plannedHealthLifetime, planId|null, returnTab, returnScrollKey}`.
- Tryck på namngiven Hälsa-rad skickar exakt `planId` och aktiv `returnTab`; `Planera en händelse/Ny plan` skickar uttryckligen `planId: null` och rensar stale focus innan navigation.
- Fokuserad befintlig post visas i första meningsfulla vyn med namn/typ, datum, status och **Ändra**. Inget tomt create-formulär syns före fokuserad post; fokus innebär inte automatisk edit. Nytt tomt formulär öppnas först efter create-handlingen.
- Befintliga ID:n matchas mot aktuell hunds `plannedHealthRows`-snapshot och samma selection/lifetime. Ingen oscopead record sparas som källa. Saknat/felande exakt ID blir tydlig missing/error eller återgång; aldrig första/närmaste post. Owner/account/dog/lifetime invalidation aborterar läsning, rensar fokus och lämnar detaljrouten; inget nytt hundscope får ärva gammalt fokus.
- Hälsa-scroll: `health-flow` bevaras genom `planned-health-health-source` och tillbaka. Checklistors befintliga `planned-health-checklist-source` → `home-checklist-flow`, exact dog-scoped fetch och retur lämnas byte-for-behavior unchanged.
- Fokusera, spara eller radera plan anropar inte `saveHealthHistory`, skapar inte `dog_events` och sätter inte planen som genomförd. Planerat innehåll fortsätter använda nuvarande planmutationskontrakt.

## Tillgänglighet och tangentbord

- Soptunna minst 44×44 pt, objektspecifikt accessibility-namn; tydlig text i bekräftelsen. Ikon/färg är inte enda betydelsen.
- En enda fast Spara-knapp ligger över safe area och keyboard. Datum/tid, viktens decimalfält och multiline anteckning scrollas/hanteras med befintlig keyboard-aware sheet.
- Viktens decimal-pad kan avslutas och Spara nås utan att keyboard täcker knappen. Return i multiline anteckning infogar ny rad och sparar/stänger inte.
- X och Spara verifieras i 375×667 vid normal text och 140 % textproxy. Verklig iOS/Android keyboard, VoiceOver/Dynamic Type markeras PASS bara efter fysisk/simulator native-körning; annars `NOT TESTABLE`.

## Referens och verifierbar visuell skillnad

| Rev02-ankare/gap | Avsedd skillnad | Kontroll |
|---|---|---|
| Panel 5:s snabba loggtidslinje (G04/G06) | Snabbval oförändrat; edit sheet med en fast primärknapp, kontextuell ikon och kort bekräftelse | Snabblogga, edit, confirm/cancel, kalender, undo och dirty close |
| Hälsa och tydliga ägaruppgifter (G09/G16) | Samma rubrik/fält/footerfamilj i fyra editors utan dubbla kort och tre rader knappar | Render av create/edit + error/recovery för utförd, vikt och plan |
| Rätt namngiven plan (G19) | Plan ID följer namngiven rad; fokuserad plan visas direkt med Ändra | ID A/B, två flikar, icke-noll scrollretur, missing/scope byte |
| Datum och tid (G10) | Samma befintliga picker-familj, varierande semantik bevarad | Historisk/utförd framtidsgräns, plan framtidsdatum, lokal dag och tid |

## Skyddat

Inga schema-/RLS-/RPC-/adapter-/fält-/notifierings-/datainsamlingsändringar, ingen ny hälsotext eller rådgivning. Loggens snabbval, dublettskydd, kalenderprickar, datum/tidsmodell, A03-checklist-progress, 01B-ikoner och Panel 8-insights fortsätter fungera. `FLOW-LOG-01`/`FLOW-INSIGHTS-01` bredare scope är fortsatt parkerat.

## Gransknings- och QA-matris

- Architect verifierar BottomSheet/Dialog/Button API, route/state och scrollflöde mot verklig kod.
- UX Critic verifierar första vyn, svensk copy, visuella proportioner, ikonens begriplighet och keyboard-proxy.
- Security verifierar att route ID aldrig är auktorisering, befintliga dog scope/preimage/mutationer används och plan inte blir utförd historik.
- QA provar två olika plan-ID (inklusive liknande texter) från minst två Health tabs; exakt fokus, samma flik och non-zero scroll vid retur; create efter gammalt focus; missing, delete/cancel/confirm, account/dog/lifetime byte och stale async response.
- QA provar Logg, utförd händelse, vikt och plan add/edit; clean/dirty close via X/backdrop/swipe/Android back; failure, pending, unknown, conflict; minimera/reopen för samma draft och återhämtningsrad; decimal-pad, multiline Return, 375×667/140 % text. Checklistor A03 exact fetch/scroll/return körs som regression.
- Public/review RN Web renderas vid 375×667, 375×844, 430×844 och normal/140 % textproxy. Syntetisk visning är lokal visuell evidens, inte native, live database eller full Panel 5 §14-pass.
