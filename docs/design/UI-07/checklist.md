# UI-07 – visuell QA och komponentverifiering

Datum: 2026-10-10. Granskad mot UI-07 plan v2 och `docs/design-rules.md` avsnitt 14. Förhandsvisning: produktionsskärmar och delade komponenter i RN Web med syntetisk data.

## Skärmbilder

Varje huvudvy fångades vid 360 px och 430 px samt 140 % text vid 360 px. Footerbilderna visar skärmens nedre läge vid båda bredderna.

| Vy | 360 px | 430 px | 140 % text | Footer nederkant |
|---|---|---|---|---|
| Hem | [360](home-360.png) | [430](home-430.png) | [140 %](home-large-text-140.png) | [360](home-footer-bottom-360.png), [430](home-footer-bottom-430.png) |
| Logg | [360](log-360.png) | [430](log-430.png) | [140 %](log-large-text-140.png) | [360](log-footer-bottom-360.png), [430](log-footer-bottom-430.png) |
| Träning | [360](training-360.png) | [430](training-430.png) | [140 %](training-large-text-140.png) | [360](training-footer-bottom-360.png), [430](training-footer-bottom-430.png) |
| Hälsa | [360](health-360.png) | [430](health-430.png) | [140 %](health-large-text-140.png) | [360](health-footer-bottom-360.png), [430](health-footer-bottom-430.png) |
| Kunskap | [360](knowledge-360.png) | [430](knowledge-430.png) | [140 %](knowledge-large-text-140.png) | [360](knowledge-footer-bottom-360.png), [430](knowledge-footer-bottom-430.png) |
| Mer | [360](more-360.png) | [430](more-430.png) | [140 %](more-large-text-140.png) | [360](more-footer-bottom-360.png), [430](more-footer-bottom-430.png) |

Övriga vyer: [Kunskapsartikel med Tillbaka](back-knowledge-detail.png), [Tassla-pass med Stäng](close-passport.png), riktig [inloggningsvy utan footer vid 360 px](sign-in-loading-360.png), [430 px](sign-in-loading-430.png) och [140 % text](sign-in-loading-large-text-140.png). Inloggningsvyn renderar produktionskomponenten `SignInScreen` med en tillfällig mock för authgränssnittet; ingen footer/tablist monteras.

Bottenmenyn efter v3-paddingfix, 140 % text och respektive aktiv flik: [Hem 360](footer-home-360-large-text-140.png), [Logg 360](footer-log-360-large-text-140.png), [Träning 360](footer-training-360-large-text-140.png), [Hälsa 360](footer-health-360-large-text-140.png), [Mer 360](footer-more-360-large-text-140.png), [Hem 430](footer-home-430-large-text-140.png), [Logg 430](footer-log-430-large-text-140.png), [Träning 430](footer-training-430-large-text-140.png), [Hälsa 430](footer-health-430-large-text-140.png), [Mer 430](footer-more-430-large-text-140.png).

## Kontroller

| Kontroll | Resultat | Evidens / notering |
|---|---|---|
| Tassla-varumärket och sidtiteln ligger centrerade | Ja | Visuell kontroll av alla varianter och DOM-mått: centrerad textkolumn har mittpunkt vid skärmens mitt. Hem behåller lika sidofack. |
| Sidtiteln är AppBar-variantens enda hjälpmedelsrubrik; ordmärket är dekorativt | Ja | Komponentkällan anger titel som header och döljer ordmärket från hjälpmedel i Title/Back/Close. Home-varumärket är header. |
| Back/Close ligger i rätt sidofack med minst 44 pt tryckyta | Ja | [Tillbaka](back-knowledge-detail.png) och [Stäng](close-passport.png); komponentens sidofack är 44 pt. |
| #4 Fem lika breda tabbar, etiketter åtskilda och minst 44×44 pt | **Ja (v3)** | Efter att horisontell tab-padding togs bort visar v3-skärmbilderna **Träning** helt på en rad vid både 360 och 430 px, med varje flik aktiv i tur och ordning: [360-serien](footer-home-360-large-text-140.png), [430-serien](footer-home-430-large-text-140.png). Playwright mätte fem lika stora tryckmål på 72×76 pt vid 360 och 86×76 pt vid 430. Alla etiketter hade en textrad och `scrollWidth/scrollHeight` överskred inte textytan. |
| Etiketter och aktiv markering syns i normalstorlek | Ja | Skärmbilderna visar enhetlig ordning Hem, Logg, Träning, Hälsa, Mer; aktiv ikon/etikett använder grön färg och fet stil. |
| Semantisk selected-state i skärmläsare | NOT TESTABLE | Källan skickar `accessibilityState={{ selected }}`. Den installerade RN Web-renderaren lämnade dock `aria-selected` utanför DOM. Native VoiceOver/TalkBack-state verifierades inte. |
| Alla fem navigationscallbackar går till rätt vy | Ja | Playwright klickade samtliga tabbar och verifierade respektive vy. `Påminnelser` på Hem öppnade Mer. |
| Back och Close callbackar | Ja | Back från öppnad kunskapsartikel gick tillbaka till Kunskap-listan. Stäng i Tassla-pass gick tillbaka till Mer. |
| Footer är fullbredd och lämnar ingen synlig gräddvit remsa under menyn | Ja | 360/430 och footer-nederkantsbilder. DOM-mått visade footer x=0 och bredd lika med viewporten. |
| Sign-in utan footer | Ja | Riktig `SignInScreen` vid 360/430 och 140 % saknar tablist/footer. |
| Fysisk safe-area-inset, inklusive no-footer bottenkant | NOT TESTABLE | RN Web safe-area-shim returnerar inset 0. Skärmbilder verifierar layout med noll-inset; fysisk iPhone-/Android-inset kräver nativeprov eller inset-harness. |
| Native rörelse, reducerad rörelse, tangentbord och VoiceOver | NOT TESTABLE | RN Web visar inte plattformarnas nativebeteende. |

**Resultat: VISUELLT GODKÄND MED BEGRÄNSNINGAR.** V3 tar bort den tidigare olämpliga brytningen av **Träning**; alla fem fliknamn visas fullt och utan överlapp vid 140 % i 360/430-proven. Äldre stora skärmbilder behålls som före-korrigeringsunderlag. Selected-state i hjälpmedels-DOM och fysisk safe-area-inset är NOT TESTABLE i RN Web; dessa begränsningar är dokumenterade ovan.

## Verifieringsbegränsningar

Visuella skärmar byggdes från befintligt `tools/visual-check/app.tsx` med tillfällig RN Web-shim i `/tmp/tassla-ui-tools`; authkomponenten renderades separat med testmock. Browserautomation använde Playwright/Chromium med `--no-sandbox` och nätverksbehörighet i sandboxen. Inga appfiler eller tester ändrades av QA.

- `pnpm check`: PASS, exit 0; 387 tester passerade, 1 hoppades över, 0 misslyckades. Nätverk aktiverades för notification-testets Node `spawnSync`.
- `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`: PASS, iOS-export klar.
- `git diff --check`: PASS.
- `python tools/dev_flow.py validate`: PASS.
