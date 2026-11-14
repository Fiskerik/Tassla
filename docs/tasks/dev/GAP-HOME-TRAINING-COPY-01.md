# GAP-HOME-TRAINING-COPY-01

Status: implementing. Bas: `d122622645eefb3f4c44ce488afea7105624d878`, med lokal GAP-LOG-UNSURE-01-checkpoint. Skrivägare: koordinatorn. Risk L: text i osäkert sparläge.

Mål: förklara ett osäkert resultat för träningsresan med vardagligare svenska utan att lova sparning eller ändra återförsöket. Mandat: ägarens GAP-uppdrag och befintligt MVP-/sparstatuskontrakt. Critic rekommenderar att inte antyda en generell spärr.

Ingår: texten för `trainingJourneyDisplay.pending.status === 'unknown'` i `src/features/home/HomeScreen.tsx`, eventuell relevant verifiering och detta dokument. Ingen ändring av data, återförsök, navigation, tillstånd eller andra meddelanden. Läsunderlag: designregler, HOME-REV02-spec, konsument-UX och iOS-skill samt befintlig implementation.

Acceptans: texten anger att sparresultatet är okänt och föreslår kontroll. Samma knapp/callback och bekräftelsekrav kvarstår. Kontrollera lokalt `pnpm check`, relevanta tillståndstester, render av unknown vid liten skärm och större text, samt jämförelse med panel 1 där möjligt. Native VoiceOver/Dynamic Type och verkligt nätverk redovisas separat. Oberoende QA/reviewer granskar diff och evidens; visuell helhetsacceptans förutsätter §14 och rättvis jämförelse.

## Checkpoint

Texten är ändrad till ”Vi kunde inte se om ändringen sparades. Kontrollera den igen.” Samma knapp och callback kvarstår. `pnpm check`: 932 godkända, 1 hoppat. RN Web-fixture `suggestionPending=unknown`: text och åtkomligt knappnamn synliga, knapp minst 44×44, ingen horisontell overflow vid 375×844, 430×844 och 375×667 med 140 % CSS-textproxy. Bilder: `docs/design/evidence/gap-home-training-copy-01/`. Kontroll med verklig server eller native är inte gjord.

Oberoende QA och reviewer fann ingen konkret blockerande defekt; de bekräftade att ProductWorkspace återanvänder samma programbundna operation. Ui-critic såg renderingar och fann text och knapp läsbara utan överlapp; hela panel 1 avviker fortfarande i komposition, färger, typografi, former, bildspråk och täthet. Unknown-fixturen skiljer sig från normalreferensen och fastslår inte orsaken till varje avvikelse. Panelen är inte visuellt godkänd. Verklig VoiceOver, Dynamic Type, native safe area och nätverksåterhämtning återstår.

Ändrade sökvägar: `src/features/home/HomeScreen.tsx`, detta kontrakt och evidenskatalogen. Nästa steg för denna del: kontrollera native enhet samt fortsätt normalpanelens separata visuella arbete. Ingen build eller distribution utförd.
