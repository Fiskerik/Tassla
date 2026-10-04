# Checkpoint: sex MVP-skärmar

Datum: 2026-10-04. Källa: Erik anger övre delen ”MVP – 6 skärmar” i vision_rev01.jpg som utgångspunkt för MVP-leveransen. Nedre ”Om tre år” ingår inte.

## Utfört
- Bilden läst, jämförd med tidigare docs/mvp.md. Tidigare undantag för Hälsa och Tassla-pass ersatta av avgränsade krav. Promenad tillagd i loggen; Kunskap egen vy. Onboarding/QR/mätning kvar som stöd.
- Visuell referens kopplad i docs/dev/ui-and-code-standards.md; förra meddelandets design-, kod- och städregler infogade i AGENTS.md, arbetsflöde, mall och Dev-roller. Nio rollfiler kunde parsas som TOML. Ingen appkod eller API-körning.
- Stackförslag markerat för ny konsekvensgranskning. Utvecklingsordning kopplad till sex leveransytor.

## Product-review
Read-only mvp_six_product: IN MVP. Föreslog sex avgränsade områden, ägarregistrerade hälsodata, litet kunskapsurval och manuellt initierad PDF utan fjärråtkomst. Bildens texter/flikar är inte automatiska krav. Dog Expert, Compliance och Security behövs före relevant innehåll/dataimplementation.

## Critic-review
Read-only mvp_six_critic: PROCEED WITH CHANGES. Tre invändningar och hantering:
1. Bildens medicin/allergier/länkknapp skapar bredare passförväntningar: textens acceptanskriterier styr, exporturval öppet, inga automatiska extra funktioner. Före leverans granska syntetisk PDF med användare.
2. Påminnelser kan uppfattas som vårdschema: datum märks ägarangivna; inga härledda kliniska intervall. Testa förståelsen före pilot.
3. Pushkonflikt: behåll uttryckligt öppet beslut och skilj datum i appen från extern notifiering. Hälsokriterier hänvisar dit.

## Öppet och nästa steg
Exakt PDF-urval, 2–3 träningsprogram, innehållsurval och notifieringskanal behöver beslutas före berörda implementationer. Tidigare Discovery-/stackgodkännanden saknas fortfarande; detta är scope- och målreferensuppdatering, inte godkännande att samla persondata, publicera innehåll eller släppa appen.

Nästa steg: konsekvensgranska stackförslaget och planera första avgränsade användarflödet mot uppdaterad MVP. Spara verkliga specialistbedömningar och Erik-mandat enligt docs/dev/workflow.md innan appkod.
