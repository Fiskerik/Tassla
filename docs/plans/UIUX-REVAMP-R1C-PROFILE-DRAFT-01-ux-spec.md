# R1c Hundprofilutkast — UX-spec v4

**Task:** `UIUX-REVAMP-R1C-PROFILE-DRAFT-01`\
**Status:** plan v4 godkänd av Architect/Critic/Security; implementation klar för QA.\
**Mål:** ägaren ska kunna upptäcka och säkert hantera osparade ändringar i profilredigeringen.

## Resa

1. Ägaren öppnar **Mer → Hundprofil → Ändra**. Befintlig profil, rasval, datum, åldersvisning och valfri kennelkoppling visas.
2. Ägaren ändrar ett eller flera värden. Formuläret visar sin befintliga osparade-status. Att återställa alla värden till sparad profil/koppling återställer clean status.
3. Om ägaren trycker tillbaka, väljer en annan huvudflik, sveper bort eller använder Android system-back visas en enda discard-bekräftelse. **Stanna kvar** bevarar värden och route. **Lämna utan att spara** kastar endast lokala fält och utför första begärda routen.
4. Den direkta knappen heter **Avbryt ändringar** när det finns lokala fältändringar att kasta och **Stäng** annars. Parent-ägt profile-pending eller kennel-unknown räknas inte som lokalt dirty. Om kennel-unknown är ensamt visas **Stäng**. Om separat profilinput är dirty visas **Avbryt ändringar**, som bara kastar profilinput och lämnar kennel-intentet kvar. Motsvarande skyddar lokal kennelinput bredvid profile-pending. Knappen är disabled medan en profil- eller kennel-save pågår och sparar aldrig.
5. Profilens okända write-intent tillhör fortsatt `ProductWorkspace` och återfås med befintlig statuskontroll.
6. Vid okänt kennel-write sparar workspace ett taggat intent-objekt med owner id, account generation, dog id, attempted code och operation token i minnet. `attemptedCode` kan vara `null` för ett okänt borttagningsförsök; saknat intent är ett separat tillstånd. Länkningscopy är **Vi kunde inte kontrollera om kennelkopplingen sparades.** Borttagningscopy är **Vi kunde inte kontrollera om kennelkopplingen togs bort.** **Kontrollera kennelkopplingen** läser tillbaka via befintlig källa före ny save. Code-match eller exakt `null`-match bekräftar. Mismatch bevarar intent och visar serverns status som **Kopplad till {namn}** eller **Ingen kennelkoppling**, med **Kontrollera igen** och **Använd aktuell koppling**. Ingen statuskontroll skriver data.
7. Bekräftad kennelkoppling/read state och aktiv write/busy state är också scope-taggade `{ ownerId, accountGeneration, dogId }`; write och intent har operation token. Alla attribution props filtreras synkront före rendering. Om scope inte matchar visas loading/null/not-busy; förra kontots eller hundens värde, message, read state eller busy visas inte ens en render. Stale completion får bara ändra sin egen scope/token och kan inte rensa nyare intent eller busy state.

| Tillstånd | Lämna vy | UI och återhämtning |
| --- | --- | --- |
| In-flight write | Blockerat, inklusive Avbryt ändringar. | Formulär/knapp visar busy. |
| Profil unknown | Låsta profilfält för försöket räknas inte som lokalt dirty; separata dirty kenneländringar skyddas. | Återbesök visar Kontrollera profilen igen. |
| Profil failed | Dirty guard bekräftar. | Draft finns kvar; ägaren väljer retry eller discard. |
| Kennel unknown | Låst parent-intent (link/removal) räknas inte som lokalt dirty; separata dirty profiländringar skyddas. | Länkning visar **Vi kunde inte kontrollera om kennelkopplingen sparades.** Borttagning visar **Vi kunde inte kontrollera om kennelkopplingen togs bort.** Fältet visar försökt kod eller explicit borttagningsstatus och är låst. |
| Kennel readback match | Tillåtet. | Sparat värde visas; intent rensas. Null bekräftar endast ett explicit borttagningsförsök när servern också returnerar null. |
| Kennel readback mismatch | Tillåtet; intent bevaras. | Visa **Kopplad till {namn}** eller **Ingen kennelkoppling** samt **Kontrollera igen** och **Använd aktuell koppling**. |

## Visuell bedömning

Återanvänd nuvarande `ProfileScreenHeader`, profilkort, fält, tillståndskort, Toast/Alert och tokens; introducera ingen ny färg eller komponentfamilj. Bekräftelsen ska vara kort och konsekvent med R1b:s **Osparade ändringar**-dialog. Riktig editorreferens saknas i rev02; skärmbilder dokumenterar komponentens states och layout, medan direkt referensmatchning markeras **NOT TESTABLE**.

## Gränser

Ingen ny profilfunktion, samtyckessemantik, profilskapning, kennel-RPC, persistent lagring, migration eller generell formram. Bekräftat profile save, konflikt, unknown recovery och content refresh följer `APP-04C-PROFILE` oförändrat. Kennel använder befintlig RPC/read; statuskontroll skriver aldrig data. Attempt intent, confirmed read state och busy state är scoped till owner id + account generation + dog id; operation tokens skyddar avslut. Samtliga attribution props visas bara när hela scopen matchar.

## §14-evidens

Public/review bilder av clean, dirty, revert, discard-dialog, stay, save-busy/attribution-busy, pending profile status och unknown removal ensamt/med separat dirty profilfält. Två removal-scenarier vid 375×844 verifierar **Stäng** respektive **Avbryt ändringar** och att intentet bevaras. Prov 375×844, 430×844, 375×667 och webbaserad 140 % textproxy. Granska touchmått, svensk copy, statusläsbarhet och layout; native-/produktionspåståenden hålls separat.
