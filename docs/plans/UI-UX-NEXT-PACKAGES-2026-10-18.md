# UI/UX — nästa testbara paket

2026-10-18. Underlag: Eriks patch och inklistrade UX-förslag, aktuell branch samt [komplett knappinventering](../design/UI-ACTION-INVENTORY-2026-10-18.md) ([CSV](../design/UI-ACTION-INVENTORY-2026-10-18.csv)). Uppdragsplan: [UI-SHEET-ACTIONS-01](../tasks/dev/UI-SHEET-ACTIONS-01.md). Inventeringen ger kodplatser, inte antal unika knappar på telefonen. Dynamiska listor, renderers, preview/galleri och systemytor framgår separat.

**Status 2026-10-19:** paket 0 `UI-SHEET-ACTIONS-01`, 1a `UI-ACTIONS-COMMON` och 1b `UI-ACTIONS-ROWS` är markerade done i releasekön efter oberoende QA/Reviewer PASS. Nästa UI/UX-paket är 2a `UI-ACCESSIBILITY-HOME-LOG`.

**Levererat i denna slice:** draghandtag/nedåtsvep för den delade BottomSheet, riktade tester, knappinventering och denna plan. Nedanstående paket är planerade; inga breda knappbyten, sökningar, haptik- eller datamodelländringar är implementerade här.

## Regler för text och ikon

Erik vill förenkla bland annat Ångra och kontextuell Redigera till ikoner. Använd `return-up-back-outline` för Ångra och `create-outline` för redigering. Båda namnen är verifierade i installerade Ionicons. Ångra-pilen får inte vara samma kontroll som navigation bakåt. Toastens bekräftade meddelande måste ligga kvar som sammanhang, och redigeringspennan placeras på samma rad som den namngivna posten. Fullständigt svenskt tillgänglighetsnamn, exempelvis ”Ångra loggning av kiss” eller ”Redigera rutinen Morgon”, kvarstår. Ingen ”penna + R” eller textkrympning för att få plats. Minst 44×44 pt, rätt busy/disabled-state, separat fokus och tillräcklig kontrast.

| Kontrollfamilj | Beslut för kommande paket | Motivering och avgränsning |
|---|---|---|
| Ångra i bekräftad toast | Enbart vänd bakåtpil | Återställer bara den bekräftade, exakta skrivningen. Retry/unknown förblir separata textåtgärder. |
| Redigera vid namngiven rutin/checklistepunkt | Enbart penna | Objektet framgår intill knappen; hela namnet finns för skärmläsare. Menyvalet ”Ändra” behåller text. |
| Datum-/tidknapp | Kalender-/klockikon | Fältets rubrik och valda datum/tid visas fortsatt; byt öppningsknappen, inte värdet. |
| Stäng, tillbaka, overflow, kalender föregående/nästa | Etablerad ikon | Behåll full kontextetikett; backdrop är kompletterande stängväg. Kryss och svep får samma guard. |
| Punktvis plus/minus och intervallets +/− | Ikon | Namnet anger vilken punkt eller vilket tal som ändras; varnings-/raderingskontrakt bevaras. |
| Händelsetyp i loggeditor | Ikon + nedpil på vald trigger; ikon + namn i öppnad lista | En kategori är ett val med flera närliggande symboler. Synliga namn i listan gör det begripligt; befintligt värde ska vara förvalt. |
| Spara, Fortsätt, Skapa, Bekräfta, Avbryt i formulär | Text | Huvudhandling, nytt dataflöde och utkast får inte bli kryptiska. |
| Försök igen, Kontrollera status, konfliktåterhämtning | Text | Användaren måste förstå om appen hämtar, kontrollerar eller skriver; ingen generisk refresh-symbol för allt. |
| Radera/Ta bort/Börja om, särskilt bekräftelser | Text | Konsekvens och objekt ska vara tydliga; papperskorg kan komplettera i kontextmeny. |
| Konto, auth, samtycke, tillstånd, PDF/export/delning | Text, eventuellt ikon som stöd | Konsekvens, identitet och OS-övergång behöver synliga namn. |
| Bottenmeny, flikar, filter, veckodagar och val | Text/namn + vald markering | De fem huvudflikarna behåller namn. Veckodagar kan vara Må, Ti, On, To, Fr, Lö, Sö med fulla tillgänglighetsnamn. |
| Snabblogg, listor, artiklar, hund-/rasval och genvägar | Namn + befintlig symbol/bild | Kort/rad är själva öppningsytan; byt inte artikelrubrik eller hundnamn till ikon. |

Den genererade radklassificeringen är konservativ och sparar uttryck där etiketten är dynamisk. Den manuella familjepolicyn här styr vid sådan generisk wrapper. Alla kandidatbyten verifieras i sitt sammanhang; CSV:s style-/stateankare är underlag och bevisar inte visuellt PASS.

## Ordning för nästa implementation

Varje rad är en separat checkpoint med planreview, begränsad diff, lämpliga tester, skärmbilder och oberoende review. Samma branch kan användas; ingen ny dependency behövs för paket 1–5.

| Ordning / paket | Avgränsad leverans och huvudsakliga filer | Acceptans / vad som ska provas |
|---|---|---|
| 0. UI-SHEET-ACTIONS-01 (done) | BottomSheet + sheet-drag/sheet-dismiss, 24 riktade tester | Långt/snabbt drag stänger genom föräldern; kort/avbrutet drag återgår. Nekad/busy/dirty stängning, callbackbyte, reopen och cleanup. Native känsla/tangentbord/VoiceOver provas separat. |
| 1a. UI-ACTIONS-COMMON (done) | Toast, AppPrimitives DatePickerField/TimePickerField och vid behov opt-in Button-variant | Ångra-pil, kalender/klocka och periodpilar. Inga tätt packade felknappar vid 375 pt/140% text. Samma callback, bekräftad-undo-regel, input, fel och tillgänglighetsnamn. Alla datum-/tidsanvändare omfattas via delad komponent. |
| 1b. UI-ACTIONS-ROWS (done 2026-10-19) | DailyActivityManagerSheet, PuppyChecklistScreen och LogEventEditor | Kontextuell penna utan textrester, eventsymbol med dropdown på förvalt värde, alla val med ikon+namn i listan; veckodagar på en rad vid normal text, tillgänglig scroll vid stor text utan mindre tryckytor. Primär/radera/avbryt behåller text. Oberoende QA och Reviewer PASS; begränsad lokal evidens och ej testbara native-/DB-gränser är dokumenterade. |
| 2a. UI-ACCESSIBILITY-HOME-LOG (M) | HomeScreen, DailyActivityItem, LogScreen och Toast-felvarianter | 375×844, 430×844, 375×667, 140% och native största Dynamic Type. Namn/CTA nås, osäker status kan återhämtas, ingen avklippt ”R”. Ångra/back får olika namn. VoiceOver och reduced motion provas separat. |
| 2b. UI-ACCESSIBILITY-SUPPORT (M) | Rutinåtgärder, NotificationSettingsScreen, hälsa/vikt, onboarding/profil och pass | Långa sida-vid-sida-åtgärder staplas vid behov; tangentbord/footer och fullt läsbara knappar. Testa disabled/saving/fel/unknown och destruktiv Avbryt. |
| 3. UI-KNOWLEDGE-SEARCH (M) | KnowledgeScreen, guide-body och innehållsprojektion | Fritextsök i titel/ingress/fulltext bland den aktiva hundens publicerade redan hämtade artiklar. Visa tydligt att sökningen gäller hundens urval. Normalisera skiftläge/åäö och blanksteg; träff, 0 träffar, rensa, loading/error, öppna/tillbaka och hundbyte. Ålders-/rasregler kringgås inte. Ämnesfilter kräver riktig metadata; rasfilter väntar enligt beslut. |
| 4. UI-REFRESH-HOME-LOG (M) | ProductWorkspace och berörda ScrollView-ägare/AppPrimitives; RefreshControl från befintlig RN | Neddrag uppdaterar rätt aktiv hund och rätt datum; förfrågningar samordnas med befintlig automatisk refresh. Ingen försvunnen gammal data vid fel, ingen stale response från annan hund/konto, inget dubbelsparande. Visa skillnad mellan uppdateringsfel och tom lista. |
| 5. UI-EMPTY-FEEDBACK (M) | Ett användarflöde per checkpoint: först Hem/Logg, sedan Kunskap/Träning | Matchande skeleton för verklig laddning, relevant konkret första handling vid riktig tomlista, retry vid fel. Behåll osäkert sparläge och input; inga permanenta ”Sparat”-badges. Testa förstainloggning, tomt konto, nätfel och delvis hämtad data. |

**Nästa paketordning:** 1b är stängt; därefter 2a, 2b, 3, 4 och 5. Paket 2 breddar stor-text-/tillgänglighetskontrollen till övriga ytor; kunskapssökning använder den aktiva hundens redan filtrerade publicerade innehåll. Pull-to-refresh återanvänder befintlig automatisk refresh och inför inget familje-/delningskonto.

## Manuellt granskade vyer och dynamiska grupper

| Område | Kontroller som ingår och konkret risk |
|---|---|
| Gemensamma komponenter | Button/PrimaryButton/QuietButton, AppBar/SupportScreenHeader, BottomSheet/Dialog/ActionMenu/Toast, Tabs/BottomNav, ListRow/Card/HeroCard/DestinationTile, ChecklistItem/CheckboxCard, QuickLogTile och EmptyState. Renderers och anrop finns var för sig i inventeringen. |
| Hem och rutiner | Hundporträtt/byta/lägga till hund, karusell, aktivitetsrader, skapa/redigera rutin, dynamiska punkter, dagval, intervall och veckodagar. RoutineActions har långa tvåknappsrader som ska kunna staplas; hantering vid unknown/dirty ska förbli spärrad korrekt. |
| Logg | Snabblogg + Fler/layoutval, förra/nästa datum, äldre poster, dynamiska loggrader, olycksval, typval, editor och undo/retry. Långtryck finns redan för layout; får inte bli enda vägen. Kalender/tid delas med andra formulär. |
| Träning | Flikar, program/steg, fortsätt/alla, bocka/avmarkera, återställ, källor och guardad sheet. Program/stegrubriker och bekräftelsehandlingar behåller namn. |
| Kunskap/FAQ/checklistor | Artikelkort/källänkar, flikar, fas-/kontextval, FAQ-frågor, checkboxar, egna punkter, redigera/spara/radera och oklar mutation. Pennan finns redan för egna punkter. |
| Hälsa/vikt/planer/historik | Listor, eventtypval, datum/tid, create/edit/delete, native actionmeny, reminder och konfliktåterhämtning. Menyns Avbryt-objekt har ibland `as const` och räknas ändå. |
| Profil/onboarding/raser | DogProfile/Settings dog switch och ny hund, dynamisk raslista/fritext, Blandras, namn/födelsedatum/kennel, spara/avbryt och idempotens/recovery. Håll isär hundbyte och redigera profil. |
| Konto/auth/notiser/pass/Mer | Inloggningsmetoder, länk/återhämtning, analytics Switch, kontoradering/logga ut, tillstånd, tidval, PDF-generering/systemdelning och namngivna destinationer. Notisinfo-raden behöver wrap/stack vid stor text. |
| Systemytor | Native Alert-knappar, Linking.openURL, notification permission och Expo Sharing; inventerade som källplatser men knapptext/form i OS-ytorna styrs av plattformen. Inga nya externa meddelanden skickas. |
| Galleri och preview | Egen kategori; är inte bevis för synliga produktknappar eller för data-/RLS-funktion. |

Dynamiska grupper: fliklistor, kalenderdagar/tider, snabbloggtyper, hund-/rasprofiler, rutin-/checklistepunkter, FAQ-kontexter/frågor, artikelkort, träningsprogram/steg och hälsorader. Inventeringen sparar etikett-/ikon-/callbackuttryck och källa; vi räknar inte in ett antaget antal framtida hundar, steg eller artiklar.

## Samtliga bifogade UX-tips: nuläge och beslut

| Tips | Kontrollerat nuläge | Nästa steg / avgränsning |
|---|---|---|
| Haptisk feedback | Ingen expo-haptics-dependency | Senare frivilligt paket efter godkänt native-beroende. Bara bekräftad logg/markering eller definierad valfeedback; aldrig enda återkopplingen. Testa avstängt/på, dubbeltryck, fel och enhetspreferenser. |
| Pull-to-refresh | Ingen RefreshControl; ProductWorkspace har redan timer/app-active-refresh och cache/retry | Paket 4. Behåll automatiken och dog/account-lifetime-skydd. |
| Kunskapssök/filter | KnowledgeScreen har tabs och visibleItems-filter, ingen query/TextInput | Paket 3. Börja utan påhittad ämnestaxonomi eller rasfilter. |
| Favoriter/senast läst | Ingen sådan innehållsmodell; Träning Mina betyder bekräftad progress | Efter MVP, eget datakontrakt för konto/hundscope, lagring, borttagning och hundbyte. Prov: två hundar, återstart, nätfel och radering. |
| Offlineloggning | Ingen beständig offlinekö; fel och osäkert utfall finns | Efter MVP, risk H. Först definiera request-ID, captured dog/owner, auth efter återanslutning, ordning, deduplicering och readback. Acceptans med timeout efter commit, logout/hundbyte, omstart och två enheter. Skriv aldrig ”Sparas när du har nät” innan en sådan kö finns. |
| Dynamic Type | RN skalar text; flera kort och horisontella actionrader kan klippa | Paket 1–2. Web 140% är en proxy; native största text/VoiceOver behöver egen evidens. |
| Mörkt läge | Light är låst, tokens är statiska | Efter MVP, eget tema-/kontrastprojekt över alla skärmar och tillstånd; följa system och manuell preferens kräver produktval. |
| Ångra fler åtgärder | Snabbloggens bekräftade undo finns | Visuell förbättring i 1a. Nytt undo på radering/avmarkering kräver separat write/reconcile-kontrakt per funktion; kontoradering får ingen falsk ångra. |
| Långtryck/snabbmeny | Finns som sekundärt sätt att ändra logglayout | Behåll synlig alternativ väg. Ny radmeny/duplicering är ett eget senare paket, inte en automatisk generalisering. |
| Skeleton överallt | Finns i Hem, Logg, Hälsa och Kunskap; EmptyState främst i galleri | Paket 5 per datayta. Loading, tomt och fel får inte blandas ihop. |
| Synk-/sparbadge | Bekräftad toast och failed/unknown finns | Inga permanenta SPARAD-badges; designregler §8/§14 gäller. Förfina endast tillfällig sanningsenlig feedback i paket 5. |
| Krympande scrollrubrik | Ingen generell sådan komponent | Vänta; lägre MVP-värde än läsbarhet och återhämtning. Kräver separat fokus-/scroll-/reduced-motion-prov. |
| Aktiv bottenmeny | Redan ikon + namn och aktiv state | Regression i paket 2, ingen ny funktion behövs. |
| Smart första tomstart | Hem har tom-/retrytext och tydliga destinationer; inte ett enhetligt CTA-mönster | Paket 5. Föreslå bara en möjlig verklig första handling, utan ny påtvingad onboarding. |
| Artikeldelning/passdelning | Tassla-pass har verklig PDF/systemdelning; artikel-delning saknas | Regression för pass i paket 2b. Artikeldelning senare: definiera URL eller text, AI-etikett/källor och publicerings-/integritetskrav före kod. |
| Widget/Live Activity | Inga native targets eller datakontrakt | Efter MVP. Separat plattforms-/privacy-/kostnadsbeslut och native testpaket, särskilt inga medicinska prognoser för nästa rastning. |

## Verifiering och manuell provlista

Kör relevanta riktade tester, `pnpm check`, public iOS JS-bundle-export när appkod ändrats, whitespace och kövalidering. Före/efterbilder och §14 vid 375×844/430×844, 375×667, lång svensk text och 140% text; dokumentera native/DB/release separat. Lokal källkodskontroll ersätter inte telefonens gesture responder, tangentbord eller VoiceOver.

För den införda sheetändringen: prova kort/långt/snabbt nedåtdrag från handtag/rubrik; scrolla lång text; tryck kryss; öppna igen; dra med tangentbordet uppe; redigera en osparad rutin och kontrollera discard; försök stänga under sparning; prova reducerad rörelse och VoiceOver. De senare ikon-/refresh-/sökpaketen är ännu inte med i builden.
