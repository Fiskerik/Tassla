# Traction P5 — läsbar mätöversikt

Bas: `knowledge/d3-catalog-delivery@decf079`. Den skyddade databasfunktionen för aggregerad opt-in-mätning finns, men har ingen praktisk ingång. En lokal kommandoradshjälp visar endast rapportens aggregerade värden för mogna UTC-kohorter. Den tar `SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` från körmiljön, lagrar inte nyckeln och gör inga nätverksanrop förrän en människa kör verktyget. Nyckeln får aldrig finnas i appklienten eller Git.

Tomma/små grupper visas som undertryckta värden; de är inte anonymisering. Ingen råhändelse, användaridentitet eller hunddata visas. Fel redovisas utan URL, inloggningsuppgifter eller serverns feltext. Standardintervallet är 21–9 dagar före dagens UTC-datum. Testa datumval, aggregeringsformat, null/små grupper och fel med syntetisk klient. Ingen live-rapport körs här.
