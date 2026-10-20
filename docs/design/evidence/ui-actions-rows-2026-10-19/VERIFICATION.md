# UI-ACTIONS-ROWS — visuell och funktionell kontroll

Datum: 2026-10-19. Lokal arbetsgren: `codex/tassla-ui-ux-bundle-2026-10-18`. Bas: `b59169c`. Status: lokal syntetisk kontroll PASS för den avgränsade UI-slicen; oberoende QA och Reviewer väntar.

## Fixture och provupplägg

- Produktionskomponenter renderades genom repoets isolerade React Native Web-harness. Public logg och review-Hem använde endast syntetiska fixturedata; inga konton, backendläsningar eller skrivningar.
- Vyporter: 375×844, 430×844 och 375×667. Stortextprovet använde 140% CSS-webzoom ovanpå 375×667. Det är ett trängre webblayoutprov, inte native Dynamic Type.
- Skärmbilderna visar hela preview-sidan där `fullPage` användes. Reviewens `AI-GENERERAD STANDARDBILD`-banner hör till fixturet och är inte en appbanner.
- Native VoiceOver/TalkBack, fysisk iOS-touch, safe area, Dynamic Type-inställning och Codemagic/Xcode-signering är **NOT TESTABLE** här.

## Kontroller och evidens

| Nr | Bedömning | Underlag |
|---:|---|---|
| 1 | Ja — `Spara ändring` är den enda primära åtgärden och stannar i sheet-footer; kategoriväljaren är sekundär. | [Logglista 375×844](./log-expanded-375x844.png), [kort vyport](./log-lower-actions-375x667-140.png) |
| 2 | Ja — loggens Radera/Avbryt är jämställda sekundärknappar; rutinens Spara rutin är tydligt primär. | [Nedre loggåtgärder](./log-lower-actions-375x667-140.png), [veckorutin](./weekdays-375x844.png) |
| 3 | Ja — Radera behåller text och destruktiv stil. Syntetisk Alert visade både Radera och Avbryt; Avbryt lämnade posten kvar. | [Nedre loggåtgärder](./log-lower-actions-375x667-140.png) |
| 4 | Ej tillämpligt — denna slice ändrar inte Hemmets aktivitetsrader eller deras fördjupningsväg. | Inte en del av paket 1b. |
| 5 | Ja — loggens innehåll rullar i befintlig BottomSheet medan sparknappen står kvar i footern. Alla fält och sekundäråtgärder nås i 375×667/140%. Veckodagsradens overflow rullar horisontellt. | [Kort loggvyport](./log-expanded-375x667-140.png), [nedre åtgärder](./log-lower-actions-375x667-140.png), [veckodagar vid stor text](./weekdays-end-375x667-140.png) |
| 6 | Ja — återanvänder befintliga `IconChip`, `IconOnlyButton`, `BottomSheet` och delade storlekstokens; ingen global knappstil ändras. | Källkod och [rutinvy](./routine-list-375x844.png) |
| 7 | Ja — Ionicons-chevron och befintliga händelseikoner används; den markerade typen visas i cirkel tillsammans med nedåtpil. | [Stängd väljare](./log-collapsed-375x844.png), [öppen väljare](./log-expanded-375x844.png) |
| 8 | Ja för denna kontroll — kategori- och valda färger följer befintliga komponenttokens. Ingen färg- eller kontrasttoken ändrades. Full panelkontrastrevision ingår inte. | [Öppen väljare](./log-expanded-375x844.png) |
| 9 | Ja — nedåtpilen öppnar typer; varje rad visar rätt komponentikon och namn. Val av Olycka visar fortsatt följdfrågan ”Vad hände?”. | [Öppen väljare](./log-expanded-375x844.png) |
| 10 | Ej tillämpligt — inga statusbadges eller bockar för sparade vardagsposter tillkommer. Den valda radiotypens bock betyder enbart valt alternativ. | [Öppen väljare](./log-expanded-375x844.png) |
| 11 | Ja — inga nya banners eller uppmuntringar införs; reviewmarkeringen kommer från den syntetiska fixturen. | [Rutinvy](./routine-list-375x844.png) |
| 12 | Ja — synliga namn är korta, vardagliga svenska; fulla veckodagsnamn behålls som tillgänglighetsnamn. | [Veckodagar 375×844](./weekdays-375x844.png) |
| 13 | Ej tillämpligt — artiklar, metadata och bildandel ändras inte i denna UI-slice. | Inte en del av paket 1b. |
| 14 | Ja för relevanta tillstånd — stängd/öppen väljare, valt/ovalt, olycksföljd, befintlig validering och bekräftad raderingsavbrytning provades. Inga nya asynkrona ladd-/sparlägen införs. | [Öppen väljare](./log-expanded-375x844.png), [kort vyport](./log-lower-actions-375x667-140.png) |
| 15 | Ja i webbharnessen — rutinpennan och veckodagsmål mättes till minst 44×44; radioalternativ visar `aria-checked`, och hela veckodagsnamn exponeras. Native VoiceOver/TalkBack, Dynamic Type och reduced-motion är **NOT TESTABLE**. | [Rutinväljare 430×844](./weekdays-430x844.png), [stor text och söndag](./weekdays-end-375x667-140.png) |
| 16 | Ej tillämpligt på denna komponent-slice — full jämförelse mot rev02-panelerna och helskärmsacceptans hävdas inte. Visuell likhet är kontrollerad enbart för de ändrade kontrollerna. | Skärmbilderna i denna mapp visar kontrollernas rendering, inte fulla panelreferenser. |
| 17 | Ej tillämpligt — rubriker, segment, huvudflikar och navigationsresor ändras inte. | Inte en del av paket 1b. |
| 18 | Ej tillämpligt — hundidentitet, porträtt och hundspecifikt innehåll ändras inte. | Inte en del av paket 1b. |

## Beteendeprov

- Logg: val av befintlig Bajs-post → aktuell Bajs är förvald (`aria-checked=true`) → alla sju typer syns med ikon och namn → Olycka visar Kiss/Bajs-följdval → byte tillbaka till Bajs stänger listan och bevarar datum `2026-10-18`, tid `12:05` och anteckningen `Draft survives type switch`. `aria-expanded` ändras korrekt. | [Utkast bevaras vid typbyte](./log-collapsed-draft-375x667.png)
- Kort loggvyport: datum, tid, anteckning, Radera, Avbryt och sparknappen nås när listan är öppen; sparknappen stannar inom skärmen. Radera/Avbryt-bekräftelsen går att avbryta utan att posten tas bort.
- Rutin: pennknappen `Redigera rutin Morgonrutin` är ikon-only och 44×44; repetition → Eget intervall → Veckor ger exakt `Må, Ti, On, To, Fr, Lö, Sö` på en rad. Alla targets är minst 44×44. Vid 375×667/140% är söndag åtkomlig via horisontell scroll; uppmätt scrollbredd 332px mot 212px synlig bredd.
- Checklistepennan ändrades inte; regressionstestet kontrollerar den riktiga gemensamma `Button variant="icon"`-implementationen och dess fulla tillgänglighetsnamn.

## Tre separata statusar

- **Visuell likhet:** PASS för ändrade kontrollmönster; full rev02-panelmatchning är inte bedömd.
- **Fungerande resa:** PASS i syntetisk lokal fixture för kontrollerna ovan.
- **Produktionsdata:** NOT TESTABLE; inga Supabase/RLS-anrop utfördes.

## Bilder

- [Logg, väljare stängd, 375×844](./log-collapsed-375x844.png)
- [Logg, stängd väljare efter typbyte; datum/tid/anteckning bevarade, 375×667](./log-collapsed-draft-375x667.png)
- [Logg, väljare öppen, 375×844](./log-expanded-375x844.png)
- [Logg, väljare öppen, 430×844](./log-expanded-430x844.png)
- [Logg, väljare öppen, 375×667/140%](./log-expanded-375x667-140.png)
- [Logg, nedre fält och åtgärder, 375×667/140%](./log-lower-actions-375x667-140.png)
- [Rutinhall med pennknapp, 375×844](./routine-list-375x844.png)
- [Veckodagar, 375×844](./weekdays-375x844.png)
- [Veckodagar, 430×844](./weekdays-430x844.png)
- [Veckodagar, slutet av raden, 375×667/140%](./weekdays-end-375x667-140.png)

Ändrad källa, designutfall och tester ska granskas oberoende innan statusen blir DONE.
