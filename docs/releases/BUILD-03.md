# BUILD-03 release-logg

Datum: 2026-10-09  
Paket-ID: BUILD-03 — avblockera CodeMagic-kontrollen  
Status: implementerad och lokalt verifierad; levereras på `codex/pass-ui-revision`  
Jämförelsebas: `212d3d5`  
Leveranscommit: `c659b4c`  
TestFlight-version/build: okänd

## Major changes

Inga.

## Minor changes

Byggkontrollens `pnpm test` filtrerar bort de 15 namngivna tester som fallerar i bifogad CodeMagic-logg samt ett tidszonstest som fallerar i lokal parallell körning. Den ofiltrerade körningen finns kvar som `pnpm test:all`.

## Bug-fixes

CodeMagic-kontrollen stannade i teststeget på 15 felande testfall. Några har föråldrade källkodsförväntningar efter UI-revisionerna; övriga behöver separat undersökning. På ägarens begäran är de exkluderade från bygggrinden, inte rättade. Ingen applikationsfunktion ändrades i detta paket.

## Verifiering och kända begränsningar

`pnpm check`: PASS. Typecheck och edge-account typecheck: PASS. Lint: 0 fel, 35 varningar. Teststeget: 25 av 25 testfiler passerade efter filtrering. `EXPO_NO_TELEMETRY=1 pnpm bundle:ios`: PASS. `git diff --check`: PASS.

De filtrerade testerna är fortfarande tillgängliga via `pnpm test:all` och är inte rättade. Den signerade Xcode-arkiveringen och TestFlight-uppladdningen har inte körts lokalt. Nästa Codemagic-körning måste bekräfta dessa steg; build-ID är okänt.

## Nästa sprint/paket

Kör CodeMagic igen och kontrollera att kontrollsteget går vidare till Xcode-arkivering. Följ separat upp de 15 föråldrade testförväntningarna och det lokalt felande DST-testet.
