# MVP-innehållsinventering — metadata-slice v1

Mandat: Eriks begäran 2026-10-06 att fortsätta enligt `mvp-population-2026-10-06.md`, slice 1. APP-05:s lokala kod är färdig, verifierad och checkpointad i `app-05.md`, `rapport.md` och köhistoriken. Ingen ytterligare hälsokod, datainsamling eller betaaktivering ingår.

## 1. Inventering och struktur — Implementer, GPT-6 Luna high

- Filer: `docs/content/mvp-content-inventory.json`, `docs/content/README.md`, `tools/validate_content_inventory.py`.
- Beroenden: rotplanen och APP-05:s hållbara checkpoint; inga nya paket.
- Åtta små redaktionella ämnesförslag: före hemkomst, första veckan hemma, vardagslogg/rutiner, hantering, miljötrygghet, ensamhet, ägarregistrerad vikthistorik och registrering av vaccinations-/veterinärhändelser. Enbart titlar/ämnen; ingen medicinsk, tränings- eller utfodringsinstruktion.
- Rotfält: `inventory_version: 1`, `scope: editorial_metadata_only`, `items`.
- Itemfält: unikt `id`, `title`, `topic`, `content_type` (article/guide/checklist/training_program), `age_window_weeks` (min/max som redaktionella förslag), exakt `status: proposed`, tomma `sources` och `review_evidence`, `review_required`, `blocked_by`.
- Alla items kräver `source_selection` och `pilot_selection`; hälso-/träningsämnen kräver dessutom `dog_expert` i `review_required` och `expert_review` i `blocked_by`.
- Förbjud item-fält för content-version, body, databas-ID, granskningstid och publicering. Inventeringen är inte importerbar till databasen; verkliga källor/fulltext/granskning och mappning till befintliga contenttabeller görs i senare separat slice.
- Acceptans: alla åtta förslag är ärligt opublicerade; struktur och åldersfönster är explicita, inga sakpåståenden eller påhittade källor; validatorn kräver exakt proposed och tomma käll-/evidenslistor. Inga nya dependencies eller ändringar i app/SQL.

## 2. Verifiering och checkpoint — QA/Reviewer, koordinator sparar

Kör `python tools/validate_content_inventory.py`. Bekräfta att temporära fixtures med duplicerat id, felaktigt åldersfönster, published trots påhittad källa/evidens, item-level version eller saknad expertgrind underkänns; originalinventeringen ska passera. Kör `git diff --check`. Detta är strukturkontroll, inte sakgranskning, publikation eller databas-/telefonverifiering. Spara faktiskt utfall och oberoende QA/Reviewer-resultat här och i rapporten.

## Critic före skrivning

`app05_critic`: PROCEED WITH CHANGES. Kräv exakt proposed, alltid underkänn published och använd `inventory_version` på roten utan item-level version. Dessa ändringar ingår i denna exakta plan. Alla förslag blockeras av käll-/piloturval och relevanta expertgrindar. En validator får inte skapa en parallell publiceringsmodell.

Architect-granskning återstår före skrivning av implementationens tre filer. Koordinator äger denna plan/rapport; Implementer äger enbart ovan angivna filer.

## Architect v1

`app05_architect`: **APPROVE — MVP-CONTENT-INVENTORY metadata-slice plan v1**. Validatorn ska använda stdlib, stängda rot-/itemfält, exakt åtta poster, unika icke-tomma id, tillåtna contenttyper, heltalsfönster min ≥ 0/max ≥ min, proposed och tomma käll-/evidenslistor. Valfri indatafil eller importbar funktion möjliggör negativa fixtures utan att originalet ändras. Expertgrind följer deterministiskt uttryckliga hälso-/träningsämnen. Tasken registreras i kön före skrivning; koordinatorns write paths är separata.

## Leverans och oberoende verifiering

Luna high skrev de tre tilldelade filerna. `python tools/validate_content_inventory.py` PASS: åtta föreslagna poster; `git diff --check` PASS. Validatorns `validate_inventory(data)` och valfria CLI-sökväg är de faktiska kontrollingångarna. Inga app-, SQL- eller dependencyändringar gjordes i denna slice.

QA `app05_qa`: **PASS struktur**. Originalet accepterades och tio isolerade temporära fixtures underkändes via både funktionen och CLI: duplicerat id, negativ min, max < min, booleskt åldersvärde, published med påhittad källa/evidens, icke-tom källista, icke-tom evidenslista, item-level version, saknad dog_expert-grind samt saknad expert_review-spärr. Inga originalfiler ändrades för dessa kontroller.

Reviewer `app05_reviewer`: **PASS**, inga fynd. Slutet schema, topic-täckning, opublicerad status, tomma käll-/evidenslistor, åldersfönster och expertgrindar verifierade. Egen diffcheck PASS; QA-evidensen återanvändes utan påstådd omkörning. Detta är inte faktagranskning, verifiering av källors kvalitet, publikation eller faktisk databas-/telefonkontroll.

Checkpoint: metadata-slicen är färdig. Nästa innehållssteg kräver verkligt källurval, pilotprioritering och sakgranskning av fulltexter; nuvarande JSON får inte importeras/publiceras. Beta och nästa hälsoslice har kvar de separat dokumenterade besluten/verifieringarna.
