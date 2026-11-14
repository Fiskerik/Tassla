# GAP-TRAINING-PAUSED-01

Status: qa; lokal kod och oberoende granskning klara, native och full visuell acceptans återstår. Bas `d122622645eefb3f4c44ce488afea7105624d878` med lokala GAP-LOG-UNSURE-01 och GAP-HOME-TRAINING-COPY-01-checkpoints. En skrivägare. Risk M: korrekt träningsstatus och tillgänglighet.

Mål: en pausad träningsresa ska synas som pausad och inte kallas aktiv av skärmläsare i kortet Fortsätt där ni var. Mandat: ägarens GAP-uppdrag och befintliga tränings-/MVP-kontrakt. Critic PROCEED: okänd/pending och otillgänglig progress har företräde; återupptag sker inte genom korttrycket.

Omfattning: `src/features/training/PublishedTrainingScreen.tsx`, `src/features/training/README.md`, `tools/visual-check/verify-training-continue-progress.py`, vid behov befintliga relevanta tester samt detta kontrakt och ny evidenskatalog `docs/design/evidence/gap-training-paused-01/`. Ingen data-, navigations-, tillstånds-, beroende- eller rådändring. Återanvänd tokens och befintlig visuellt godkänd komponentstruktur.

Acceptans: bekräftat pausad resa visar ”Pausad” och tillgänglig etikett säger pausad och senast valda övning, inte aktivt steg. Bekräftat aktiv resa behåller aktiv beskrivning. Pending, unknown och ogiltig progress har företräde utan påstådd pausstatus; korttryck öppnar samma program som tidigare. Kör riktade tester, syntetiska RN Web-fixtures för aktiv/pausad/pending/unknown/ogiltig och 375/430 samt kort skärm/stor text. Jämför panel 6; native VoiceOver/Dynamic Type, server och TestFlight anges separat. QA, reviewer och ui_critic är oberoende och skrivskyddade.

## Checkpoint

Implementerat: bekräftad paus visas som ”Pausad” och tillgängligt namn anger ”pausad, senast valda övning”; aktiv resa behåller ”aktivt steg”. Pending, unknown och ogiltig progress har företräde; pausat kort öppnar samma program. Inga data- eller navigationsändringar. `TASSLA_UI_EVIDENCE` väljer verifierarens utdatakatalog utan att tidigare evidens skrivs över.

Riktade Node-tester: 35 PASS. Syntetisk RN Web-verifierare: PASS för aktiv, bekräftad, färdig, pausad, pending/unknown med pausad underliggande resa, två ogiltiga identiteter, läsfel, legacy samt 320, 375 med 140 % CSS-text och 430 px. Skärmdumpar och resultat finns i `docs/design/evidence/gap-training-paused-01/`. Panel 6 jämförd i `panel6-comparison.png`: pausetiketten använder sekundärtext och kortet behåller befintlig form; helskärmens avvikelser mot målbilden kvarstår. Separat ui_critic, QA och reviewer återstår. CSS-förstoring är inte native Dynamic Type; VoiceOver, verklig server och TestFlight är NOT TESTABLE här.

## Oberoende verifiering

`pnpm check`: 932 PASS, 1 skip. Oberoende QA körde RN Web-verifieraren separat och fann inget konkret fel; reviewer fann ingen blockerare, men noterar att vissa fixtures inte fångar alla pageerror och att provet inte visar verklig server eller native. Ui-critic såg bilderna: pausetikett läsbar även i CSS-textproxy; hela panel 6 är inte visuellt godkänd (färg, typografi, former, bildspråk och täthet avviker; jämförelsen har annan progress än referensen). Kompositionens huvudordning matchar. Kodens `fontScale > 1.2` har en enkolumnsgren; CSS-proxyn aktiverar inte nödvändigtvis den, så verklig Dynamic Type är NOT TESTABLE, inte ett konstaterat fel. Kontroll av scrollmarginal, native VoiceOver och faktisk paus/återupptagning på enhet återstår.
