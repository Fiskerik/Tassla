# Pilotmätning

Ingen produktionsinsamling är aktiverad. `createSyntheticAnalyticsAdapter` är en processlokal testhjälp: den sparar endast en tillåten händelsetyp och tidsstämpel i minnet. Den gör inga nätverks- eller databasanrop och tar inte emot konto-, hund-, kennel- eller innehålls-ID:n.

Adaptern är avstängd som standard och kräver både `enabled: true` och `consentGranted: true`. Dessa värden är endast testgrindar; de utgör inte en produktionsflagga eller dokumenterat samtycke. Använd den inte från appflöden. `product_events` saknar fortsatt klientgrants och samtyckeskontrakt.

Händelsetyperna speglar den befintliga tabellens allowlist. De är tekniska definitioner, inte ett beslut om ändamål eller produktionsmätning. Före eventuell produktionsinsamling krävs fastställt datakontrakt, consent/withdraw-flöde, servervalidering, åtkomst, gallring/radering, rapportdefinition och säkerhetsgranskning. Skicka aldrig namn, e-post, fritexter eller vårduppgifter till analytics.
