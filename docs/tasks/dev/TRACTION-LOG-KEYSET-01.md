# Stabilare sidindelning för Logga och Insikter

Bas: `knowledge/d3-catalog-delivery@decf079`. Den befintliga listan läser 40 poster i taget med offset. Om en nyare post läggs till eller raderas på en annan enhet mellan sidläsningar kan offset förskjutas och en post hoppas över eller visas dubbelt.

Målet är en cursor av exakt serverreturnerad tidsstämpel och UUID med ordning `occurred_at DESC, id DESC`, utan att avrunda mikrosekunder. Nästa sida följer den senast inlästa serverposten, inte längden eller lokalt ändrade rader. Vid kontobyte, hundbyte och omhämtning byts cursor med samma scope. Pågående lokala ändringar och läsfel får inte försvinna eller återuppväcka en raderad post. Befintlig RLS och avbrott ska bibehållas.

Detta ger stabil traversal när rader framför gränsen läggs till eller tas bort. Det är ingen låst databasögonblicksbild: en post som ändrar tid över gränsen eller raderas på en annan enhet kan kräva uppdatering för att synas korrekt. UI ska fortsätta ange att det är hämtade händelser.

Verifiera ursprungsfilter, sortering, parallella inlägg/raderingar, lika tidsstämplar, mikrosekunder, cursorvalidering, tom sista sida, avbrott och lokal mutation under hämtning. Testa befintliga logg-/insiktsflöden med syntetisk data; ingen live-databas eller faktisk tvåenhetsverifiering påstås.
