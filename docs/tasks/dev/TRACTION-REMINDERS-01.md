# Traction P5 — frivilliga fas- och rutinpåminnelser

Bas `knowledge/d3-catalog-delivery@9cdaf92`. Målet är två frivilliga lokala påminnelser inom upplevelseplanen. Befintliga hälso- och träningsnotiser, lagrade val, kontobindning och separat OS-behörighet ska bevaras. Ingen databas, extern tjänst eller beroende ändras.

- Rutinpåminnelsen har en tid användaren väljer och öppnar checklistan. Den påstår inte att en viss rutin finns eller har genomförts.
- Faspåminnelsen bygger på samma ungefärliga kalenderåldersgränser (6 och 24 månader) som Utveckling, använder kl. 09 lokal tid och öppnar Utveckling. Den anger inte uppnådd färdighet och planeras bara vid giltigt, icke-framtida födelsedatum och framtida fasbyte.
- Nya val är av från början. Gamla SecureStore-val bevaras; avstängning eller byte av konto/hund städar endast Tasslas egna notiser. Generisk låsskärmstext innehåller inga namn eller hälsouppgifter.
- Testa äldre preferenser, fasdatum/månadsslut/DST, giltighet, schemaläggning, avstängning, routes och fel. Rendera inställningsskärmen och låt UI/UX-critic granska. Native leverans/VoiceOver och TestFlight kan inte verifieras med browser-fixture.
