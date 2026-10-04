# Vardagslogg

`LogScreen.tsx` visar sex snabbval, lokal datumgruppering, historik, redigering och bekräftad radering. I det inloggade flödet äger `ProductWorkspace.tsx` vydata och använder `src/data/workspace-data.ts` för att läsa högst 40 poster åt gången och hämta äldre poster vid behov. Endast de sex vardagstyperna visas; hälsoposter med datum utan klockslag ingår inte i den här loggen.

En ny post får ett `expo-crypto` UUID innan nätverksanropet. Vid okänt resultat läses samma ID först; om posten saknas kan samma ID försöka sparas igen. Rättning och radering verifieras genom återläsning. Osäker status visas öppet och sparas inte optimistiskt i historiken. Läshämtningar serialiseras och sorteras med en unik ID-tiebreaker; offset kan ändå flyttas om en annan enhet lägger till poster mitt i sidläsningen. `log-model.ts` är fortsatt en ren lokal-previewmodell.

Previewposter ligger i RAM och är märkta; produktposter kommer från den inloggade hundens RLS-skyddade `dog_events`. Inga offlineköer finns. Kör `pnpm check`; riktig kontobehörighet och nätverksresa kräver utvecklingsmiljötest.
