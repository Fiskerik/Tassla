# Träning

`PublishedTrainingScreen.tsx` visar publicerade program, programmets hela text och källor före stegen, kontoägd registrering och bekräftad återställning. `ProductWorkspace.tsx` läser via `src/data/workspace-data.ts`: endast publicerade versioner/steg och aktuell hunds `training_progress`. En startad och fortfarande publicerad version återupptas framför en nyare version; indragna eller saknade versioner redovisas som pausad historik.

Ett steg sparas med riktiga versions- och steg-UUID genom insert/select. Nästa steg väntar på ett separat knapptryck efter bekräftelse. Återställning använder bekräftelse och delete; ingen upsert/update-grant eller automatisk svårighetsökning används. Registrering beskriver ägarens markering, inte hundens färdighet.

`TrainingScreen.tsx` och `training-model.ts` är bara för lokal preview och dess internt granskade syntetiska text. Normalflödet har inget program som reserv när publicerat innehåll saknas. Kör `pnpm check`; verklig RLS-åtkomst och publicerat datainnehåll behöver separat miljötest.

UI-RESET: produktionsvyn `PublishedTrainingScreen` visar ett program med foto, framsteg och övningsrader. Alla övningar kan läsas i sheet; endast nästa steg kan markeras, och först efter bekräftat sparande uppdateras återkopplingen. Fliken Framsteg visar befintliga markeringar och återställning med bekräftelse. Programtext/källor nås via Om programmet. Inga nya träningsråd eller innehållspubliceringar ingår.

Bekräftad träningsåterkoppling visas utan valpfigur. Spara- och radstatusen är fortsatt knuten till den bekräftade serverposten.

`PublishedTrainingScreen.tsx` visar alternativa publicerade program som fotokort i grid och valt kort flyttar fokus till vyns början. Övning är en separat checklista. Efter bekräftad completion kan ägaren återställa markeringen från detaljarket; serverstatus läses om innan bocken tas bort. Den korta dekorativa konfettin startar först efter bekräftelse och utelämnas vid reducerad rörelse. Completion-toasten används inte. Se [TRAINING-01](../../../docs/tasks/dev/TRAINING-01.md) och [renderad §14-checklista](../../../docs/design/TRAINING-01/checklista.md).

Explicit review builds may use three versioned `review-v1:training:*` layout examples when the real published program query succeeds with an empty list. These rows use `PublishedTrainingScreen` with `reviewMode`; completion and reset live only in component memory and never call `training_progress` handlers. A real fetch error remains an error with retry and does not reveal examples. Copy is marked as an unreviewed temporary example in the view.
