# UI-MAIN-SWIPE-01 — UX-spec v5

Ägaren ska kunna växla huvudflik utan att först behöva nå en stor tröskel som vertikal scroll redan hunnit fånga. Ett tydligt vågrätt drag byter flik i befintlig ordning; lodrät scroll och inre horisontella kontroller behåller sitt beteende. Kort, snabbt svep räknas när riktningen är entydig.

| Lägesbild | Beteende |
|---|---|
| Huvudflikssvep | Fånga tydlig vågrät rörelse tidigt; vänster = nästa, höger = föregående; ingen rundgång vid första eller sista fliken |
| Lodrät scroll | Avstå från att fånga när rörelsen främst är lodrät eller diagonal. Om en först tydligt vågrät rörelse blir lodrät ska respondern lämna över så sidans `ScrollView` kan fortsätta scrolla. |
| Inre horisontell kontroll | Aktiv `HorizontalGestureRegion` pausar huvudflikssvep tills beröringen slutar, avbryts eller regionen avmonteras |
| Kunskapsdetalj eller inaktiv sida | Befintlig sid-/detaljgrind håller huvudflikssvepet avstängt |

Gränserna anges i React Native-layoutpunkter: fångst över 12, flikbyte efter 48 eller en snabbgest efter 24 med hastighet minst 0.5 layoutpunkt/ms i samma riktning. Installerad PanResponder-källa beräknar hastigheten genom rörelsedelta delat med tidsdelta i millisekunder. En fångad gest lämnas över om nästa rörelsestatus inte längre är tydligt vågrät, så lodrät scroll kan återupptas. Ingen synlig kontroll eller ikon ändras. Ingen ny data eller gestdependency. BottomSheet-neddragning finns redan i grenen och lämnas orörd. En jämförbar skärmbild före/efter och designchecklista ska dokumenteras; om render saknas markeras visuell kontroll EJ TESTBAR. Enhetstester verifierar beslutsreglerna; faktisk gestprioritet och svep på enheten är EJ TESTBARA utan runtime/enhet.
