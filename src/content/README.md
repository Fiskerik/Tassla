# Innehållsurval
`select-content.ts` väljer senaste relevanta publicerade version per innehållsidentitet utifrån ålder och eventuell ras. Hem hämtar version, titel, brödtext, innehållstyp och rasrelationer från Supabase; RLS och en uttrycklig `published`-filtrering skyddar hämtningen. Tom raslista gäller alla hundar. Träningsprogression ska fortsätta referera sin sparade programversion, inte detta urval.

Funktionen är urval, inte åtkomstskydd. Ingen lokal cache eller redaktionell publiceringsprocess ingår. Säkerhetsindragning måste också hantera cache när sådan senare införs. Kör `pnpm check`; verkliga publicerade rader måste verifieras i Supabase-utvecklingsmiljön.
