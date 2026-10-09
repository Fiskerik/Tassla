## Tassla UI-polish checklista (BabyJourney-inspirerad)

### Ålder & personalisering
- [ ] Hundens ålder visas alltid som "X år Y mån" eller "Y mån" (aldrig totala veckor)
- [ ] Hem och carousel filtrerar innehåll efter aktuell ålder + ras där relevant
- [ ] HeroCard visar namn + ålder i år/mån

### Navigering & rörelse
- [ ] Swipe vänster/höger byter mellan de 6 huvudytorna
- [ ] BottomNav synkas med aktuell sida och fungerar som snabbhopp
- [ ] Transitions använder tokens.motion (120/180/240 ms)
- [ ] Reducera rörelse respekteras (ingen scale/shift)
- [ ] Pressed-state på alla knappar (MotionPressable)

### Hem & carousel
- [ ] HeroCard överst med valpnamn + ålder (år/mån)
- [ ] Horisontell carousel under Hero med 4–6 relevanta kort
- [ ] Carousel-kort: Nästa träningssteg, Senaste logg, Åldersrelevant kunskap, Kommande hälsa, Snabb-logga
- [ ] Korten är tappable och leder till rätt skärm
- [ ] Smooth snap-scroll, ingen AI-slop-layout

### Design-rules (anti AI-slop)
- [ ] Max en primär knapp per vy
- [ ] Kompakt information, tydlig hierarki
- [ ] Inga tekniska banners/statusetiketter på vanliga poster
- [ ] Konsekventa ikoner (Ionicons) + befintliga hundbilder
- [ ] Använder tokens från src/theme/tokens.ts
- [ ] Inga generiska gradienter eller för många skuggor

### Feedback & polish
- [ ] Omedelbar feedback vid loggning (Valplogg)
- [ ] Skeleton loaders istället för tomma ytor
- [ ] BottomSheet för snabb handling där det passar
- [ ] Visuell QA med skärmdumpar + ifylld 18-punktschecklista från design-rules.md