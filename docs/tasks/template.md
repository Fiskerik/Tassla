# Arbetsplan och återupptagning

För större arbeten: dela upp före start. En aktiv deluppgift är standard, högst två samtidigt med separata skrivområden.

| ID | Deluppgift | Ägare | Beroenden | Filer/leverans | Acceptanskriterium | Verifiering | Status |
|---|---|---|---|---|---|---|---|
| 01 | Fyll i konkret uppgift | Fyll i | Fyll i | Fyll i | Fyll i | Fyll i | Ej startad |

## Checkpoint per deluppgift
- Läsbarhet/städning: konsekvent namngivning, enkelt ansvar, borttagen överflödig/oanvänd kod och kontroller efter ändringar; dokumentera även om ingen refaktorering behövdes.
- UI vid relevans: brand, färg/typografi, tryckrespons, övergångar och reducerad rörelse enligt docs/dev/ui-and-code-standards.md.
- Dokumentation: README/guide som ändras, målgrupp och relevanta startpunkter. Ingen separat README behövs för varje liten fil.
- API-verifiering: ändrade externa anrop/importer, installerad version och hur verklig funktion verifieras; redovisa luckor.
- ID och status: ej startad / pågår / verifierad / blockerad.
- Vad ändrades och var finns resultatet?
- Vilka kontroller kördes, resultat och vad är ännu overifierat?
- Öppna frågor och beroenden.
- Exakt nästa steg och minsta underlag som behövs för att fortsätta.

Spara efter varje deluppgift och före längre verifiering när möjligt. Påbörja inte ett nytt skrivarbete innan föregående checkpoint finns. Återuppta första ofärdiga deluppgiften; läs dess status och relevanta filer. SDK-teamet kan föreslå planen men saknar skrivverktyg; Codex eller människan sparar den. Ingen automatisk återstart efter användningsgräns är implementerad.

## Release-log
Länka docs/releases/<paket-id>.md och uppdatera Major changes, Minor changes, Bug-fixes, verifiering och nästa sprint/paket enligt AGENTS.md. Ange commitbas och faktisk leveransstatus.
