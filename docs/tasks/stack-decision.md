# Stackbeslut för Tasslas MVP

Status: kravinsamling pågår. Ingen stack vald och ingen appimplementation påbörjad.
En deluppgift åt gången; högst två oberoende deluppgifter samtidigt.

| ID | Deluppgift | Ansvar | Beroenden | Leverans | Acceptans och verifiering | Status |
|---|---|---|---|---|---|---|
| 01 | Klargör ägarens förutsättningar och tekniska krav | Huvudsession + Erik | Inga | Kravbild i denna fil | Kompetens, resurser, plattformar, offline, innehåll och delad användning besvarade | Pågår |
| 02 | Jämför två–tre realistiska stackar | AI Tech Lead | 01 | Källbelagd jämförelse och rekommendation | Officiella aktuella källor; konsekvenser för konkret MVP, drift och underhåll | Ej startad |
| 03 | Granska rekommendationens antaganden | Critic | 02 | Invändningar och eventuella valideringsbehov | Kritiska oklarheter åtgärdade eller synliga för ägaren | Ej startad |
| 04 | Dokumentera stackförslag för ägarens beslut | Huvudsession + Erik | 03 | docs/decisions/0001-stack.md | Alternativ, konsekvenser, öppna frågor och tydlig godkännandestatus | Ej startad |

## Checkpoint 01 – läst underlag
- Hela docs/vision.md, docs/mvp.md och docs/revenue.md lästa.
- MVP-underlaget anger hundprofil/onboarding, personligt Home, snabb loggning/tidslinje, träningsflöden och uppfödar-QR. Påminnelser och grundläggande hälsodata behöver preciseras.
- Partnerintegrationer, betalningar, avancerad AI och externa aktörers profildelning är inte beroenden för MVP-release.
- Teknikbeslut saknas; bara beslutsmallen finns i docs/decisions/.
- Ägarens programmeringsvana, tids-/kostnadsramar, lanseringsplattformar, offlinekrav, redaktionellt arbetsflöde och samtidig familjeanvändning är inte fastställda i underlaget.
- Underlagets godkännandestatus är inte bekräftad. revenue.md är uttryckligen ett ogranskat utkast.
- Verifiering: dokumentinventering och läsning; inga tester, installationer eller API-anrop.
- Nästa steg: samla ägarens svar, uppdatera denna kravbild och överlämna avgränsad jämförelse till AI Tech Lead. Återuppta här, inte från hela chatthistoriken.

## Checkpoint 01 – ägarens svar 2026-10-03
- Ensam utvecklare med AI på fritiden, gärna avgränsat kvällsarbete. Exakt veckotid och pilotdatum ej angivet.
- God kodförståelse men ingen regelbunden programmering på cirka 20 år. Förstår Python/Java/HTML/CSS; tidigare enkla iOS-appar med Codex och erfarenhet av Next.js, Expo och Codemagic. Tidigare ramverk är inte ett krav.
- Låg initial budget: Codex-abonnemang och cirka 20 USD OpenAI-krediter (kan ökas). Separat drifts-/byggbudget ännu okänd.
- iOS först. Apple-distributionskonto och TestFlight finns. Tillgång till Mac är ännu okänd.
- Offlinekrav ännu öppna; föreslå ett praktiskt minimum. Ägaren anger push senare, medan nuvarande MVP-dokument kräver notifieringsmotor. Fråga är ställd; ändra inte MVP tyst.
- Innehåll ska på sikt redigeras utan kodvana. AI kan skriva utkast, senare copywriter. Domän-/säkerhetsgranskning behövs separat från språkgranskning.
- En person och en hund i pilot. Datamodell ska tillåta flera personer per hund och flera hundar per person senare, utan att bygga delningsfunktioner nu.
- Nästa steg: källbelagd preliminär jämförelse. Stackval och MVP-scope är ännu inte godkända. Inga paket eller appkod skapas.

## Checkpoint 02–04 – förslag och kritik
- Tech Lead jämförde Expo/TypeScript, SwiftUI/Swift och Flutter/Dart och rekommenderade Expo villkorat med Supabase. Aktuella officiella källor kontrollerade; inga prototyp- eller prestandatester.
- Critic: PROCEED WITH CHANGES som förslag, inte byggtillstånd. Offline är ett obekräftat merarbete; CMS-mellanläget måste ha tydlig ansvarig publicerare; scope/budget behöver bekräftas.
- Förslaget uppdaterat: offline och Sanity är villkorade, internetberoende pilot är alternativ och Erik är föreslagen publicerare innan CMS finns. Ingen ny appfunktion är accepterad.
- Beslutsförslag sparat i docs/decisions/0001-stack.md, status förslag.
- Nästa steg: svar om Mac, bygg-/driftsbudget, push-scope, offline-minimum och tidpunkt för redaktörsyta; därefter uppdatera förslaget och be om konkret acceptans. Ingen installation eller appkod innan godkännandet.

## Checkpoint – byggtjänst 2026-10-04
Ägaren föredrar Codemagic framför EAS Build/Submit. Stackförslaget uppdaterat: Expo/React Native + Expo prebuild → Codemagic/macOS/Xcode → signering → App Store Connect/TestFlight. Ingen pipeline konfigurerad eller tjänst aktiverad; övriga öppna beslut kvarstår.
