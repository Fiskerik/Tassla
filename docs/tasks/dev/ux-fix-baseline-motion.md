# UX-FIX-BASELINE-MOTION-01 — Pressable-state i MotionPressable

Status: plan v1.1 godkänd av Architect 2026-10-15 efter Critic PROCEED WITH CHANGES. Kandidat: 9a81815993f015478be480f9c8d19b0923b05f76.

## Fynd och avgränsning

Efter installation från befintlig lockfil faller pnpm check på src/components/ui/Motion.tsx:48: konsumentens style callback får bara { pressed }, men låsta React Native 0.86.3/Expo 57-deklarationer kräver { pressed, hovered }. Inget focused-fält finns. Kandidatens fulla testsvit passerar 492/492; detta fel stoppar typkontrollen före lint och checkkedjan.

Enda skrivfil: src/components/ui/Motion.tsx. Ingen ny dependency eller testfil, inga ändrade konsumenter. Befintlig src/components/README.md kräver att stilfunktionen utvärderas före Animated-komponenten så att presskalan förblir synlig för native Animated.

## Godkänt kontrakt

- Behåll syntetiskt pressed-state och konkret style-array till AnimatedPressable; skicka inte Animated.Value gömd inuti en style callback.
- Lägg till syntetiskt hovered-state via installerade onHoverIn/onHoverOut-props och kedja konsumentens callbacks exakt en gång.
- Anropa konsumentens style callback med { pressed: pressed && !disabled, hovered: hovered && !disabled }; inga casts eller påhittade focused-fält.
- När disabled blir true ska effekten nollställa både pressed och hovered samt stoppa/resetta skalan. Återaktivering utan out-event ska förbli neutral.
- Behåll reducerad rörelse, cleanup och befintligt press-scale-beteende.

## Acceptans och verifiering

- Typecheck och riktad ESLint passerar.
- RN Web-probe visar hover/press, exakt-en-gång callbackkedjning, neutral stil efter disable→enable utan out-event, samt konkret/observerad transformanimering.
- pnpm check och git diff --check passerar.
- Native runtime markeras NOT TESTABLE om den inte finns; ingen native-PASS härleds från RN Web.

Architect bedömde första callback-förslaget osäkert eftersom Animated.Value kunde döljas från Animated-noden. Denna v1.1 behåller förutvärderingen och native-visible transformen. Critic krävde uttrycklig reset av båda tillstånden när disabled slås på; det är nu en del av planen och proben.
