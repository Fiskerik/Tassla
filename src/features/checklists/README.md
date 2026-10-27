# Delade checklistkontroller

`checklist-icons.ts` är den gemensamma datamodellen för den befintliga uppsättningen av 20 valbara Ionicons, svenska etiketter, validering och semantiska toner. Den har inga React Native-beroenden så datalager, tester och båda UI-ytorna kan använda exakt samma allowlist.

`ChecklistIconPicker.tsx` delar en namngiven ikonknapp och radioval så att varje konsument kan välja en layout som passar sin yta. Rutinredigeraren visar alternativen i dokumentflödet under den aktiva punkten så att valen kan nås genom att rulla i formuläret. Kunskap expanderar ikonraden i formulärets flöde under rubrikfältet; den flyter inte ovanpå eller utanför formuläret. Alla val har 44 pt målyta och tillgängliga svenska namn.

Rutinernas metadata ligger kvar på `dog_daily_routines.checklist` via befintliga RPC-kontrakt. Egna faschecklistepunkter använder nullable `dog_checklist_custom_items.icon` efter `202610230001_checklist_custom_item_icons.sql`; deras läsning, CAS, exakt readback och pending intent ligger i Knowledge-modulen. Fallback-ikonen `list-outline` är bara presentation och sparas inte automatiskt.

Verifiera med `tests/daily-routine-checklist-icons.test.mjs`, `tests/checklist-data.test.mjs`, `tests/checklist-ui.test.mjs`, `tests/daily-activity-ui.test.mjs` och visual-checks för checklistor/Knowledge. Webbevis använder syntetiska poster; det kör inte den nya SQL-proben eller live RLS.
