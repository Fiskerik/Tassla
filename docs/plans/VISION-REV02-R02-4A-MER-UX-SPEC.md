# UX-spec — rev02 R02-4A: Mer

Datum: 2026-10-13 · Version: 1 · Status: implementing · Ägardirektiv: fortsätt med återstående skärmar efter ägar-QA.

## Användaruppgift

Ägaren ska hitta Hälsa, Tassla-pass, Hundprofil, Påminnelser och Konto/support från Mer och förstå destinationernas innehåll innan hen öppnar dem. Utloggning ska ligga avskild från navigationsvalen men vara fortsatt lätt att hitta.

## Avgränsning

Endast menyn Mer. Ingen route, destination, formulärmodell, notis, kontohandling eller dataändring läggs till. Varje befintlig menyhandling behåller samma callback. Ingen ny copy om medicinsk nytta eller personlig hundbild.

## Visuell riktning

- Behåll gräddvit appcanvas, vänsterställd rubrik och ljusa rundade ytor.
- Gruppera tre hundrelaterade destinationer under `Din hund` och två kontorelaterade destinationer under `App och konto`.
- Varje rad har en tydlig ikonbricka, rubrik, befintlig förklarande text och chevron. Semantiska accentfärger skiljer hälsa (blå), Tassla-pass (lila), profil (grön), påminnelser (bärnsten) och konto (blå) åt.
- Avstånd och separatorer skapar två begripliga grupper utan att göra varje val till ett tungt kort.
- Logga ut är en separat, sekundär handling under grupperna; befintligt fel och busy-läge ligger intill handlingen.

## Beteende och tillgänglighet

- Alla fem destinationsrader fortsätter öppna befintliga rutter.
- Logga ut behåller befintlig bekräftelse, `signingOut`-disabled och felåterhämtning.
- Rader är minst 44 pt höga, har knappsemantik och begriplig tillgänglighetslabel. Ikoner är dekorativa för hjälpmedel.
- Layouten ska fungera vid 375/430 pt, 667 pt höjd, långa svenska texter och 140 % browserzoom. Webbrendering påstår inte att native Dynamic Type/safe area är verifierad.

## Filscope

- `src/features/more/MoreScreen.tsx` (ny presentational screen)
- `src/features/home/ProductWorkspace.tsx` (ersätt inbäddad vy med samma presentational component; behåll callbacks)
- `src/theme/tokens.ts` (endast semantiska, opt-in supportaccentroller)
- `tools/visual-check/app.tsx` (montera samma MoreScreen i lokal fixture)
- `src/features/more/README.md` (beteende- och visuell dokumentation)
- `docs/plans/VISION-REV02-R02-4A-MER-UX-SPEC.md`, R02-4-plan, queue, rapport och render-evidence.

## §14 acceptans

Rendera More i public/review vid 375×844, 430×844, 375×667 och 140 % browserzoom. Bedöm separat färgfördelning, hierarki, radformer, långa labels, utloggningsavstånd och bottennavigation. Verifiera alla fem destinationsanrop i harnessen, befintlig logga-ut-busy/felrender och inga browserfel. En fungerande klickresa bevisar inte native eller auth-beteende.

## Ej tillgängligt i denna slice

Panel 8–9 saknar jämförbar `vision_rev02.jpg`-panel för Mer. Likhet bedöms därför mot gemensamma visuella regler och närliggande kort-/radfamiljer; detta är dokumenterad närmaste match, inte pixelmatchning. Hälsa, profil, export, notiser, konto, beta och autentisering får egna efterföljande slice-specar.
