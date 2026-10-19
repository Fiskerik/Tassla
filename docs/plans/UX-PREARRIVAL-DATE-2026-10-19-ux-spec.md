# UX-spec — Leveransdatum 2026-10-19 v3

## Profil
Skapa och redigera visar samma frivilliga fält efter födelsedatum: Leveransdatum. Hjälptext: “Datumet hunden kommer hem. Du kan lämna fältet tomt.” Ett separat, aktivt opt-in krävs innan datumet lagras. Tomt eller nekad/återkallad consent sparas som NULL. Profilvyn visar “Inte angivet” när värdet saknas. Datum kan senare ändras eller rensas. Efter hemkomst visas datumet som profilhistorik till den godkända 30-dagarsgränsen, sedan gallras det automatiskt.

## Förberedelser på Hem
När leveransdatum är i dag eller i framtiden visas kortet Inför hemkomsten efter hundens identitets-/åldersrad och före Just nu. Visa en lokal kalenderdagsnedräkning (”Hunden kommer hem i dag”, annars ”Hunden kommer hem om N dagar”) och korta förslag om sovplats/bädd, koppel samt mat- och vattenskålar. Saknat eller passerat datum visar inget kort. Förslagen är statiska och skapar inga aktiviteter.

## Datum- och datakontrakt
home_arrival_date är nullable och måste vara samma dag som eller senare än födelsedatum. Befintliga profiler blir NULL. Appen använder localDate() och parseCalendarDate() för datumsträngar och dagdifferens. Ny klient använder den unikt namngivna create_dog_with_home_arrival_date(dog_name, dog_breed_id, dog_birth_date, kennel_code, dog_home_arrival_date) utan defaults. Befintlig fyra-arguments create_dog lämnas tillgänglig för äldre klienter. Nullable-update använder .is(..., null) i CAS; icke-NULL använder .eq(...). Ingen RLS-ändring.

## Layout
Bevara nuvarande Home-hierarki och de tre primära destinationskorten vid 375×844 och 430×844. Vid 375×667 samt 140 % textproxy tillåts scrollning, men ingen text eller kontroll får överlappa eller klippas. Syntetisk preview täcker tomt, framtida, i dag och passerat datum.

## Datahantering och review
Avsedd rättslig grund enligt ägarbeslut 2026-10-19 är GDPR art. 6.1(a) samtycke. Opt-in är separat från allmänna villkor, frivilligt, aktivt, informerat och endast för detta ändamål; ett nej påverkar inte övriga appfunktioner. Återkallelse ska vara lika enkel som opt-in och stoppa användningen samt radera datumet. Samtycke måste kunna bevisas. Samtycke får inte återanvändas från analytics.

Ägarens profilhistorikformulering tolkas preliminärt som att datumet behålls och visas till 30 kalenderdagar efter hemkomst och gallras därefter automatiskt. Tidszon, gräns och verifierbar maximal gallringsfördröjning ska bestämmas före implementation. Användningsändamålet är förberedelseinformation före hemkomst och kort profilhistorik. Samma ägaråtkomst och profilredigering/radering gäller; beta-, konto- och hundradering ska omfatta datum och consent record. Ingen notifiering, aktivitetssparning, analys eller extern delning. Architect, Security och Compliance granskar samtyckeslagring, migration, legacy-anrop, ändamål, information och gallring innan kod. Migration, live RLS/RPC, samtyckes- och gallringsruntime är NOT TESTABLE utan separat miljö; native tillgänglighet är NOT TESTABLE utan native verifiering.
