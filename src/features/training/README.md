# Träning

`PublishedTrainingScreen.tsx` visar publicerade program, programmets hela text och källor före stegen, kontoägd registrering och bekräftad återställning. `ProductWorkspace.tsx` läser via `src/data/workspace-data.ts`: endast publicerade versioner/steg och aktuell hunds `training_progress`. En startad och fortfarande publicerad version återupptas framför en nyare version; indragna eller saknade versioner redovisas som pausad historik.

Ett steg sparas med riktiga versions- och steg-UUID genom insert/select. Nästa steg väntar på ett separat knapptryck efter bekräftelse. Återställning använder bekräftelse och delete; ingen upsert/update-grant eller automatisk svårighetsökning används. Registrering beskriver ägarens markering, inte hundens färdighet.

`TrainingScreen.tsx` och `training-model.ts` är bara för lokal preview och dess internt granskade syntetiska text. Normalflödet har inget program som reserv när publicerat innehåll saknas. Kör `pnpm check`; verklig RLS-åtkomst och publicerat datainnehåll behöver separat miljötest.

UI-RESET: produktionsvyn `PublishedTrainingScreen` visar ett program med foto, framsteg och övningsrader. Alla övningar kan läsas i sheet; endast nästa steg kan markeras, och först efter bekräftat sparande uppdateras återkopplingen. Fliken Framsteg visar befintliga markeringar och återställning med bekräftelse. Programtext/källor nås via Om programmet. Inga nya träningsråd eller innehållspubliceringar ingår.
