# AGENTS.md – Tassla

## Projekt
Tassla är en app för nyblivna hundägare. Målet är att göra de första 6–12 månaderna enklare, tryggare och mer roliga.

Vi har ännu inte en färdig kravspec. Vi bygger den fram tillsammans.

## Grundprinciper
- Var ärlig och direkt. Stryk aldrig medhårs.
- Föredra enkla, hållbara lösningar framför komplexa.
- Alltid tänka på nybörjarhundägare (stressade, osäkra, begränsad tid).
- Säkerhet och djurvälfärd går före features.
- Vi bygger MVP först. Feature-creep är fienden.

## Tech-preferenser (preliminära)
- Mobil-first (React Native / Expo eller Flutter – beslutas senare)
- Backend: Node.js eller Python (beslutas)
- Databas: Postgres
- Auth: enkel och trygg

## Multi-agent regler
- Orchestrator planerar och delegerar.
- Specialister gör det de är bäst på.
- Reviewer och Critic har veto-rätt vid dåliga beslut.
- Flera agenter får aldrig skriva i samma fil samtidigt.
- Alltid köra relevanta tester efter kodändringar.

## Kommunikation
- Korta, tydliga svar.
- Markera osäkerhet tydligt.
- Föreslå alternativ när något känns tveksamt.