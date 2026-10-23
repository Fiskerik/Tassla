# FLOW-TRAINING-01 — lokal visuell och funktionell verifiering

- **Datum:** 2026-10-22
- **Målbild:** panel 6 i [`vision_rev02.jpg`](../../../../vision_rev02.jpg) och [skärmkontraktet](../../../vision-rev02-screen-contracts.md#panel-6--träning).
- **Viewports:** 375×844, 430×844 och 375×667; separat 140 % webbläsarzoom som layoutproxy.
- **Fixture:** syntetiska, uttryckligt märkta review-data samt separat public-läge utan reviewinnehåll. Ingen konto- eller live-backenddata.
- **Resultat:** React Native Web **13/13 PASS** public och **13/13 PASS** review. Ingen browser runtime error eller horisontell overflow i 140 %-provet.
- **Bilder:** [standardvy 375](public/default-375x844.png), [lång titel 375](review/long-title-recommendation-375x844.png), [pausad version](review/paused-previous-version-375x844.png), [otillgänglig version](review/paused-unavailable-version-375x844.png), [fullständig progress](review/completed-program-under-mine-375x844.png).

## §14 — visuell och funktionell checklista

1. **Ja.** Rekommendationskort, Visa alla och Fortsätt där ni var ger var sin tydlig nästa väg utan extra primärknapp.
2. **Ja.** Två rekommendationer använder samma 4:3-kortformat. En ensam matchande träning dubblas inte.
3. **Ej tillämpligt.** Skärmen har ingen radering.
4. **Ej tillämpligt.** Checklistrader på Hem ändrades inte i detta delarbete.
5. **Ja.** Tre innehållsvyer ligger kvar i scrollflödet ovanför huvudmenyn; kort vy 375×667 går att skrolla.
6. **Ja.** Skärmens färg, typografi, mellanrum och former använder projektets tokens och befintliga kort-/knappkomponenter.
7. **Ja.** Skärmen introducerar inga nya ikoner eller symbolfamiljer.
8. **Delvis.** Varm canvas, neutrala kort, gröna aktiva flikar/progress och foton följer panelens färgroller. Numeriskt kontrastförhållande för varje native state är inte mätt.
9. **Ja.** Kort öppnar den namngivna nästa övningen. Generiska foton märks `Standardbild`; titel, progress och färdigstatus hör till rätt publicerad version.
10. **Ja.** Progress byggs från bekräftade steg-ID:n för exakt programversion; avslutade program erbjuder inte en fortsättningshandling.
11. **Ja.** Ingen påhittad gratulation eller slutsats visas. Review-fixturens varning märker enbart syntetiskt innehåll.
12. **Ja.** Svensk UI-copy använder vardagliga namn; interna versions-ID:n visas inte.
13. **Ja.** Programtitel och övning står före instruktion; källor och status är sekundära. Långa titlar får växa till fler rader utan ellips.
14. **Ja.** Public/review-render täcker rekommendation, okänd ålder, saknad matchning, pausad/otillgänglig progress, tomt, retry, slutfört program, kort viewport och lång titel.
15. **Ej fullständigt testbart.** Browserkontrollen testar 140 % zoom, inte native Dynamic Type eller VoiceOver på iOS. Native träffytor/tillgänglighetsordning behöver fortfarande verifieras i iOS.
16. **Ja för lokal render.** Sida-vid-sida-granskning mot panel 6 visar vänstertitel, tre vyer, åldersmatchad rubrik, två fotokort och liggande fortsättkort. Faktiska ämnes-/tidsbrickor visas inte eftersom innehållsmodellen saknar verifierad metadata.
17. **Ja.** Aktiv Träning-flik, intern tabmarkering och huvudnavigation visas korrekt. Väljning av rekommendation öppnar dess exakta nästa steg.
18. **Ja.** Hundens namn används där det finns stöd i den fortsatta övningen; generiska kortbilder presenteras inte som hundens egen bild.

## Avgränsning

- Datakontrakt och versionsurval täcks av enhetstester. Verkliga publicerade poster, Supabase/RLS, migration i aktiv miljö och ägarisolering är inte verifierade här.
- Public iOS-export passerade efter den senaste kodändringen: 1 579 JS-moduler och 59 assets. Det är en lokal JS-bundleexport, inte en signerad IPA eller TestFlight-build.
- Oberoende QA och Reviewer har granskat de korrigerade vyerna och godkänt dem. Den här verifieringen gör inte Träning produktionsverifierad.
