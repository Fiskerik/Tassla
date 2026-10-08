# Release-log – FIGMA-DS-01

Datum: 2026-10-07  
Paket-ID: FIGMA-DS-01  
Status: Pågår – QA UNDERKÄND; ej leveransklart  
Jämförelsebas: Figma-filens befintliga tillstånd före paketet; exakt Figma-version saknas. GitHub Release saknas; dokumentbas är repositoryns aktuella HEAD vid start.  
Leveranscommit: Okänd  
TestFlight-version/build: Ej tillämpligt – endast Figma-designsystem.

## Major changes

Implementerat i Figma på sidan `Design system`: 6 variabelcollections med 98 variabler, 5 textstilar och variantset för Button, AppBar, Tabs, BottomNav, ListRow, Card, HeroCard, QuickLogTile, ChecklistItem, Progress, Toast och kategori-IconChip. En separat review-yta med instanser har skapats. Inga appskärmar har byggts.

## Minor changes

Komponentbeskrivningar, svensk exempelcopy, exponerade nested properties för Tabs/BottomNav och representativa tillstånd för default, pressed, disabled, loading, checked, progress och toast har lagts till.

## Bug-fixes

Utvecklingsfel rättade före leverans: obundna transparenta behållarfills i ikon-, navigations-, progress- och ListRow-komponenter. Den sista ListRow-rättningen kunde inte återverifieras efter att Figmas anropsgräns nåddes och är därför inte ett verifierat PASS.

## Verifiering och kända begränsningar

Utfört: inventering av Figma-fil och bibliotek, arkitekt APPROVE plan v3, strukturell audit och renderad skärmdump. Foundations-auditen var PASS. Komponentauditen bekräftade förväntade variantantal och tryckstorlekar före den sista sexnodersrättningen.

Separat visuell QA gav UNDERKÄND: fyrfliks-Tabs klipper `Vikt`, Toast-handlingen är för låg, Error/Neutral-Toast har missvisande copy och Walk-ikonen är otydlig. QA rapporterade även utstickande Checklist/Toast-exempel; review-bredden ändrades efter den observationen men har inte återgranskats. Figmas Starter-gräns blockerar nya pluginanrop och webbläsarreservvägen kräver inloggning. Paketet är därför inte färdigt, inte reviewer-godkänt och inte visuellt PASS.

Kända begränsningar: endast ljust tema; Inter är Figma-proxy för native systemfont; ingen appkod, riktig data, publicering eller TestFlight ingår.

## Nästa sprint/paket

Återuppta FIGMA-DS-01 när Figma-pluginens anropsåtkomst finns: rätta QA:s fem punkter, kör strukturell audit, ta ny skärmdump, kör oberoende QA och därefter reviewer. Skärmbygge är uttryckligen utanför detta paket.
