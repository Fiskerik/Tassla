# Lokala påminnelser

`notification-model.ts` validerar det stängda preferensformatet, ägarskopade payloads och lokala datum/tider. `notification-storage.ts` sparar endast val av/på och enhetens valda träningstid i SecureStore under en ägarspecifik nyckel. Preferenser börjar av och är separata från planens serverlagrade påminnelseval.

`notification-service.ts` använder endast Expo Notifications lokala schemaläggnings-, avboknings- och behörighets-API:er. Den jämför stabila Tassla-ID:n med den faktiska iOS UTC-kalender- eller Android datum-triggern innan den behåller en notis. Endast egna whitelisted payloads kan avbokas. Kallback från en avisering öppnar endast en aktuell hunds träningsvy eller en serverbekräftad plan.

Urvalet tar högst 40 tidigaste framtida planer plus en frivillig nästa träningspåminnelse. Ej representerbar DST-tid, passerad tid, enhetsbehörighet, fel och osäker sparstatus visas skilt åt. Generisk låsskärmstext innehåller inte hundnamn eller anteckning. Att en notis är schemalagd betyder inte att enheten faktiskt visar eller levererar den. Faktisk nativeleverans har inte verifierats här.
