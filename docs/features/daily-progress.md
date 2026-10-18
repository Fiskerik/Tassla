# Dagens framsteg

DailyProgressScreen är en separat detaljvy från Hem som visar samma dagsuppgifter som Hem härleder från den aktiva dagssnapshoten. Den sparar ingen egen progress och tar inte med logghändelser.

## Källa och interaktion

Rutiner och valda träningssteg kommer från ProductWorkspace och daily-activity-model.ts. Rutindelens bock använder samma setRoutineDayCompletion-mutation, freshness-/scope-gate, readback och retry som Hem. Träningsrader öppnar bara det exakta publicerade programversions- och stegmålet när dagens scope fortfarande stämmer. Tillbaka återgår till Dagens framsteg och därefter återställer Hem sin befintliga scrollposition.

Progressring, siffra och lista använder summarizeDailyActivityProgress. Ringen ritas med SVG-cirkelstreck: 220 pt renderad SVG-storlek, radie 100 SVG-enheter och linjebredd 12 SVG-enheter. Bekräftad progress använder en exakt strecklängd på cirkelbanan; okänd status får en separat amberbåge på 8 grader med en 1-graders lucka. Neutral bana, färger och icke-progress semantik för okänd/stale status bevaras. Okända träningskällor visas separat från bekräftade uppgifter. En rutin får ingen egen slutförandetid från rutinradens completed_at; endast en exakt completedAtByStepId-stämpel för dagens träningssteg kan visas. Ingen veckomålsindikator finns eftersom population, period och datakälla saknar ett definierat kontrakt.

## Tillstånd

Laddning, läsfel, tom dag, senast bekräftad snapshot efter misslyckad uppdatering och partiell okänd status visas separat. Ett initialt läsfel blir inte noll progress. En tom dag visar neutral ring utan ett falskt 0 av 0 resultat.

## Verifiering

R6 har en offentlig/syntetisk RN Web-fixture på ?screen=daily-progress&homeScenario=training-target och delar samma presentationskomponent med produktflödet. Syntetiska data kan verifiera layout och interaktion lokalt; live Supabase/RLS och native skärmläsarprov är separata kontroller.
