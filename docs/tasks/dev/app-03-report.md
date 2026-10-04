# APP-03 – checkpoint

2026-10-04. Erik vill nu ha Codemagic/Google och verkliga data samt design närmare visionsbilden. Han har bekräftat att Codemagic ännu inte är konfigurerat.

Plan v1 finns i app-03.md. TechLead architecture_astra: APPROVE som teknisk plan, villkorad av paketgodkännande, Compliance och Critic. Inga paket installerade eller appkod ändrad för APP-03 ännu. Compliance pågår. Critic återstår. Explicit paketfråga ställd till Erik: expo-crypto ~57.0.3, @expo/vector-icons ^15.0.2, expo-font ~57.0.4; versionsförslag från installerade Expo 57.

Två dekorativa beaglefoton genererade med inbyggt imagegen, visuellt inspekterade och kopierade till assets/images/dog-welcome.png och dog-resting.png. Prompter och användningsbegränsningar dokumenteras i assets/images/README.md. Inga API-nycklar eller verkliga ägarbilder användes.

Codemagic-startguide finns i docs/dev/codemagic-first-build.md. Konto/repoanslutning, Apple-integration, signering och faktisk TestFlight-körning är ännu inte gjorda; behöver Eriks åtkomst. Ingen Git-push, molnkörning, extern publicering eller Google-login har utförts av Codex.

Erik godkände därefter uttryckligen de tre paketen; installationen slutfördes med expo-crypto 57.0.3, @expo/vector-icons 15.0.2 och expo-font 57.0.4. Compliance PROCEED för intern kod, Critic PROCEED med två förtydliganden och Astra APPROVE uppdaterad exakt plan v1. Planen dokumenterar nu identitetsprov före första skrivning och separata App Review/integritetsgrindar redan före TestFlight. Ingen automatisk seed krävs: saknade publicerade program ska ge tomläge.

Queue APP-03-LOCAL är implementing. Luna arbetar i ordningen A auth/byggkontrakt, B ägarworkspace/data, C visualer. Root äger rapport/queue; tester och oberoende granskning följer appimplementationen. Codemagics inloggningssida öppnades för Erik; inga kontoåtgärder utfördes.

Compliance-källor: EU-kommissionens information om personuppgifter/rättslig grund/information till individer; Supabase identity-linking och Google-auth; Google OpenID Connect; Apples App Review Guidelines och TestFlight-översikt. Granskningen är inte en juridisk certifiering. Inför egen verklig testskrivning behöver Erik dokumentera ändamål, rättslig grund, information, lagring/radering och faktisk Supabase-region. Publik pilot och release är fortfarande separata beslut.

Nästa steg: Luna A/B/C-checkpoints, faktisk lokal kontroll, QA samt oberoende source/security-granskning. Verklig Google/signering/RLS kräver separata telefonresultat.
