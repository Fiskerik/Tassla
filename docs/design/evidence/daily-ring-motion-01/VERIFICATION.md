# DAILY-RING-MOTION-01 — evidens

RNWeb-fixture med syntetiska rutinposter. `verify-daily-ring-motion.py` mäter SVG-strokens faktiska mellansteg efter en av användaren begärd bekräftad avbockning; `results.json` innehåller tidsserie och samtidigt semantiskt slutantal. Samma prov kontrollerar reducerad rörelse, ändring av preferensen under väntan och under rörelse, misslyckad mutation och undo. Durationen 220 ms är konfigurerad; den syntetiska tidsserien bevisar mellanvärden, inte exakt väggklocketid. Policytest täcker även fel/unknown, byte av hund/dag/scope, annan mutation, ändrad lista och ej observerad pending. `before`, `during`, `after` och `after-panel3` visar berörd yta; kort skärm/stor text och 430 px finns separat.

Full panellikhet är inte fastställd: tidigare skillnader i komposition, foto och aktivitetsraders innehåll kvarstår. Native animation/avbrott, VoiceOver och live Supabase/RLS är NOT TESTABLE i denna miljö.
