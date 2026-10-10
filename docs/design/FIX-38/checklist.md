# FIX-38 Toast — visuell och tillgänglighetschecklista

Datum: 2026-10-10. Roll: visuell QA/Reviewer (separat från Implementer). Baslinje: Toast i UI-08; där saknas renderade QA-bilder på grund av nekad localhost-bindning och Chromium-krasch (`setsockopt: Operation not permitted`). FIX-38 ändrar inte Toastens visuella stil eller svenska copy.

## Renderad evidens

Skärmbilder för liten/stor mobilbredd och stor text finns inte. iOS-bundle-exporten bekräftar att appen byggs men visar inte skärmtillstånd. Enligt designpolicyn är visuell bedömning därför **NOT TESTABLE**, inte GODKÄND. Skärmbildskatalogen finns redo här för framtida rendering.

| Tillstånd/kontroll | Resultat | Evidens/orsak |
|---|---|---|
| Bekräftad sparning och eventuell Ångra | NOT TESTABLE visuellt | Ingen renderad skärmbild/baslinje. Källkodskontrakt oförändrat; kört UI-policytest. |
| Fel med Försök igen/Avbryt | NOT TESTABLE visuellt | Ingen renderad skärmbild/baslinje. Källkodskontrakt oförändrat. |
| Osäkert sparresultat med Försök igen | NOT TESTABLE visuellt | Ingen renderad skärmbild/baslinje. Källkodskontrakt oförändrat. |
| Utgående toast och innehållsretention | NOT TESTABLE visuellt | Animation har verifierats endast genom källkod/test; ingen runtimebild. |
| Liten och stor mobilbredd, stor text | NOT TESTABLE | RN Web-rendering/skärmbildsmiljö saknas; ingen native rendering. |
| Skärmläsaretikett och dold utgående toast | NOT TESTABLE på enhet | Attributen finns kvar i källan; faktisk VoiceOver/TalkBack-avläsning ej körd. |
| Dynamisk text och reducerad rörelse | NOT TESTABLE på enhet | Källkodskontrakt och reducerad-rörelse-flöde kontrollerat; native runtime saknas. |
| UI-designregler §14 | NOT TESTABLE visuellt | Punkten om layout/komponenter, textstorlek/touch och tillstånd kan inte bedömas utan skärmbilder; övriga punkter är inte relevanta för Toast-fristående komponent eller utseendet ändrades inte. |

## Källa och beteendekontroller

`pnpm check` passerar (395 pass, 1 skip); iOS-export passerar. `tests/motion-policy.test.mjs` kontrollerar exit-/tillgänglighetskontraktet på källkodsnivå. Dessa kontroller ersätter inte renderad eller fysisk enhetsverifiering.
