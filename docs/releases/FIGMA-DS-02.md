# Release-log – FIGMA-DS-02

Datum: 2026-10-08. Paket-ID: FIGMA-DS-02.
Status: **IMPLEMENTERAD OCH SLUTAUDITERAD; separat QA pågår**.
Jämförelsebas: repository-HEAD vid start `3eb9618030b46d5b1709418800e37f63976188b9`; Figma-version okänd. Ingen GitHub Release används som bas.
Leveranscommit: ingen skapad. Push/publicering: inte utfört.
TestFlight-version/build: ej tillämpligt, endast Figma/designunderlag.
Plan: [FIGMA-DS-02 v1](../plans/FIGMA-DS-02.md).

## Major changes

Designsystemet är genomfört i Figma: befintliga kärnfamiljer är rättade, saknade familjer tillagda, Foundations och instansbaserad Review byggda samt en separat 390-pt Sandbox TEST-sida skapad. Ingen appkod eller produktionsskärm har ändrats.

## Minor changes

Före implementation sparades plan v1/checkpoint, taskkontrakt, RULES_PROPOSAL och kontrastunderlag för 15 dokumenterade färgpar. Primärfärg #186A4D matchar INVENTORY och DS-01 och behölls.

Implementerat i Figma efter planuppgraderingen: AppBar utökad till Home/Back/Close × Action On/Off, samtliga 336×56. Back/Close har centrerad titel och balanserade 44-punkts stödytor; Home behåller Tassla-varumärket. Chevron, Close och klocka använder color/textPrimary; bakgrunden använder color/background utan kant. Ny tokenbunden Icon/Close tillagd. En riktad rättning tog bort felaktig fill på Close-ikonens SVG-ram. AppBar är renderad i riktiga 360/430-instanser; titelcentrum matchar instanscentrum exakt.

Tabs/TabItem är rättade: Active Bold + primary + etikettbrett understreck, Inactive Regular + textSecondary, 12 px horisontell padding, höjd 44 och 8 px gap. Fyrfliksvarianten har klippt horisontell viewport; renderad evidens visar scrollbehov vid 360 och alla etiketter vid 430. Slutlig samlad QA återstår.

Tabs har även fått en tunn semantisk bottenlinje, svag högerkant för scrollaffordance och en komponentbeskrivning av fyrfliksbeteendet. Primitiven `border` heter nu `border-200`; `Color/border` aliaserar fortsatt samma variabel.

ListRow är ombyggd till 336×72 med IconChip, två textrader, separat valfri Time-property, chevron och Complete-bock. Renderad evidens med Mat, Promenad och Vaccination visar rätt kategoriikon/färg, tom valfri tid och inga överlapp.

Card är fullbreddsrättad till 336 px med auto layout, innehållsstyrd höjd, 16 px padding, 8 px gap och radius.lg. Default/Pressed använder Color/border och Selected Color/primary; en felaktig primitiv border-bindning upptäcktes i returdata och rättades före renderad checkpoint.

ChecklistItem är fullbreddsrättad med sex Checked/State-varianter, 44 px minsta höjd och tydligt Disabled-tillstånd. `Color/borderStrong` har lagts till för betydelsebärande okryssade kontrollkanter. Icon/Check använder nu Color/onPrimary, och renderad evidens visar vit bock i samtliga Checked-varianter.

Toast har nio Tone/Action-varianter inklusive Retry, fullbreddslayout, 16/12 px padding, semantiska tonramar och 44 px åtgärdsyta. QuickLogTile är 112 px hög med Large IconChip, 12 px padding och 2×2-exempel för Kiss/Bajs/Mat/Sömn. Båda familjerna är renderade i 360 och 430.

Button är omordnad i ett överlappsfritt 5×4-grid; Loading visar endast spinner, secondary/icon använder borderStrong och icon-knappen har ellipsis-horizontal. HeroCard har varm tassgradient, mörk textoverlay och tydlig Pressed. Progress använder 0/40/60/100 med kontinuerlig fill. Typography har fått Type/Display 28/36 Bold. Alla fyra områden har renderats i 360 och 430.

Field, CheckboxCard, Dialog, BottomSheet, EmptyState, SectionHeader och StatusBadge har tillkommit. [Foundations](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=61-1725), [Review](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=63-1722) och [Sandbox](https://www.figma.com/design/2UI5GtK3JjZH3ncCS9M35c/Untitled?node-id=64-2032) är renderade; Review innehåller 81 komponentinstanser. Separat slut-QA sparas i [FIGMA-DS-02-QA](../design/FIGMA-DS-02-QA.md).

## Bug-fixes

DS-01:s Tabs-klippning, Toast-copy/tryckyta, Walk-mappning och Review-överflöde är rättade eller ersatta med ny instansbaserad evidens. Slutauditen upptäckte och rättade saknade QuickLogTile Pressed/Disabled samt explicit `borderStrong`-bindning för okryssad ChecklistItem. Renderad StatusBadge-klippning rättades till 28 px höjd.

## Verifiering och kända begränsningar

Underlag läst och befintlig MVP-målbild visuellt inspekterad. Dokumenterade opaka tokenpar beräknade med WCAG:s relativa luminans: textPrimary/background 12,45:1; textSecondary/background 5,75:1; onPrimary/primary 6,55:1; danger/dangerSurface 6,15:1; success/successSurface 5,78:1; kategorier 4,97–6,15:1. Alla 15 dokumenterade par når 4,5:1. Detta verifierar inte Figma-bindningar eller aktuell fil.

`Color/borderStrong` ger 6,46:1 mot surface och används på betydelsebärande kontrollkanter. Familjerna är renderade i 360/430, Sandbox i 390 och Hero-gradienten med 72–90 % bottenscrim. Slutaudit och riktad återverifiering är genomförda.

Den initiala Starter-planblockeraren löstes när Figma-planen uppgraderades. Därefter användes endast Figma-MCP mot målfilen; inget kringgående, ingen webbläsarreservväg och inga inloggningsuppgifter användes.

Lokal repositorykontroll: `pnpm check` exit 0, 356 tester varav 355 pass och 1 skip, inga testfel; befintliga lint-/Node-varningar. Miljöns pnpm-wrapper installerade befintliga låsta dependencies inför check; inga dependencies eller låsfil ändrades. `git diff --check` samt nya dokuments lokala länkar, radslut och whitespace kontrollerade. Dessa kontroller bevisar inte Figma-layout, nativebeteende eller ångra/retry-funktion.

Beställda docs/DESIGN_RULES.md, docs/design/malbild.png och docs/plans/FIGMA-DS-01.md saknas. Befintliga design-rules.md, vision_rev01.jpg och docs/tasks/dev/figma-design-system-01.md används enligt planens dokumenterade avvikelse. Alla antaganden/återstående steg finns i planen. Bindande policy och appkod är oförändrade.

## Nästa sprint/paket

Invänta separat read-only QA och använd högst den återstående korrigeringsomgången om QA hittar ett verifierat blockerande fel. DayStrip/DogCard var uttryckligen budgetberoende och ingår inte i denna leverans. Ingen produktionsskärm, appimplementation eller publicering ingår.
