# Release-log — DESIGN-POLICY-01
Datum: 2026-10-07. Status: policy införd; riktad kontroll och oberoende policyreview PASS. Appens ordinarie check FAIL enligt begränsningen nedan. Bas: faktisk lokal commit6cbd5f4. Leveranscommit/build: inte tillämpligt ännu; inga appskärmar eller TestFlightbyggen ändras.
## Major changes
Infört: bindande konkret designpolicy för planering, implementation och granskning av användarytor.
## Minor changes
Infört: policykoppling till nio aktiva agenter och SDK-instruktioner; dokumenterade UX-checkpunkter.
## Bug-fixes
Rättat instruktionernas hänvisning: tidigare saknad docs/DESIGN_RULES.md och fel checklistavsnitt10; nu kanonisk docs/design-rules.md och avsnitt14. Inga appfel eller appskärmar korrigeras i detta paket.
## Verifiering och begränsningar
Originalfilen DESIGN_RULES (1).md och zip-förslaget är lästa. Samtliga originalavsnitt och 18 kontrollpunkter införda med dokumenterade scope-/säkerhets-/tillgänglighetsförtydliganden. Faktisk målbild vision_rev01.jpg inspekterad; den föreslagna PNG-sökvägen saknas. 9 agent-TOML med policyreferenser och 2 SDK-Pythonfiler parsade utan fel; diffcheck PASS. Agentmodeller och verktygsbehörigheter ändras inte. Ordinarie pnpm check körd men FAIL i app-TypeScript eftersom expo-notifications saknas i lokal installation; följdfel i dess callbacks. Ingen ändring i appkod, package.json eller lockfil. Ingen dependency installerad eller version uppgraderad genom policyn; nätverksberoende automatisk installation avbröts. Ingen appdesign eller visuell appverifiering genom policyändringen.
## Nästa sprint/paket
Alla nya eller reviderade UI-taskplaner ska ange användaruppgift, huvudhandling, kompakt information, fördjupning och visuell kontroll. Befintliga vyer kräver separat avgränsad ändring enligt denna policy. Policyändringen ändrar inga data-/innehållsbeslut eller TestFlight-policy.

Slutreview: design_policy_review Reviewer PASS/Critic PROCEED efter korrigering1; endast policy-/instruktionsscope. Ingen appcheck eller visuell appgranskning ges PASS.
