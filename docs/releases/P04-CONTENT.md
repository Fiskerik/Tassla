# Release-log — P04 innehållsutkast
Datum 2026-10-06. Jämförelsebas P03 lokal88b2ed8; samtidiga lokala mellancommit3d25345 (fx) bevarad. Status implementerat, final QA pågår; inte publicerat/pushat av denna körning. TestFlight-build okänd. Ingen GitHub Release som jämförelsebas.
## Major changes
Åtta källbelagda svenska guider/checklistor och tre träningsprogram med nio steg. Versionerade draftidentiteter, granskningsunderlag för sakkunnig, strukturell validator och transaktionsbaserat idempotent SQL-underlag för draftimport.
## Minor changes
Redaktionellt åldersurval 8–12/13–16/17–26/27–52 med generiska appguider som yngre/äldre fallback och individuella program från vecka8. Tolv verkliga organisations-/repositorykällor. Explicit body/step-claimmapping och tydlig gräns mellan strukturell och mänsklig sakgranskning.
## Bug-fixes
Utvecklingsbrister före leverans rättade: generiska åldersfönster saknade konkret fas/fallback; expertcaveater fanns delvis bara i metadata; valpspråk användes trots äldre fallback; SQL/parity skyddar nu faktisk kanonisk text/källor. Validator avvisar tomma/ogiltiga body- och stegreferenser. Inget påstående om buggar i äldre publicerad release.
## Verifiering och begränsningar
Exakt v5 Architect APPROVE/Critic PROCEED, renewed Reviewer PASS/statisk Security PASS. Draftvalidator11items/11versions/9steps/12sources; publication-check avvisar pending review som avsett. SQLparity144literals/syntax/diff PASS från implementer. QA före v5: fokuserat44/44, pnpmcheck204/204 och iOSexportPASS. Final v5 QA dokumenteras efter faktisk körning. Sakkunnigförgranskning utförd med korrigeringar; mänsklig sakgranskning och publicering återstår. SQL endast förberett, aldrig körd serverimport/RLS. Inget nytt nativeflöde i detta paket.
## Nästa paket
P05 relevanta guider på Hem/Kunskap, samma publicerade version/källor och nästa sparade träningssteg. UI-checkpunkt med bilder/ikoner/textetiketter, loading/error/retry, before-homecoming exkluderat från åldersfeed. Plan v2 redan reviewad; implementation först efter P04 beständig checkpoint.

Final v5 QA: fokuserat51/51, pnpmcheck211/211, diffcheckPASS. Tidigare iOSexportPASS gäller oförändrad nativesource. Lokalt verifierat paket, mänskligreview och serverimport fortfarande ej klara. Leveranscommit sparas i rapport/checkpoint; ingen automatisk GitHub Release.
