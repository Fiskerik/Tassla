# UI-COPY-CLEANUP — bort med tillfälliga etiketter

Datum: 2026-10-24. Bas: `69251d2`. Branch: `2026-10-24-ui-copy-cleanup`.

Ägarbeställning: ta bort synliga Test/Preview/granskningsrutor som tar plats. FAQ-texter och övrigt faktiskt innehåll kan vara kvar. Senare beställning ersätter UI04:s tidigare krav på synliga granskningsmarkeringar och Standardbild-badges. Bildproveniens och syntetisk fixturekontext finns kvar i dokumentation/metadata, inga personliga bildanspråk införs.

Risk L: presentation/copy, inga callbacks/data-/publiceringsändringar. Skills: tassla-consumer-ux, mobile-ios-design; målbild vision_rev02 och designregler §14.

## Steg och skrivytor

1. Implementer tar bort banner/status/badge och tomma wrappers/styles i HomeScreen, DevelopmentScreen, DailyProgressScreen, DevelopmentPreview, PublishedTrainingScreen, TrainingScreen, KnowledgeScreen, FAQScreen och PuppyChecklistScreen. Checklisteinfo som bara säger att texten granskas tas bort inklusive dess oanvända toggle. FAQ/råd, formulär, faktiska fel/sparstatus och public/review-flaggor ändras inte.
2. Copy-only i AuthCallbackView:s preview-branch, LogScreen:s delete-beskrivning, PassportScreen:s otillgängliga/vanliga dokumentförhandsvisning och DevelopmentPreview:s tekniska menybeskrivningar. Inga auth-/PDF-/deletehandlers ändras. DraftContentPreview:s dubblerade interna introduktion tas bort, men faktisk Utkast/ej sakgranskad-säkerhetsinformation på den dedikerade redaktörsvyn och AI-/samtyckes-/betal-/betainformation består.
3. Visual-check app.tsx, ui-r02-04-app.tsx och vision-r02-home-panels-app.tsx visar samma rena UI utan artificiella toppremsor. Syntetiska data dokumenteras i verifieringsresultat; intern separat workspace-trace-verktygsvy ändras inte. Uppdatera berörda befintliga tester/verifierare för frånvaro av markeringar och bibehållen innehållsgrind; inga tester tas bort/inaktiveras.
4. Befintliga modul-README och docs/design-rules.md/HOME-spec får daterad hänvisning till ägarens nya presentationsbeslut. Uppdatera actionplan/rapport/HISTORY och queue med exakt status. Äldre UI04-bevis skrivs inte över; nytt avgränsat bevis under docs/design/evidence/vision-rev02/ui-copy-cleanup-2026-10-24/.

Skyddat: ProductWorkspace/navigation/auth handlers, service/data/schema/RLS/RPC, lagring, flags, FAQ-/guide-/träningsråd/källor, privacy-/samtyckes-/reklamupplysningar, fel och sanningsenlig mutationsstatus. Ingen ny dependency, migration, publicering eller distribution.

## Acceptans och verifiering

Rev02 har innehåll framför tekniska etiketter. Före: banners/pills på flera vyer, Standardbild-badges över foto, två review-infoytor i Kunskap. Efter: borttagna element lämnar ingen reserverad höjd, foto/copy/form flyter ihop naturligt med oförändrade mål/returer.

Färsk sökning och render visar inga synliga Granskningsdata/Granskningsinnehåll/Testläge/Preview/Standardbild eller gransknings-Läs mer-rutor på berörda användarvyer. FAQ och guide/checklist-/träningsinnehåll finns kvar; publika tomlägen/review-grindar oförändrade. Faktisk fel-/spar-/inloggnings-/PDF-status består. Header, menyn och primärhandlingar nåbara på 375×667/844, 430×844 och 140% text. Bilder förblir dekorativa/generiska med oförändrad proveniens; ingen text påstår att bilden visar användarens hund.

Kör relevant UI-/copy-/grindkontroll, pnpm check och offentlig iOS-export enligt tidigare testmandat och obligatoriska hooks. Ta färska före/efter-relevanta skärmbilder, fyll §14 för denna slice och gör oberoende QA/Reviewer. Architect och Critic granskar denna korta plan före edit. Native/live/fullpanelgrindar från huvud-GAP-planen återöppnas inte.

Planreview: Architect APPROVE och UX Critic PROCEED. Exakta skrivfiler är nu låsta i kön enligt inventeringen; inga nya produktbeslut behövdes. Kritikens krav att även ta bort `Hem. Granskningsdata.` från hjälpmedelsnamnet ingår.


## Resultat

Implementerad ren presentationsstädning. Fullcheck77/77, publiciosExport1585/contentguardPASS; huvud/stöd14/14perläge, paneler5/5perläge, UI04renhetsprov5/5perläge, interaktion18/19. Oberoende QA PASS, Reviewer PASS, Security APPROVE. FAQ och publiceringsgrindar bevarade; ingen callback/dataändring. Färsk evidens och §14 i `docs/design/evidence/vision-rev02/ui-copy-cleanup-2026-10-24/VERIFICATION.md`.

Ägarens efterföljande planbeställning besvaras i `docs/plans/UI-UX-ANVANDARPLAN-2026-10-24.md`, med Product/UX-underlag och Critic PROCEED WITH CHANGES; enda korrigeringen D1→paket2 är införd. Nästa featurepaket har inte implementerats i detta städjobb.
