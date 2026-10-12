# TRAINING-01 – visuell evidens och §14-checklista

Oberoende browser-rendering genom `tools/visual-check/training-app.tsx` och `verify-training.py`. Skärmdumparna är syntetiska och visar endast layouter/interaktion; de är inte publicerat träningsinnehåll eller verkliga hunddata.

Evidens: [360 normal](evidence/loaded-360.png), [430 normal](evidence/loaded-430.png), [360 stor text](evidence/loaded-360-large-text.png), [programfokus](evidence/program-focus-360.png), [completion](evidence/completion-after-action-360.png), [undo](evidence/undo-after-action-360.png), [reducerad rörelse](evidence/completion-reduced-motion-360.png), samt 360/430 för [laddar](evidence/loading-360.png), [tomt](evidence/empty-360.png), [förinställt fel](evidence/error-360.png), [fel innan tryck](evidence/failure-360.png) och [misslyckad completion efter tryck](evidence/failure-after-action-360.png).

Browserkontrollen passerade 15 fall: loading/empty/error/failure/loaded i 360/430 px; programval behåller aktiv flik och scrollar fokus till toppen; avklarad övning återställs först efter bekräftad callback; completion visas med icke-blockerande dekorativ konfetti utan success-toast; misslyckad completion lämnar punkten omarkerad och visar fel (inklusive efter-tryck-skärmbild); reducerad rörelse behåller genomförd bock utan konfetti; 140 % text vid 360 px utan overflow eller delad bottenmenytext. Program- och undo-knappens touch targets mäts minst 44 × 44 px. Inga browserfel.

## Design rules §14 – oberoende browsergranskning

| # | Kontroll | Resultat |
|---:|---|---|
| 1 | Högst en primär knapp i vyn | PASS; program-/övningskort är navigering, completion är en primär handling i detaljarket. |
| 2 | Knappar i grupp har samma storlek/stil | PASS; tabs, övningsrader och programkort är konsekventa. |
| 3 | Radering särskiljs och går att ångra | PASS; undo är uttrycklig, sparas med exakt hund/programversion/steg och kräver färsk läsning. Programreset kräver befintlig bekräftelse. |
| 4 | Inga stora Ändra/Radera-länkar på listrader | PASS; inga sådana länkar. |
| 5 | Avstånd följer tokens och sektionsrubriker har konsekvent luft | PASS; content och kort använder befintliga spacing-tokens. |
| 6 | Inga hårdkodade färger eller px-värden i produktkodens diff | PASS; animation, ytor, typografi och mått använder tokens. Browserharnessens viewportvärden är testdata. |
| 7 | En ikonuppsättning, inga emoji | PASS; befintliga Ionicons och hundfoton. |
| 8 | Kategorifärg och ikon stämmer | PASS; Träning använder befintlig grön träningskategori. |
| 9 | Ikoner förstås utan förklaring | PASS tillsammans med övningstext, programtitel och framsteg. |
| 10 | Inga statusetiketter på normala poster | PASS; “Program” förklarar innehållstyp, inte sparstatus. |
| 11 | Högst en handlingskrävande informationsruta | PASS; fel-/retrytext visas endast efter fel. |
| 12 | Förbjudna ord saknas | PASS; inga tillagda förbjudna statusord eller vaga AI-/hälsolöften. |
| 13 | Förklarande text är högst två rader och har rätt ton | PASS; korta instruktioner och metadata; full programtext/källor läses i arket. |
| 14 | Laddar, tomt, fel och normal är utformade | PASS i renderad state-matris, inklusive misslyckad completion. |
| 15 | Tryckytor minst 44 × 44 pt och stor text fungerar | PASS i browser: programkort/undo-knapp uppmätta, 140 % text utan horisontellt spill eller delade bottenmenytexter. Fysisk Dynamic Type är ej testad. |
| 16 | Layout matchar målbild och avvikelser dokumenteras | PASS med avgränsning: valda tillgängliga program är fotokort i grid; syntetiska foton/text är endast visuell fixture. |
| 17 | Appbar, flikar och bottenmeny enligt målbild | PASS; “Valpprogram” förblir aktivt vid fokusbyte. Bottenmenyns avstånd justerat så stor text inte delar etiketter. |
| 18 | Foto/hundnamn visas där målbilden gör det | PASS för befintligt programfoto och programnamn; inget ägarfoto fabriceras. Personlig hundbild hanteras av separat PROFILE-DOG-01. |

## Gränser

Browserharnessen verifierar callback-livscykel, inte live Supabase-serialisering/RLS. `workspace-data.test.mjs` provar exakta hund-/programversion-/stegfilter, lyckad delete, lost response med bekräftad frånvaro och olöst delete. Native VoiceOver, fysisk Dynamic Type, native scroll och iOS-bundle är separata kontroller; de ska redovisas separat och ska inte härledas från webbrenderingen.
