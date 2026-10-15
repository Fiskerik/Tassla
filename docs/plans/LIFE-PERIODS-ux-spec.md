# LIFE-PERIODS – avgränsad UX-specifikation

**Mål:** På Hem ska ägaren se en begriplig period för hundens ålder. Befintliga aktiviteter, checklistor och progression ska fungera som förut.

**Väg:** Födelsedatum från hundprofilen → central periodresolver → den befintliga lilla metaraden på Hem. Texten blir ”Åldersperiod: {periodnamn}”. Saknat, felaktigt eller framtida datum döljer ålder och period som tidigare. Ingen ny knapp, vy, animation eller informationstäthet tillkommer. Profilens val av åldersenhet påverkar fortsatt inte Hem.

**Checklista:** Det uttryckliga kontextvalet inför/första dagarna hemma vinner över åldersrekommendation. Före åtta veckor finns ingen automatisk händelserekommendation; användaren kan välja händelsen själv. Sparade bockar och egna punkter ligger på samma gamla mall-ID:n. Okänt sparutfall, återförsök och skärmläsartext följer befintligt flöde.

**Visuell jämförelse:** Panel 1 i `vision_rev02.jpg` visar en kompakt identitetsrad med ålder och fas. Nuvarande Hem har redan en separat metarad; den återanvänds med nytt periodnamn. Samma `dogPhase`-stil och temats befintliga texttoken används. Ingen layout- eller färgändring ingår. Visuell kontroll på liten/stor telefon och stor text återstår; kodtester är inte visuell evidens.

**Skrivfiler:** `src/features/onboarding/life-stages.ts`, `dog.ts`, `src/features/home/HomeScreen.tsx`, `PreviewHomeScreen.tsx`, `src/features/knowledge/checklist-model.ts`, berörda tester och modulguider. Skyddade områden: profilens sparade data, innehållsversioner, träningsprogression, hälsohändelser, påminnelser, notifieringskanaler och övrig navigering.
