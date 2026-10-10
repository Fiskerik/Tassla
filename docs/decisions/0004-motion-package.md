# 0004 – MOTION-paketets scope och genomförande

Status: accepterat av Erik 2026-10-10
Datum: 2026-10-10

## Kontext
Tassla ska få avgränsad mikrorörelse, tips vid första användning och en valpfigur. Beslutet utökar uttryckligen den ursprungliga MVP:n för detta paket. Köstatus och filägarskap måste styra startordningen för implementation.

## Alternativ
1. **Genomför MOTION enligt avgränsade slices** – för: tillför rörelse, första-användningstips och valpfigur stegvis; emot: delade UI-filer kräver att kökonflikter löses först.
2. **Avstå från paketet** – för: ingen kökonflikt; emot: genomför inte Eriks beställda förbättring.

## Beslut
Erik beställer MOTION enligt fyra slices, med React Natives inbyggda Animated och utan nya beroenden. Codex tar fram valpfiguren och uppdaterar designreglerna. Figuren får bara positiva eller neutrala lägen. Efter varje implementerad slice ska arbetet stanna för Eriks telefonprov och resultat.

Eriks beslut, ordagrant:

> Scope utanför docs/mvp.md godkänns för detta paket: mikrorörelse, tips vid första användning och en valpfigur.
>
> Rörelse byggs med React Natives inbyggda Animated. Inga nya beroenden (inte Lottie, Rive, Reanimated, react-native-svg eller haptikpaket).
>
> Codex tar fram figurillustrationen och uppdaterar docs/design-rules.md för rörelse och figur.
>
> Figuren har bara positiva eller neutrala lägen. Inget ledset, besviket, sjukt eller skuldbeläggande läge.
>
> Erik testar varje implementerad build på telefon. Stanna efter varje delpaket och vänta på hans resultat.

## Konsekvenser
MOTION delas i fyra kö-taskar och genomförs en slice i taget. Rörelse följer sanningsregeln, reducerad rörelse, tillgänglighet och tokens i `docs/design-rules.md` och respektive MOTION-UX-spec. Ingen ny analytics-händelse läggs till. Kökonflikten med blockerade tasks måste lösas innan överlappande implementation.

## Hur dyrt är det att ändra senare?
Medel. Slicarna är avgränsade, men komponenter, tokens och ägarflaggor delas med andra UI-flöden.

## Vad skulle få oss att ändra oss?
Eriks nya beslut, upptäckt av oacceptabel kööverlappning eller evidens från telefonprov/tillgänglighetsgranskning som kräver att en slice ändras eller stoppas.
