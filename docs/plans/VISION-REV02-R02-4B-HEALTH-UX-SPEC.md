# UX-spec — rev02 R02-4B: Hälsa, vikt och utförd historik

Datum: 2026-10-13 · Version: 1 · Status: ready for implementation · Ägardirektiv: visuellt uppdatera återstående befintliga skärmar.

## Användaruppgift

Ägaren ska kunna läsa vikt och utförda vaccinationer/veterinärbesök, registrera eller rätta samma uppgifter och förstå att de är egna noteringar. Hälsöversikten ska hålla planerade och utförda poster visuellt åtskilda och erbjuda befintlig väg till planering.

## Scope och beteendegräns

Endast `HealthScreen`, dess viktvy och editorn för utförd historik. Rutter, tabbar, fält, datum-/tidsvalidering, ordning, källor, retry, pending/unknown/conflict, save-confirmation, radering och bekräftelse lämnas oförändrade. Ingen diagnos, rekommendation, graf, vaccinationsschema eller uppgift om att en notering verifierats tillkommer. Planerad hälsa har egen efterföljande slice.

## Visuell riktning

- Hälsöversikten får vänsterställd rubrik och en kort sanningsenlig undertext.
- Befintliga segment använder den redan godkända opt-in-kapselvarianten, med vald vy grön.
- Utförd vaccination får befintlig röd kategoriaccent; veterinärbesök och vikt får blå accent. Färg kompletteras alltid av symbol/etikett.
- Viktinmatningen och den senaste posten har varm ljus kortyta, lugn formhierarki och tydlig enhet `kg`; historiken går att läsa som poster utan ny mät-/trendmodell.
- Utförda poster fortsätter markeras som genomförda endast när de finns i sparad historik.
- Destructive rättning och osäker/conflictstatus står kvar nära formuläret.

## Tillgänglighet och render

Kontroller och tabbar har minst 44 pt träffyta. Behåll radiogrupp-/checkboxsemantik och live feedback. Granska 375×844, 430×844, 375×667 och 140 % browserzoom med svensk längre copy. Rendera översikt, vikt, tom historik, utförd edit, loading/error och minst en retry/konfliktvariant där harnessen kan visa samma produktkomponenter. Webben verifierar inte native Dynamic Type, skärmläsare, fysisk tangentbordshantering eller Supabase/RLS.

## Filscope

- `src/features/health/HealthScreen.tsx`
- `src/features/health/WeightScreen.tsx`
- `src/features/health/HealthHistoryScreen.tsx`
- `src/features/health/README.md`
- `tools/visual-check/app.tsx`
- `docs/plans/VISION-REV02-R02-4B-HEALTH-UX-SPEC.md`, R02-4-plan, queue, rapport och `docs/design/evidence/vision-rev02/r02-4b/`.

## §14 bedömning

Hälsa saknar en egen referenspanel i `vision_rev02.jpg`; granskningen jämför därför mot rev02:s gemensamma varma ytor, kapselsegment, kategorifärger och grupperade rader. Redovisa närmaste match och varje kvarvarande skillnad; påstå inte exakt panelmatch. Före/efter-vyer och färgroller granskas sida vid sida.
