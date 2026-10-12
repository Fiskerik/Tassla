# Kunskap

`KnowledgeScreen.tsx` har fyra flikar: För dig, Artiklar, Checklistor och FAQ. Publicerade guider kommer från arbetsytans ålders-/rasurval i Supabase. Hem och Kunskap delar samma version-ID, innehåll och källista. Loading, fel med retry och tomt publicerat urval skiljs åt; guideflikarnas tillstånd visas inte ovanpå checklistor/FAQ. En guide visas i en separat läsvy. Artiklar som öppnas från Hem-karusellen bär ett explicit `home-carousel`-ursprung och går direkt hem via läsvyns interna Tillbaka; guider öppnade från Kunskapslistan går tillbaka till listan. Fokusintenten är bunden till `focusScopeKey`, och lokalt artikelval rensas när hund-/kontoscope eller parentens fokus ändras. `guide-body.ts` tolkar rubriker, enkla listor och stycken till native text; rå HTML renderas inte. `source-links.ts` tillåter endast syntaktiskt giltiga HTTPS-länkar utan användaruppgifter, som öppnas efter användartryck med felåterkoppling.

## Checklistor och FAQ

`PuppyChecklistScreen.tsx` visar översikt och detalj för sex faser, standardpunkter, egna punkter, antal/procent och framstegsindikator. Före hemkomst/första dagarna är uttryckliga kontextval; annars föreslås fas utifrån hundens ålder. Alla faser går att läsa. Översikten har Kunskaps sidhuvud; detaljen har ett eget Back-sidhuvud. `FAQScreen.tsx` visar expanderbara frågor med bläddringsbar kontext, utan nätbaserad frågetjänst.

`checklist-content.ts` har versionsmärkta katalognycklar. `checklist-model.ts` validerar kontext och egna titlar om högst160 Unicode-tecken. `checklist-data.ts` använder ägarens Supabase-klient för bockar, egna punkter och kontext per hund. Översikten hämtar inga fritexttitlar. Nya tabeller och smala ägarbehörigheter finns i `202610110002_puppy_checklists.sql`; migreringen och den syntetiska tvåägarproben måste verifieras i rätt utvecklingsdatabas före liveanvändning.

Ingen optimistisk grön sparstatus används. UUID, exakta återläsningar och villkorade ändringar skyddar mot dubletter/konflikter. `checklist-intent.ts` klassificerar saved/retry/conflict; okänt resultat kräver Kontrollera. Vid sidbyte fryses avsikt/form till ett flyktigt ref i ProductWorkspace, avgränsat till session/kontogeneration/hund. Scopebyte rensar gamla avsikter. Detta minne är inte permanent lokal lagring eller en offlinesynkkö.

## Tillfälligt granskningsinnehåll

`review-content.ts` innehåller syntetiska FAQ och tre träningsprogram med motsvarande guider. Endast `EXPO_PUBLIC_TASSLA_REVIEW_CONTENT=true` visar detta i utvecklings-/TestFlight-byggen, oberoende av `__DEV__`. Berörda vyer märks Tillfälligt exempel – innehållet är inte sakgranskat. False döljer katalogen och utför inga checklistläsningar. Hem använder samma checklist-/FAQ-destinations-ID:n som Kunskap. Verkliga innehållsfel ersätts inte med falsk lyckad läsning. Träningsutkast har separat lokal progression; se Tränings README och `docs/dev/review-content-builds.md`.

`DraftContentPreview.tsx` är fortfarande en separat kanonisk draft-granskningsvy som kräver både `__DEV__` och `EXPO_PUBLIC_TASSLA_DRAFT_PREVIEW=true`. Den ersätter inte detta signerade granskningsläge. Dekorativa innehållsbilder är inte hundens profilfoto. Råden kräver mänsklig sakgranskning inför publik release.

## Verifiering

Kör `pnpm check` för typkontroll, lint och API-/intent-/innehållstester. `tools/visual-check/know02-app.tsx` och `verify-know02.py` provar de aktuella skärmarna med syntetisk adapter, CRUD, okända resultat, remount/scope, båda backvägarna och stor text; evidens och begränsningar finns i `docs/design/KNOW-02/checklista.md` och `docs/design/CAROUSEL-BACK-01/checklista.md`. Native presentation, VoiceOver/riktig Dynamic Type samt verklig SQL/RLS är separata verifieringar.
