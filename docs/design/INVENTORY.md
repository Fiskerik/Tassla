# Inventering av Tasslas nuvarande UI

Datum: 2026-10-07. Läsläge: endast källkodsinventering; ingen appkod ändrad.

## Underlag och avgränsning

- AGENTS.md läst. Begärda docs/DESIGN_RULES.md och docs/design/malbild.png saknas. Den faktiskt införda policyn är docs/design-rules.md; målbilden vision_rev01.jpg har inspekterats visuellt, endast dess övre MVP-del. Sökvägarna ersätts inte tyst och inga nya bild-/policykopior skapas.
- Genomsökta alla 50 TypeScript/TSX-filer under src/ och app/, inklusive centrala komponenter/tokens, utvecklingspreview och PDF-mall. Biblioteksintern styling, typsnittens glyphgeometri, fotografiers pixelkulörer och operativsystemets native Alert/Modal-standardvärden är inte appdefinierade designvärden och ingår inte.
- Siffror avser deklarationer i aktuell kod, inte mätning av renderade skärmar. Villkorliga, dynamiska och oanvända definitioner kan finnas; tillstånd som aldrig visas samtidigt räknas inte som samtidiga knappar.
- Produktionsväg: AppFlow → DogWorkspace → ProductWorkspace; preview använder DevelopmentPreview och delvis andra skärmar. En deklaration i preview säger inte att produktionsappen visar den.
- Inga appskärmdumpar tagna eller appvyer renderade. Visuell QA, radbrytning, faktisk kontrast och stor text: NOT TESTABLE här. Detta är en inventering, inte ett UI-godkännande.

## Läsanvisning

Avsnitt 1 listar värden och alla identifierade hårdkodade lägen. Avsnitt 2 listar komponentvarianter och anropsställen. Avsnitt 3 förklarar konkreta regelbrott. Avsnitt 4 föreslår tokens. Tabellerna är avsiktligt omfattande så varje lokalt värde går att hitta, även i preview och PDF.

Inventeringen omfattar 50 källfiler. Basen är varm gräddvit/mörkgrön, men styling och hierarki varierar mellan skärmar. Prioriterade fynd är normalstatus på poster, dubbla huvudknappar, teknisk copy och loggens blandade symboler. Se avsnitt 3 innan detaljtabellerna om du vill börja med slutsatserna.

## 1. Befintliga tokens

```ts
// Initial brand proposal; confirm on real screens before finalising.
export const theme = {
  colors: {
    background: '#F7F1E7', surface: '#FFFFFF', text: '#1C3027',
    mutedText: '#536257', accent: '#186A4D', onAccent: '#FFFFFF',
    border: '#D9DFD7', error: '#A32929',
  },
  spacing: { small: 8, medium: 16, large: 24 },
  radius: { card: 20, button: 14 },
  type: { body: 16, heading: 28, label: 14 },
} as const;
```

### 1.1 Alla identifierade färgliteraler

Tabellen listar varje färg och samtliga fil/rad-lägen. Centrala theme-färger är avsiktliga token-definitioner; samma hex lokalt i en vy/PDF är hårdkodning. rgba används bland annat för överlägg.

| Färg | Förekomster |
|---|---|
| `#0008` | [src/components/AppPrimitives.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:293) |
| `#12543D` | [src/components/AppPrimitives.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:282); [src/components/AppPrimitives.tsx:283](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:283) |
| `#186A4D` | [src/features/passport/passport-model.ts:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:66); [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100); [src/theme/tokens.ts:5](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:5) (token) |
| `#1C3027` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100); [src/theme/tokens.ts:4](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:4) (token) |
| `#2B805F` | [src/features/home/PreviewHomeScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:58) |
| `#536257` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100); [src/theme/tokens.ts:5](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:5) (token) |
| `#785716` | [src/features/knowledge/DraftContentPreview.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:55); [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292); [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) |
| `#936324` | [src/features/health/PlannedHealthScreen.tsx:383](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:383) |
| `#94B39E` | [src/features/training/PublishedTrainingScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:131); [src/features/training/TrainingScreen.tsx:110](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:110) |
| `#A32929` | [src/theme/tokens.ts:6](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:6) (token) |
| `#BFDCC9` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#D2E5D8` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#D5A5A0` | [src/components/AppPrimitives.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:291) |
| `#D6C59B` | [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240); [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369); [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54); [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) |
| `#D9DFD7` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100); [src/theme/tokens.ts:6](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:6) (token) |
| `#DCE9DD` | [src/features/home/DevelopmentPreview.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:260) |
| `#DDECE2` | [src/features/home/PreviewHomeScreen.tsx:62](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:62) |
| `#E4D9BE` | [src/features/knowledge/DraftContentPreview.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:58) |
| `#E4EEF4` | [src/features/puppy-log/LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) |
| `#E5EBE5` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#E5EFE8` | [src/features/account/AccountSettingsScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:112); [src/features/health/HealthHistoryScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:216); [src/features/health/HealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:213); [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226); [src/features/health/PlannedHealthScreen.tsx:341](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:341); [src/features/home/DevelopmentPreview.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:272); [src/features/notifications/NotificationSettingsScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:129); [src/features/onboarding/EditDogProfileScreen.tsx:167](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:167); [src/features/onboarding/ProfileScreen.tsx:152](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:152); [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293); [src/features/puppy-log/LogScreen.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:301); [src/features/training/TrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:101) |
| `#E8E3D6` | [src/features/home/ProductWorkspace.tsx:2032](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2032) |
| `#E8EFE8` | [src/features/home/ProductWorkspace.tsx:2049](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2049); [src/features/knowledge/KnowledgeScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:121); [src/features/passport/PassportScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:247); [src/features/passport/PassportScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:255) |
| `#E8F1EB` | [src/features/passport/passport-model.ts:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:66) |
| `#EAF2EC` | [src/features/health/HealthHistoryScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:229); [src/features/health/PlannedHealthScreen.tsx:352](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:352); [src/features/onboarding/EditDogProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:154) |
| `#EAF3EC` | [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298); [src/features/passport/PassportScreen.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:267); [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#EFE8DA` | [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) |
| `#F0E9DC` | [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) |
| `#F0F6F0` | [src/features/training/PublishedTrainingScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:131); [src/features/training/TrainingScreen.tsx:110](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:110) |
| `#F0F6F1` | [src/features/notifications/NotificationSettingsScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:132) |
| `#F1F5F0` | [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111); [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40); [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243); [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225); [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340); [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373); [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128); [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151); [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) |
| `#F1F6F2` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#F5E7BF` | [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292); [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) |
| `#F5F8F4` | [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) |
| `#F7EAE7` | [src/components/AppPrimitives.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:291) |
| `#F7F1E7` | [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275); [src/theme/tokens.ts:4](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:4) (token) |
| `#F7F3EA` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#FBF6EA` | [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240); [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369); [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54); [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) |
| `#FBF8F1` | [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130); [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) |
| `#FBFCFA` | [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225); [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) |
| `#FFF` | [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) |
| `#FFF0D2` | [src/features/home/PreviewHomeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:59) |
| `#FFFFFF` | [src/theme/tokens.ts:4](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:4) (token); [src/theme/tokens.ts:5](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:5) (token) |
| `RGBA(255,250,240,0.92)` | [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) |

### 1.2 Fontstorlekar

Alla deklarationer visas, även token-/uttrycksreferenser, procent och nollvärden. Literal betyder lokalt numeriskt/strängvärde; strukturella dimensioner skiljs från spacing.

| Fil:rad | Egenskap | Värde/uttryck | Typ |
|---|---|---|---|
| [src/components/AppPrimitives.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:272) | `fontSize` | `24` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:273) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:275) | `fontSize` | `30` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:276) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:278](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:278) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:284) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:288) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:290](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:290) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:295) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:301) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:303](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:303) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:305) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:308) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:311](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:311) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:116) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:117) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:42](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:42) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:43](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:43) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:45](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:45) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:87) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:218) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:219) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:221](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:221) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:223) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:224) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:226) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:231](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:231) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:234](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:234) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:236](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:236) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:238](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:238) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:239](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:239) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:241](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:241) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:242](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:242) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:246) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:247) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:251) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:252) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:253) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:254) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:214](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:214) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:216) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:217](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:217) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:218) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:220) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:222) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:229) | `fontSize` | `21` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:230](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:230) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:231](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:231) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:344](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:344) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:346](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:346) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:347](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:347) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:349](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:349) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:354](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:354) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:360](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:360) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:361](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:361) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:363](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:363) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:365](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:365) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:367](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:367) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:368](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:368) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:370](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:370) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:371](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:371) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:372](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:372) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:376](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:376) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:377](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:377) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:381](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:381) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:382](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:382) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:384](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:384) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:385](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:385) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:386](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:386) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:261](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:261) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:263) | `fontSize` | `28` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:264](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:264) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:267) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:268) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:269) | `fontSize` | `26` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:273) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:59) | `fontSize` | `29` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:61](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:61) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:62](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:62) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:63](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:63) | `fontSize` | `21` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:65](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:65) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:66) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:67](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:67) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:68](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:68) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2029](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2029) | `fontSize` | `11` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2030](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2030) | `fontSize` | `34` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2031](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2031) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2034](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2034) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2035](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2035) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2036](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2036) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2039](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2039) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2042](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2042) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2043](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2043) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2044](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2044) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2046](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2046) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2047](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2047) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2050](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2050) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2053](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2053) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2054](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2054) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2056](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2056) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2059](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2059) | `fontSize` | `11` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:55) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:56](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:56) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:57) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:59) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:123) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:124) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:125) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:128) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:129) | `fontSize` | `22` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:131) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:132) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:133) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:135) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:136) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:139) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:124) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:126) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:127) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:137) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:138](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:138) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:140) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:142](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:142) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:155](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:155) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:157](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:157) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:158](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:158) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:159](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:159) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:161](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:161) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:163](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:163) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:169](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:169) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:172](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:172) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:149](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:149) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:154) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:156) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:250) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:251) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:252) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:253) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:257](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:257) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:260) | `fontSize` | `17` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:265) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `fontSize` | `22` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:269) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:270) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:272) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:273) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:276) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:277](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:277) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:279) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:283](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:283) | `fontSize` | `19` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:284) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:286](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:286) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:288) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:291) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `fontSize` | `9` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `fontSize` | `9` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:294) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:297) | `fontSize` | `18` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:298) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:302) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:309](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:309) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:315](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:315) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:316](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:316) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:317](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:317) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:124) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:126) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:127) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:128) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:132) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:133) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:135) | `fontSize` | `11` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:136) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:102) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:104](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:104) | `fontSize` | `20` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:106](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:106) | `fontSize` | `15` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:107](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:107) | `fontSize` | `13` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:112) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:113](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:113) | `fontSize` | `10` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:114) | `fontSize` | `16` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:116) | `fontSize` | `11` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:117) | `fontSize` | `14` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:118](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:118) | `fontSize` | `12` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:119) | `fontSize` | `12` | Hårdkodat lokalt |

Unika direktdeklarerade fontSize-värden: 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 28, 29, 30, 34.

### 1.3 Radier

Alla deklarationer visas, även token-/uttrycksreferenser, procent och nollvärden. Literal betyder lokalt numeriskt/strängvärde; strukturella dimensioner skiljs från spacing.

| Fil:rad | Egenskap | Värde/uttryck | Typ |
|---|---|---|---|
| [src/components/AppPrimitives.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:271) | `borderRadius` | `14` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/components/AppPrimitives.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:280) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/components/AppPrimitives.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:294) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/components/AppPrimitives.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:300) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/account/AccountSettingsScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:112) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/account/BetaInfoScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:41) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:216) | `borderRadius` | `21` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:228) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthHistoryScreen.tsx:244](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:244) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:248) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:212](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:212) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:213) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:219) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:224) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226) | `borderRadius` | `21` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:341](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:341) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:351](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:351) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:357](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:357) | `borderRadius` | `7` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/health/PlannedHealthScreen.tsx:374](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:374) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:378](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:378) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/DevelopmentPreview.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:260) | `borderRadius` | `20` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/home/DevelopmentPreview.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:271) | `borderRadius` | `16` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/PreviewHomeScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:58) | `borderRadius` | `26` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:64](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:64) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2032](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2032) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2040](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2040) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2045](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2045) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2049](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2049) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2055](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2055) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/home/ProductWorkspace.tsx:2058](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2058) | `borderRadius` | `14` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/knowledge/KnowledgeScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:126) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/notifications/NotificationSettingsScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:129) | `borderRadius` | `24` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/notifications/NotificationSettingsScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:134) | `borderRadius` | `8` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:153](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:153) | `borderRadius` | `28` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:154) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:160) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:166) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/onboarding/EditDogProfileScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:171) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/onboarding/ProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:151) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/passport/PassportScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:247) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/passport/PassportScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:248) | `borderRadius` | `23` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/passport/PassportScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:255) | `borderRadius` | `21` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:258](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:258) | `borderRadius` | `8` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:263) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/passport/PassportScreen.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:267) | `borderRadius` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `borderRadius` | `18` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275) | `borderRadius` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/puppy-log/LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) | `borderRadius` | `17` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:287) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `borderRadius` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `borderRadius` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `borderRadius` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/training/PublishedTrainingScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:121) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/training/PublishedTrainingScreen.tsx:122](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:122) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) | `borderRadius` | `14` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:125) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/features/training/TrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:101) | `borderRadius` | `20` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:103) | `borderRadius` | `theme.radius.card` | Token/uttryck |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `borderRadius` | `12` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) | `borderRadius` | `theme.radius.button` | Token/uttryck |
| [src/theme/tokens.ts:9](C:/Users/erika/Documents/GitHub/Tassla/src/theme/tokens.ts:9) | `radius` | `{ card: 20, button: 14 }` | Central token |

### 1.4 Avstånd: padding, margin och gap

Alla deklarationer visas, även token-/uttrycksreferenser, procent och nollvärden. Literal betyder lokalt numeriskt/strängvärde; strukturella dimensioner skiljs från spacing.

| Fil:rad | Egenskap | Värde/uttryck | Typ |
|---|---|---|---|
| [src/components/AppPrimitives.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:269) | `paddingHorizontal` | `24` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:269) | `paddingTop` | `20` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:269) | `paddingBottom` | `48` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:273) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:274) | `marginTop` | `36` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:274) | `marginBottom` | `24` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:276) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:277](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:277) | `marginBottom` | `18` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:278](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:278) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `paddingHorizontal` | `16` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:280) | `paddingHorizontal` | `18` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:280) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:285](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:285) | `paddingHorizontal` | `12` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:285](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:285) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) | `padding` | `16` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) | `marginTop` | `18` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:293) | `padding` | `20` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:294) | `padding` | `20` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:295) | `marginBottom` | `12` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:297) | `paddingBottom` | `8` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298) | `padding` | `14` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:299](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:299) | `marginBottom` | `18` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:301) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:302) | `paddingHorizontal` | `13` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:306](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:306) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:310](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:310) | `paddingVertical` | `12` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `marginBottom` | `12` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:117) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `marginBottom` | `12` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:41) | `padding` | `18` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:41) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:43](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:43) | `marginTop` | `6` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:44](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:44) | `paddingVertical` | `12` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:44](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:44) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:85](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:85) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:85](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:85) | `marginTop` | `24` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:85](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:85) | `marginBottom` | `18` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:214](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:214) | `marginTop` | `28` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:215](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:215) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:215](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:215) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:219) | `marginTop` | `2` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:220) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:220) | `marginBottom` | `4` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:222) | `gap` | `5` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:222) | `paddingHorizontal` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:224) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225) | `marginTop` | `18` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:226) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:227](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:227) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:227](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:227) | `marginBottom` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:228) | `gap` | `7` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:228) | `paddingHorizontal` | `11` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:233](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:233) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:234](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:234) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:236](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:236) | `paddingVertical` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `paddingVertical` | `12` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:238](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:238) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:239](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:239) | `marginTop` | `22` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:242](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:242) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:242](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:242) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:247) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:248) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:248) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:249](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:249) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:250) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:253) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:254) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:255) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:255) | `marginTop` | `9` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:212](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:212) | `gap` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:212](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:212) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:217](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:217) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:218) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:219) | `marginTop` | `20` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:219) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:220) | `marginBottom` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:221](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:221) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:222) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:224) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:224) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225) | `marginTop` | `13` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:227](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:227) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:228) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:231](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:231) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:232](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:232) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:232](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:232) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:343](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:343) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:343](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:343) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:345](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:345) | `gap` | `6` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:345](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:345) | `paddingHorizontal` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:347](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:347) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) | `marginTop` | `18` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:349](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:349) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:350](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:350) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:350](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:350) | `marginBottom` | `16` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:351](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:351) | `gap` | `7` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:351](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:351) | `paddingHorizontal` | `11` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) | `gap` | `11` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) | `padding` | `12` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:361](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:361) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:362](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:362) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:363](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:363) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:365](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:365) | `paddingVertical` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `paddingVertical` | `12` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:367](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:367) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:368](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:368) | `marginTop` | `22` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:371](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:371) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:372](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:372) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:372](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:372) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:377](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:377) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:378](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:378) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:378](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:378) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:379](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:379) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:380](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:380) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:384](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:384) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:385](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:385) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:386](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:386) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:387](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:387) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:387](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:387) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:260) | `paddingHorizontal` | `11` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:260) | `paddingVertical` | `7` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:260) | `marginTop` | `18` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:262](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:262) | `marginTop` | `36` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:262](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:262) | `marginBottom` | `22` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:264](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:264) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `paddingHorizontal` | `16` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:268) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:269) | `paddingLeft` | `12` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:270) | `paddingHorizontal` | `8` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:270) | `paddingVertical` | `5` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:271) | `marginHorizontal` | `3` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `padding` | `18` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `gap` | `14` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `marginBottom` | `30` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:62](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:62) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:64](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:64) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:64](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:64) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:66) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:67](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:67) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:68](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:68) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2028](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2028) | `marginTop` | `30` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2028](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2028) | `marginBottom` | `20` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2030](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2030) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2031](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2031) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2032](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2032) | `marginBottom` | `26` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2033](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2033) | `padding` | `18` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2035](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2035) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2036](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2036) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2038](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2038) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2038](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2038) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2040](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2040) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2040](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2040) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2041](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2041) | `gap` | `7` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2042](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2042) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2044](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2044) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2045](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2045) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2045](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2045) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2048](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2048) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2048](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2048) | `marginTop` | `20` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2049](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2049) | `gap` | `5` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `gap` | `13` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2054](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2054) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2055](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2055) | `padding` | `18` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2056](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2056) | `marginBottom` | `18` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2057](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2057) | `paddingHorizontal` | `8` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2057](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2057) | `paddingTop` | `5` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2057](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2057) | `paddingBottom` | `4` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2059](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2059) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54) | `marginTop` | `13` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:56](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:56) | `marginTop` | `6` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:57) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:58) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:58) | `paddingTop` | `10` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:119) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:119) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `paddingHorizontal` | `15` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `paddingVertical` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:124) | `marginTop` | `3` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:126) | `padding` | `18` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:126) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:127) | `gap` | `7` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:129) | `marginTop` | `9` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:130) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:131) | `marginTop` | `15` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:131) | `marginBottom` | `3` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:132) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:132) | `marginBottom` | `2` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:133) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:134) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:135) | `marginTop` | `6` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:136) | `marginTop` | `24` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:136) | `marginBottom` | `6` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:137) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:137) | `paddingVertical` | `9` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:123) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:123) | `marginBottom` | `4` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:125) | `gap` | `5` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:125) | `paddingHorizontal` | `8` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:127) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:138](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:138) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:139) | `marginTop` | `16` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:140) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `paddingHorizontal` | `13` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:154) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:154) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:154) | `marginTop` | `10` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) | `padding` | `15` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:158](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:158) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:159](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:159) | `marginVertical` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:160) | `marginTop` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:160) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:161](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:161) | `marginBottom` | `15` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:162](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:162) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:163](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:163) | `marginBottom` | `7` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:165](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:165) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:165](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:165) | `marginBottom` | `17` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:166) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:171) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:171) | `paddingHorizontal` | `14` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:172](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:172) | `paddingVertical` | `10` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:149](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:149) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:149](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:149) | `marginTop` | `2` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:150](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:150) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:150](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:150) | `marginBottom` | `18` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:151) | `paddingHorizontal` | `16` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:247) | `gap` | `13` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:247) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:251) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:253) | `marginTop` | `23` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:253) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `padding` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `gap` | `11` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:263) | `padding` | `17` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:263) | `marginTop` | `22` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:265) | `marginTop` | `22` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:266) | `paddingTop` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:266) | `marginTop` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:267) | `gap` | `9` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:267) | `padding` | `10` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:267) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:270) | `marginBottom` | `6` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:271) | `gap` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:271) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:273) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:274) | `paddingTop` | `7` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:274) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275) | `padding` | `12` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:276) | `marginTop` | `13` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:277](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:277) | `marginTop` | `11` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:279) | `marginTop` | `2` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:279) | `marginBottom` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:280) | `gap` | `10` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `padding` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:284) | `marginTop` | `6` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:285](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:285) | `marginTop` | `18` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:286](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:286) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:287) | `padding` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:287) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:288) | `paddingTop` | `3` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:290](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:290) | `gap` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `paddingHorizontal` | `6` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `paddingVertical` | `3` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `paddingHorizontal` | `6` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `paddingVertical` | `3` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:294) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:295) | `gap` | `4` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:295) | `marginLeft` | `-12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:295) | `marginTop` | `2` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) | `marginTop` | `22` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) | `marginBottom` | `24` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:297) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:298) | `marginBottom` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:299](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:299) | `gap` | `7` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:299](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:299) | `marginBottom` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `paddingHorizontal` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:304](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:304) | `gap` | `10` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:307](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:307) | `marginBottom` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `padding` | `12` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:309](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:309) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) | `marginTop` | `16` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:316](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:316) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:317](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:317) | `marginTop` | `7` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:121) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) | `margin` | `12` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) | `paddingHorizontal` | `11` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) | `paddingVertical` | `7` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:125) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:125) | `marginTop` | `20` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:127) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:128) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:129) | `marginTop` | `16` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:133) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:134) | `paddingTop` | `13` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:134) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:136) | `marginTop` | `6` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:101) | `paddingHorizontal` | `11` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:101) | `paddingVertical` | `7` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:103) | `padding` | `16` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:103) | `marginTop` | `20` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `paddingHorizontal` | `9` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `paddingVertical` | `6` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `marginTop` | `9` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:106](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:106) | `marginTop` | `8` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:107](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:107) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:108](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:108) | `marginTop` | `16` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) | `padding` | `14` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) | `marginBottom` | `10` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:114) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:115](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:115) | `paddingTop` | `13` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:115](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:115) | `marginTop` | `14` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:117) | `marginTop` | `5` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:118](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:118) | `marginTop` | `4` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:119) | `marginTop` | `7` | Hårdkodat lokalt |

Unika direktdeklarerade avstånd: -12, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 23, 24, 26, 28, 30, 36, 48. Spacingskalan i policyn är 4/8/12/16/24/32; nollvärden återställer/layoutar och är inte automatiskt ett användbarhetsfel.

### 1.5 Övrig typografi

Alla deklarationer visas, även token-/uttrycksreferenser, procent och nollvärden. Literal betyder lokalt numeriskt/strängvärde; strukturella dimensioner skiljs från spacing.

| Fil:rad | Egenskap | Värde/uttryck | Typ |
|---|---|---|---|
| [src/components/AppPrimitives.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:272) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:273) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:273) | `letterSpacing` | `1.4` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:275) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:275) | `lineHeight` | `38` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:275) | `letterSpacing` | `-0.6` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:276) | `lineHeight` | `25` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:278](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:278) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:284) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:288) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:290](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:290) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:295) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:303](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:303) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:305) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:305) | `textTransform` | `'capitalize'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:308) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:116) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:117) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:42](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:42) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:45](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:45) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:87) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:87) | `letterSpacing` | `0.8` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:218) | `lineHeight` | `27` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:218) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:223) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:224) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:226) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:231](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:231) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:234](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:234) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:239](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:239) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:241](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:241) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:242](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:242) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:246) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:247) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:251) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:252) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:252) | `letterSpacing` | `0.5` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:254) | `lineHeight` | `21` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:214](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:214) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:216) | `lineHeight` | `23` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:216) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:217](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:217) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:218) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:220) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:222) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:229) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:230](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:230) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:230](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:230) | `letterSpacing` | `0.6` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:346](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:346) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:347](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:347) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:349](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:349) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:354](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:354) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:360](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:360) | `lineHeight` | `18` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:361](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:361) | `lineHeight` | `18` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:363](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:363) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:368](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:368) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:370](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:370) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:371](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:371) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:371](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:371) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:372](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:372) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:376](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:376) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:377](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:377) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:381](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:381) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:382](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:382) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:382](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:382) | `letterSpacing` | `0.6` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:384](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:384) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:385](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:385) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:386](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:386) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:386](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:386) | `letterSpacing` | `0.6` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:261](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:261) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:261](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:261) | `letterSpacing` | `0.7` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:263) | `lineHeight` | `36` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:263) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:263) | `letterSpacing` | `-0.5` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:264](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:264) | `lineHeight` | `23` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:267) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:273) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:274) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:59) | `lineHeight` | `34` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:59) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:61](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:61) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:62](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:62) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:63](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:63) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:65](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:65) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:65](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:65) | `letterSpacing` | `0.6` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:66) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:67](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:67) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:68](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:68) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2029](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2029) | `letterSpacing` | `1.2` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2029](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2029) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2030](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2030) | `lineHeight` | `42` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2030](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2030) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2030](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2030) | `letterSpacing` | `-0.7` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2034](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2034) | `letterSpacing` | `1.1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2034](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2034) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2035](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2035) | `lineHeight` | `25` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2035](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2035) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2036](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2036) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2039](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2039) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2042](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2042) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2042](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2042) | `letterSpacing` | `0.9` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2043](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2043) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2043](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2043) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2044](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2044) | `lineHeight` | `21` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2046](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2046) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2047](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2047) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2050](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2050) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2053](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2053) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2056](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2056) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2059](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2059) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2060](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2060) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:55) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:55) | `letterSpacing` | `0.8` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:56](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:56) | `lineHeight` | `25` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:56](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:56) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:57) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:59) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:123) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:123) | `letterSpacing` | `0.9` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:124) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:124) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:125) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:128) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:128) | `letterSpacing` | `0.8` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:129) | `lineHeight` | `29` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:129) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:131) | `lineHeight` | `26` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:131) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:132) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:132) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:133) | `lineHeight` | `25` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:135) | `lineHeight` | `25` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:136) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:139) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:126) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:127) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:137) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:138](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:138) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:140) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:155](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:155) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:157](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:157) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:158](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:158) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:159](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:159) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:161](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:161) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:163](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:163) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:170](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:170) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:149](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:149) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:155](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:155) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:156) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:250) | `lineHeight` | `24` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:250) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:251) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:252) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:253) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:257](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:257) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:260) | `fontWeight` | `'900'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:260) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:265) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:265) | `letterSpacing` | `0.5` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:269) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:270) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:273) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:273) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:275](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:275) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:276](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:276) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:277](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:277) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:279) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:283](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:283) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:284) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:286](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:286) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:288) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:291) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `letterSpacing` | `0.4` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `letterSpacing` | `0.4` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:294) | `lineHeight` | `20` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:297) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:298) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:302) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:310](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:310) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:315](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:315) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:316](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:316) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:317](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:317) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:124) | `letterSpacing` | `1` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:124) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:126) | `lineHeight` | `27` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:126) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:127) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:128) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:132) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:133) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:135) | `textTransform` | `'uppercase'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:135) | `letterSpacing` | `0.7` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:135) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:136) | `lineHeight` | `19` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:102) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:102) | `letterSpacing` | `0.6` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:104](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:104) | `lineHeight` | `27` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:104](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:104) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:105) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:106](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:106) | `lineHeight` | `22` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:107](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:107) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:112) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:113](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:113) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:113](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:113) | `letterSpacing` | `0.5` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:114) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:116) | `textTransform` | `'uppercase'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:116) | `letterSpacing` | `0.7` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:116) | `fontWeight` | `'800'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:117) | `fontWeight` | `'700'` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:118](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:118) | `lineHeight` | `18` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:119) | `lineHeight` | `18` | Hårdkodat lokalt |

### 1.6 Dimensioner, ramar och tryckyterelaterade värden

Alla deklarationer visas, även token-/uttrycksreferenser, procent och nollvärden. Literal betyder lokalt numeriskt/strängvärde; strukturella dimensioner skiljs från spacing.

| Fil:rad | Egenskap | Värde/uttryck | Typ |
|---|---|---|---|
| [src/components/AppPrimitives.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:266) | `width` | `'100%'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:266) | `maxWidth` | `560` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:269) | `width` | `'100%'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:269) | `maxWidth` | `560` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:270) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:271) | `width` | `42` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:271) | `height` | `42` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `minHeight` | `56` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:280) | `minHeight` | `56` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:285](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:285) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:294) | `maxHeight` | `'85%'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:300) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:300) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:301) | `minHeight` | `52` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:302) | `minHeight` | `52` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:302) | `borderLeftWidth` | `1` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:307](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:307) | `width` | `'14.285%'` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:307](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:307) | `minHeight` | `42` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:309](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:309) | `maxHeight` | `300` | Hårdkodat lokalt |
| [src/components/AppPrimitives.tsx:310](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:310) | `borderBottomWidth` | `1` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:112) | `width` | `48` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:112) | `height` | `48` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `minHeight` | `70` | Hårdkodat lokalt |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/account/BetaInfoScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:41) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/account/SignInScreen.tsx:86](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:86) | `height` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:216) | `width` | `42` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:216) | `height` | `42` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:222) | `minHeight` | `44` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:228) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:228) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `minHeight` | `84` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:244](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:244) | `width` | `48` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:244](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:244) | `height` | `48` | Hårdkodat lokalt |
| [src/features/health/HealthHistoryScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:248) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:212](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:212) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:213) | `width` | `48` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:213) | `height` | `48` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:219) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:224) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226) | `width` | `42` | Hårdkodat lokalt |
| [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226) | `height` | `42` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:341](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:341) | `width` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:341](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:341) | `height` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:345](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:345) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:351](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:351) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:351](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:351) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:356](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:356) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:357](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:357) | `width` | `26` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:357](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:357) | `height` | `26` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:357](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:357) | `borderWidth` | `2` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `minHeight` | `84` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:374](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:374) | `width` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:374](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:374) | `height` | `48` | Hårdkodat lokalt |
| [src/features/health/PlannedHealthScreen.tsx:378](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:378) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `minHeight` | `68` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:270) | `width` | `'100%'` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:270) | `minHeight` | `60` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:271) | `minWidth` | `64` | Hårdkodat lokalt |
| [src/features/home/DevelopmentPreview.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:271) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `minHeight` | `110` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:58) | `width` | `52` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:58) | `height` | `52` | Hårdkodat lokalt |
| [src/features/home/PreviewHomeScreen.tsx:64](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:64) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2032](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2032) | `minHeight` | `176` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2037](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2037) | `width` | `'42%'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2037](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2037) | `height` | `'100%'` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2040](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2040) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2045](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2045) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2049](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2049) | `minHeight` | `68` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `minHeight` | `74` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2055](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2055) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2057](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2057) | `minHeight` | `68` | Hårdkodat lokalt |
| [src/features/home/ProductWorkspace.tsx:2058](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2058) | `minHeight` | `56` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/knowledge/DraftContentPreview.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:58) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `minHeight` | `76` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:126) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/knowledge/KnowledgeScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:137) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:125) | `minHeight` | `44` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:129) | `width` | `48` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:129) | `height` | `48` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `minHeight` | `72` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:131) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:134) | `width` | `27` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:134) | `height` | `27` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:134) | `borderWidth` | `2` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `minHeight` | `52` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/notifications/NotificationSettingsScreen.tsx:142](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:142) | `minHeight` | `48` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:153](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:153) | `width` | `56` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:153](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:153) | `height` | `56` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:160) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:166) | `minHeight` | `50` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:166) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:171) | `minHeight` | `54` | Hårdkodat lokalt |
| [src/features/onboarding/EditDogProfileScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:171) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:151) | `minHeight` | `52` | Hårdkodat lokalt |
| [src/features/onboarding/ProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:151) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:248) | `width` | `46` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:248) | `height` | `46` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `minHeight` | `78` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:255) | `width` | `42` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:255) | `height` | `42` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:258](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:258) | `width` | `26` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:258](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:258) | `height` | `26` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:258](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:258) | `borderWidth` | `2` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:263) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:266) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `width` | `36` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `height` | `36` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:272) | `width` | `68` | Hårdkodat lokalt |
| [src/features/passport/PassportScreen.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:274) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `flexBasis` | `'31%'` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `minHeight` | `80` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) | `width` | `34` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) | `height` | `34` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:287) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:288) | `width` | `52` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:290](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:290) | `minHeight` | `28` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `minHeight` | `44` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `minWidth` | `74` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `minHeight` | `92` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:313](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:313) | `height` | `8` | Hårdkodat lokalt |
| [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:121) | `height` | `148` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:125) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/PublishedTrainingScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:134) | `borderTopWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:103) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) | `borderWidth` | `1` | Hårdkodat lokalt |
| [src/features/training/TrainingScreen.tsx:115](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:115) | `borderTopWidth` | `1` | Hårdkodat lokalt |

### 1.7 HTML/PDF och SVG

PDF har ett separat hårdkodat CSS-system i passport-model.ts. CSS-px är inte native pt/dp. SVG-illustrationens koordinater och linjebredder är illustrationsgeometri, inte automatiskt komponent-spacing. Färgliteralerna ingår i färgtabellen ovan.

| Fil:rad | CSS-deklaration |
|---|---|
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-family:Arial,Helvetica,sans-serif` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `color:#1C3027` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `background:#F7F3EA` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin:32px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `line-height:1.45` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-size:28px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `color:#186A4D` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-bottom:3px solid #BFDCC9` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding-bottom:12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-size:19px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `color:#186A4D` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin:0 0 12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border:1px solid #D9DFD7` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-radius:14px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding:18px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin:16px 0` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `background:#FFF` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `background:#F1F6F2` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-color:#D2E5D8` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `gap:7px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `color:#536257` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-size:12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `gap:9px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding:10px 12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin-bottom:14px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-radius:12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `background:#EAF3EC` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `color:#186A4D` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-size:12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `width:54px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `height:54px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding-left:22px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin:0 0 12px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-bottom:1px solid #E5EBE5` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding-bottom:9px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `margin-top:24px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `padding-top:14px` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `border-top:1px solid #D9DFD7` |
| [src/features/passport/passport-model.ts:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/passport-model.ts:100) | `font-size:12px` |

## 2. Komponent- och variantinventering

### Översikt av komponentfamiljer

Alla exakta stildefinitioner och JSX-anropsställen finns i 2.1–2.3 nedan, med klickbara filsökvägar och radnummer.

| Familj | Befintliga varianter | Filsökväg |
|---|---|---|
| Gemensamma knappar | PrimaryButton: fylld/pressed/disabled; QuietButton: text/pressed/disabled. Laddning anges via titel/disabled hos anroparen, inte särskild loading-variant. | src/components/AppPrimitives.tsx |
| Väljare och stödhandlingar | Kalenderdagar, föregående/nästa månad, tidsval; InfoModal-stängning; feedback-stängning | src/components/AppPrimitives.tsx |
| Hem/navigation | Shortcut, MenuRow, BottomTabs aktiv/inaktiv; välkomst-, sammanfattnings-, profil- och innehållskort | src/features/home/ProductWorkspace.tsx |
| Snabblogg/lista | Sex quickButton-rutor, eventCard, editor, typval valt/ej valt, patternCard, gruppdatum | src/features/puppy-log/LogScreen.tsx |
| Hälsa | Viktkort/formulär, record, planned; historikrader, planrader, konflikt-/tomkort | src/features/health/HealthScreen.tsx; HealthHistoryScreen.tsx; PlannedHealthScreen.tsx |
| Träning | Programkort, öppna/dölj, steg/checkmark, genomfört-/vänteläge; preview har andra program-/stegkort | src/features/training/PublishedTrainingScreen.tsx; TrainingScreen.tsx |
| Kunskap | Artikelkort, källhandlingar, öppna/stäng läsning; separat utkastpreview | src/features/knowledge/KnowledgeScreen.tsx; DraftContentPreview.tsx |
| Pass | Hero, valrader, informationsrader, PDF-handlingar och förhandsgranskning; HTML-exportens sektioner | src/features/passport/PassportScreen.tsx; passport-model.ts |
| Konto/onboarding | Kontorader/hero, primär radering, Google/e-post-knappar, rasval valt/ej valt | src/features/account/AccountSettingsScreen.tsx; SignInScreen.tsx; src/features/onboarding/ProfileScreen.tsx; EditDogProfileScreen.tsx |
| Utvecklingspreview | Egna genvägar/hundkort, testhandlingar och syntetiska statusvarianter | src/features/home/DevelopmentPreview.tsx; src/features/home/PreviewHomeScreen.tsx; övriga preview-filer i detaljtabellerna |
| Ikoner | Ionicons med lokala storlekar/färger; fyllda/konturpar i bottenmeny. Loggen använder emoji/Unicode. Preview har textbaserad hundmarkör. PDF har egen inline-SVG-illustration. | Anropsställen i 2.3; LogScreen.tsx:269; PreviewHomeScreen.tsx; passport-model.ts |

### 2.1 Samtliga centrala och lokala StyleSheet-familjer

Varje style-definition som namnet kopplar till knapp, kort, lista/rad, ikon/chip, flik/navigation, formulär, status eller hero listas. Detta inkluderar tillstånd/textdelar; en style är inte nödvändigtvis en separat återanvändbar komponent. Fulla stylingvärden finns i avsnitt 1.

| Fil:rad | Style/familj | Deklaration |
|---|---|---|
| [src/components/AppPrimitives.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:271) | `brandMark` | `{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent, alignSelf: 'center' }` |
| [src/components/AppPrimitives.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:272) | `brandMarkText` | `{ color: theme.colors.onAccent, fontSize: 24, fontWeight: '800' }` |
| [src/components/AppPrimitives.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:273) | `brandName` | `{ color: theme.colors.accent, fontSize: 15, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center', marginTop: 7 }` |
| [src/components/AppPrimitives.tsx:277](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:277) | `fieldGroup` | `{ marginBottom: 18 }` |
| [src/components/AppPrimitives.tsx:278](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:278) | `fieldLabel` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8 }` |
| [src/components/AppPrimitives.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:279) | `input` | `{ minHeight: 56, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 }` |
| [src/components/AppPrimitives.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:280) | `button` | `{ minHeight: 56, borderRadius: theme.radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, backgroundColor: theme.colors.accent, marginTop: 10 }` |
| [src/components/AppPrimitives.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:281) | `buttonDisabled` | `{ opacity: 0.55 }` |
| [src/components/AppPrimitives.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:282) | `buttonPressed` | `{ backgroundColor: '#12543D', transform: [{ scale: 0.985 }] }` |
| [src/components/AppPrimitives.tsx:283](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:283) | `buttonReducedPressed` | `{ backgroundColor: '#12543D', opacity: 0.9 }` |
| [src/components/AppPrimitives.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:284) | `buttonText` | `{ color: theme.colors.onAccent, fontSize: 16, fontWeight: '800' }` |
| [src/components/AppPrimitives.tsx:285](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:285) | `quietButton` | `{ minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8 }` |
| [src/components/AppPrimitives.tsx:286](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:286) | `quietButtonPressed` | `{ opacity: 0.65 }` |
| [src/components/AppPrimitives.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:287) | `quietButtonReducedPressed` | `{ opacity: 0.7 }` |
| [src/components/AppPrimitives.tsx:288](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:288) | `quietButtonText` | `{ color: theme.colors.accent, fontSize: 15, fontWeight: '700' }` |
| [src/components/AppPrimitives.tsx:289](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:289) | `messageCard` | `{ padding: 16, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#EFE8DA', marginTop: 18 }` |
| [src/components/AppPrimitives.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:291) | `errorCard` | `{ borderColor: '#D5A5A0', backgroundColor: '#F7EAE7' }` |
| [src/components/AppPrimitives.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:293) | `modalBackdrop` | `{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0008' }` |
| [src/components/AppPrimitives.tsx:294](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:294) | `modalCard` | `{ maxHeight: '85%', padding: 20, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface }` |
| [src/components/AppPrimitives.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:295) | `modalTitle` | `{ color: theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: 12 }` |
| [src/components/AppPrimitives.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:296) | `modalScroll` | `{ flexShrink: 1 }` |
| [src/components/AppPrimitives.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:297) | `modalContent` | `{ paddingBottom: 8 }` |
| [src/components/AppPrimitives.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:298) | `feedbackCard` | `{ padding: 14, marginTop: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#EAF3EC' }` |
| [src/components/AppPrimitives.tsx:299](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:299) | `datePickerField` | `{ marginBottom: 18 }` |
| [src/components/AppPrimitives.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:300) | `datePickerRow` | `{ minHeight: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface }` |
| [src/components/AppPrimitives.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:301) | `datePickerInput` | `{ flex: 1, minHeight: 52, paddingHorizontal: 14, color: theme.colors.text, fontSize: 17 }` |
| [src/components/AppPrimitives.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:302) | `pickerButton` | `{ minHeight: 52, paddingHorizontal: 13, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: theme.colors.border }` |
| [src/components/AppPrimitives.tsx:303](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:303) | `pickerButtonText` | `{ color: theme.colors.accent, fontSize: 13, fontWeight: '800' }` |
| [src/components/AppPrimitives.tsx:304](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:304) | `calendarHeader` | `{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }` |
| [src/components/AppPrimitives.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:305) | `calendarMonth` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '800', textTransform: 'capitalize' }` |
| [src/components/AppPrimitives.tsx:306](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:306) | `calendarGrid` | `{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }` |
| [src/components/AppPrimitives.tsx:307](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:307) | `calendarDay` | `{ width: '14.285%', minHeight: 42, alignItems: 'center', justifyContent: 'center' }` |
| [src/components/AppPrimitives.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:308) | `calendarDayText` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }` |
| [src/components/AppPrimitives.tsx:310](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:310) | `timeOption` | `{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }` |
| [src/components/AppPrimitives.tsx:311](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:311) | `timeOptionText` | `{ color: theme.colors.text, fontSize: 17, textAlign: 'center' }` |
| [src/features/account/AccountSettingsScreen.tsx:111](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:111) | `hero` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, marginBottom: 12 }` |
| [src/features/account/AccountSettingsScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:112) | `icon` | `{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/account/AccountSettingsScreen.tsx:113](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:113) | `heroText` | `{ flex: 1 }` |
| [src/features/account/AccountSettingsScreen.tsx:114](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:114) | `row` | `{ minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface }` |
| [src/features/account/AccountSettingsScreen.tsx:115](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:115) | `rowCopy` | `{ flex: 1 }` |
| [src/features/account/AccountSettingsScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:116) | `rowTitle` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '800' }` |
| [src/features/account/AccountSettingsScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:117) | `rowDetail` | `{ color: theme.colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 4 }` |
| [src/features/account/BetaInfoScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:40) | `hero` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, marginBottom: 12 }` |
| [src/features/health/HealthHistoryScreen.tsx:214](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:214) | `section` | `{ marginTop: 28 }` |
| [src/features/health/HealthHistoryScreen.tsx:215](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:215) | `sectionHeading` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }` |
| [src/features/health/HealthHistoryScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:216) | `headingIcon` | `{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/health/HealthHistoryScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:218) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800' }` |
| [src/features/health/HealthHistoryScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:219) | `sectionBody` | `{ color: theme.colors.mutedText, fontSize: 14, marginTop: 2 }` |
| [src/features/health/HealthHistoryScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:220) | `infoRow` | `{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }` |
| [src/features/health/HealthHistoryScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:222) | `infoButton` | `{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 }` |
| [src/features/health/HealthHistoryScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:223) | `infoButtonText` | `{ color: theme.colors.accent, fontSize: 14, fontWeight: '700' }` |
| [src/features/health/HealthHistoryScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:225) | `formCard` | `{ marginTop: 18, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBFCFA' }` |
| [src/features/health/HealthHistoryScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:226) | `formTitle` | `{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 }` |
| [src/features/health/HealthHistoryScreen.tsx:233](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:233) | `field` | `{ marginBottom: 14 }` |
| [src/features/health/HealthHistoryScreen.tsx:234](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:234) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 }` |
| [src/features/health/HealthHistoryScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:235) | `dateInputWrap` | `{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/HealthHistoryScreen.tsx:236](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:236) | `dateInput` | `{ flex: 1, color: theme.colors.text, fontSize: 17, paddingVertical: 10 }` |
| [src/features/health/HealthHistoryScreen.tsx:237](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:237) | `noteInput` | `{ minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, textAlignVertical: 'top' }` |
| [src/features/health/HealthHistoryScreen.tsx:240](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:240) | `conflictCard` | `{ marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' }` |
| [src/features/health/HealthHistoryScreen.tsx:243](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:243) | `emptyCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 14, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border }` |
| [src/features/health/HealthHistoryScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:248) | `recordCard` | `{ marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/HealthHistoryScreen.tsx:249](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:249) | `recordHeading` | `{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }` |
| [src/features/health/HealthHistoryScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:250) | `recordType` | `{ flexDirection: 'row', alignItems: 'center', gap: 8 }` |
| [src/features/health/HealthHistoryScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:251) | `recordTitle` | `{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }` |
| [src/features/health/HealthHistoryScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:252) | `ownerLabel` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }` |
| [src/features/health/HealthHistoryScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:253) | `recordDate` | `{ color: theme.colors.mutedText, fontSize: 15, marginTop: 5 }` |
| [src/features/health/HealthHistoryScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:254) | `recordNote` | `{ color: theme.colors.text, fontSize: 15, lineHeight: 21, marginTop: 8 }` |
| [src/features/health/HealthHistoryScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:255) | `actions` | `{ flexDirection: 'row', gap: 8, marginTop: 9 }` |
| [src/features/health/HealthScreen.tsx:212](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:212) | `foundationCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17 }` |
| [src/features/health/HealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:213) | `iconCircle` | `{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/health/HealthScreen.tsx:216](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:216) | `cardTitle` | `{ color: theme.colors.text, fontSize: 17, lineHeight: 23, fontWeight: '800' }` |
| [src/features/health/HealthScreen.tsx:217](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:217) | `cardBody` | `{ color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 }` |
| [src/features/health/HealthScreen.tsx:218](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:218) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 14 }` |
| [src/features/health/HealthScreen.tsx:219](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:219) | `formCard` | `{ marginTop: 20, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/HealthScreen.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:220) | `formTitle` | `{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }` |
| [src/features/health/HealthScreen.tsx:221](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:221) | `field` | `{ marginBottom: 14 }` |
| [src/features/health/HealthScreen.tsx:222](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:222) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 }` |
| [src/features/health/HealthScreen.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:223) | `input` | `{ minHeight: 54, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 }` |
| [src/features/health/HealthScreen.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:224) | `recordCard` | `{ marginTop: 10, padding: 16, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/HealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:225) | `plannedCard` | `{ marginTop: 13, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F1F5F0' }` |
| [src/features/health/HealthScreen.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:226) | `plannedIcon` | `{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }` |
| [src/features/health/HealthScreen.tsx:228](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:228) | `recordHeading` | `{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }` |
| [src/features/health/HealthScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:229) | `recordWeight` | `{ color: theme.colors.text, fontSize: 21, fontWeight: '800' }` |
| [src/features/health/HealthScreen.tsx:230](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:230) | `ownerLabel` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }` |
| [src/features/health/HealthScreen.tsx:231](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:231) | `recordDate` | `{ color: theme.colors.mutedText, fontSize: 15, marginTop: 4 }` |
| [src/features/health/HealthScreen.tsx:232](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:232) | `actions` | `{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 }` |
| [src/features/health/PlannedHealthScreen.tsx:340](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:340) | `heroCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border }` |
| [src/features/health/PlannedHealthScreen.tsx:341](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:341) | `heroIcon` | `{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/health/PlannedHealthScreen.tsx:342](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:342) | `heroCopy` | `{ flex: 1 }` |
| [src/features/health/PlannedHealthScreen.tsx:343](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:343) | `infoRow` | `{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }` |
| [src/features/health/PlannedHealthScreen.tsx:345](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:345) | `infoButton` | `{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 }` |
| [src/features/health/PlannedHealthScreen.tsx:346](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:346) | `infoButtonText` | `{ color: theme.colors.accent, fontSize: 15, fontWeight: '700' }` |
| [src/features/health/PlannedHealthScreen.tsx:348](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:348) | `formCard` | `{ marginTop: 18, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBFCFA' }` |
| [src/features/health/PlannedHealthScreen.tsx:349](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:349) | `formTitle` | `{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 }` |
| [src/features/health/PlannedHealthScreen.tsx:357](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:357) | `reminderCheck` | `{ width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: theme.colors.mutedText, alignItems: 'center', justifyContent: 'center' }` |
| [src/features/health/PlannedHealthScreen.tsx:358](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:358) | `reminderCheckSelected` | `{ backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }` |
| [src/features/health/PlannedHealthScreen.tsx:361](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:361) | `reminderRow` | `{ color: theme.colors.mutedText, fontSize: 13, lineHeight: 18, marginTop: 5 }` |
| [src/features/health/PlannedHealthScreen.tsx:362](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:362) | `field` | `{ marginBottom: 14 }` |
| [src/features/health/PlannedHealthScreen.tsx:363](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:363) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 }` |
| [src/features/health/PlannedHealthScreen.tsx:364](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:364) | `dateInputWrap` | `{ minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/PlannedHealthScreen.tsx:365](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:365) | `dateInput` | `{ flex: 1, color: theme.colors.text, fontSize: 17, paddingVertical: 10 }` |
| [src/features/health/PlannedHealthScreen.tsx:366](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:366) | `noteInput` | `{ minHeight: 84, paddingHorizontal: 14, paddingVertical: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, textAlignVertical: 'top' }` |
| [src/features/health/PlannedHealthScreen.tsx:369](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:369) | `conflictCard` | `{ marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' }` |
| [src/features/health/PlannedHealthScreen.tsx:373](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:373) | `emptyCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 14, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border }` |
| [src/features/health/PlannedHealthScreen.tsx:378](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:378) | `recordCard` | `{ marginTop: 10, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/health/PlannedHealthScreen.tsx:379](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:379) | `recordHeading` | `{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }` |
| [src/features/health/PlannedHealthScreen.tsx:380](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:380) | `recordType` | `{ flexDirection: 'row', alignItems: 'center', gap: 8 }` |
| [src/features/health/PlannedHealthScreen.tsx:381](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:381) | `recordTitle` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }` |
| [src/features/health/PlannedHealthScreen.tsx:382](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:382) | `timingLabel` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }` |
| [src/features/health/PlannedHealthScreen.tsx:383](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:383) | `overdueLabel` | `{ color: '#936324' }` |
| [src/features/health/PlannedHealthScreen.tsx:384](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:384) | `recordDate` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '700', marginTop: 7 }` |
| [src/features/health/PlannedHealthScreen.tsx:385](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:385) | `recordNote` | `{ color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 }` |
| [src/features/health/PlannedHealthScreen.tsx:386](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:386) | `ownerLabel` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginTop: 8 }` |
| [src/features/health/PlannedHealthScreen.tsx:387](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:387) | `actions` | `{ flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: 8 }` |
| [src/features/home/DevelopmentPreview.tsx:265](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:265) | `menuItem` | `{ minHeight: 68, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }` |
| [src/features/home/DevelopmentPreview.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:266) | `menuCopy` | `{ flex: 1 }` |
| [src/features/home/DevelopmentPreview.tsx:267](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:267) | `menuTitle` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }` |
| [src/features/home/DevelopmentPreview.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:268) | `menuDescription` | `{ color: theme.colors.mutedText, fontSize: 13, marginTop: 4 }` |
| [src/features/home/DevelopmentPreview.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:270) | `tabBar` | `{ width: '100%', minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingVertical: 5 }` |
| [src/features/home/DevelopmentPreview.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:271) | `tab` | `{ minWidth: 64, minHeight: 48, borderRadius: 16, flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 }` |
| [src/features/home/DevelopmentPreview.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:272) | `selectedTab` | `{ backgroundColor: '#E5EFE8' }` |
| [src/features/home/DevelopmentPreview.tsx:273](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:273) | `tabLabel` | `{ color: theme.colors.mutedText, fontSize: 12, fontWeight: '700' }` |
| [src/features/home/DevelopmentPreview.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:274) | `selectedTabLabel` | `{ color: theme.colors.accent, fontWeight: '800' }` |
| [src/features/home/PreviewHomeScreen.tsx:57](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:57) | `dogCard` | `{ minHeight: 110, borderRadius: theme.radius.card, backgroundColor: theme.colors.accent, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 30 }` |
| [src/features/home/PreviewHomeScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:58) | `dogIcon` | `{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2B805F' }` |
| [src/features/home/PreviewHomeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:59) | `dogIconText` | `{ color: '#FFF0D2', fontSize: 29, lineHeight: 34, fontWeight: '700' }` |
| [src/features/home/PreviewHomeScreen.tsx:63](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:63) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 21, fontWeight: '800' }` |
| [src/features/home/PreviewHomeScreen.tsx:64](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:64) | `trainingShortcut` | `{ borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, marginTop: 14 }` |
| [src/features/home/PreviewHomeScreen.tsx:65](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:65) | `shortcutEyebrow` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }` |
| [src/features/home/PreviewHomeScreen.tsx:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:66) | `shortcutTitle` | `{ color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 8 }` |
| [src/features/home/PreviewHomeScreen.tsx:67](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:67) | `shortcutDetail` | `{ color: theme.colors.mutedText, fontSize: 14, lineHeight: 20, marginTop: 5 }` |
| [src/features/home/PreviewHomeScreen.tsx:68](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:68) | `shortcutProgress` | `{ color: theme.colors.accent, fontSize: 12, fontWeight: '700', marginTop: 8 }` |
| [src/features/home/ProductWorkspace.tsx:2029](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2029) | `eyebrow` | `{ color: theme.colors.accent, fontSize: 11, letterSpacing: 1.2, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2032](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2032) | `welcomeCard` | `{ minHeight: 176, flexDirection: 'row', overflow: 'hidden', borderRadius: theme.radius.card, backgroundColor: '#E8E3D6', marginBottom: 26 }` |
| [src/features/home/ProductWorkspace.tsx:2034](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2034) | `welcomeEyebrow` | `{ color: theme.colors.accent, fontSize: 10, letterSpacing: 1.1, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2038](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2038) | `sectionHeading` | `{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 10 }` |
| [src/features/home/ProductWorkspace.tsx:2039](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2039) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2040](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2040) | `contentCard` | `{ borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17, marginTop: 8 }` |
| [src/features/home/ProductWorkspace.tsx:2041](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2041) | `contentCardHeading` | `{ flexDirection: 'row', alignItems: 'center', gap: 7 }` |
| [src/features/home/ProductWorkspace.tsx:2042](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2042) | `cardEyebrow` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.9, marginBottom: 7 }` |
| [src/features/home/ProductWorkspace.tsx:2045](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2045) | `summaryCard` | `{ borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 16, marginTop: 8 }` |
| [src/features/home/ProductWorkspace.tsx:2046](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2046) | `summaryTitle` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2047](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2047) | `summaryText` | `{ color: theme.colors.mutedText, fontSize: 15, lineHeight: 22 }` |
| [src/features/home/ProductWorkspace.tsx:2048](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2048) | `shortcuts` | `{ flexDirection: 'row', gap: 9, marginTop: 20 }` |
| [src/features/home/ProductWorkspace.tsx:2049](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2049) | `shortcut` | `{ flex: 1, minHeight: 68, borderRadius: theme.radius.button, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center', gap: 5 }` |
| [src/features/home/ProductWorkspace.tsx:2050](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2050) | `shortcutLabel` | `{ color: theme.colors.accent, fontSize: 12, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2051](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2051) | `menuRow` | `{ minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, marginBottom: 10 }` |
| [src/features/home/ProductWorkspace.tsx:2052](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2052) | `menuCopy` | `{ flex: 1 }` |
| [src/features/home/ProductWorkspace.tsx:2053](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2053) | `menuTitle` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }` |
| [src/features/home/ProductWorkspace.tsx:2054](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2054) | `menuDetail` | `{ color: theme.colors.mutedText, fontSize: 13, marginTop: 3 }` |
| [src/features/home/ProductWorkspace.tsx:2055](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2055) | `profileCard` | `{ borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 18, borderColor: theme.colors.border, borderWidth: 1 }` |
| [src/features/home/ProductWorkspace.tsx:2057](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2057) | `bottomNavigation` | `{ minHeight: 68, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 8, paddingTop: 5, paddingBottom: 4 }` |
| [src/features/home/ProductWorkspace.tsx:2058](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2058) | `tab` | `{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14 }` |
| [src/features/home/ProductWorkspace.tsx:2059](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2059) | `tabLabel` | `{ color: theme.colors.mutedText, fontSize: 11, fontWeight: '700', marginTop: 3 }` |
| [src/features/home/ProductWorkspace.tsx:2060](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:2060) | `selectedTabLabel` | `{ color: theme.colors.accent, fontWeight: '800' }` |
| [src/features/knowledge/DraftContentPreview.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:54) | `card` | `{ padding: 16, marginTop: 13, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' }` |
| [src/features/knowledge/DraftContentPreview.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:55) | `eyebrow` | `{ color: '#785716', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:120](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:120) | `guideRow` | `{ minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 15, paddingVertical: 12 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:121) | `guideRowSelected` | `{ borderColor: theme.colors.accent, backgroundColor: '#E8EFE8' }` |
| [src/features/knowledge/KnowledgeScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:125) | `selectedLabel` | `{ color: theme.colors.accent, fontSize: 12, fontWeight: '800' }` |
| [src/features/knowledge/KnowledgeScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:126) | `articleCard` | `{ borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 18, marginTop: 14 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:127](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:127) | `articleEyebrowRow` | `{ flexDirection: 'row', alignItems: 'center', gap: 7 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:128) | `articleEyebrow` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:135) | `bodyListItem` | `{ color: theme.colors.text, fontSize: 16, lineHeight: 25, marginTop: 6 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:136) | `sourcesHeading` | `{ color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 6 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:137) | `sourceRow` | `{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingVertical: 9 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:138](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:138) | `sourceCopy` | `{ flex: 1 }` |
| [src/features/knowledge/KnowledgeScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:139) | `sourceText` | `{ color: theme.colors.mutedText, fontSize: 14, lineHeight: 20 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:123) | `infoRow` | `{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:125) | `infoButton` | `{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:126) | `infoButtonText` | `{ color: theme.colors.accent, fontSize: 14, fontWeight: '700' }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:128) | `hero` | `{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:129) | `icon` | `{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:130) | `heroCopy` | `{ flex: 1 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:134) | `checkbox` | `{ width: 27, height: 27, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.mutedText, alignItems: 'center', justifyContent: 'center' }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:135) | `checkboxSelected` | `{ backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:139) | `field` | `{ marginTop: 16 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:140) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:141) | `timeInputWrap` | `{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.button, backgroundColor: theme.colors.surface }` |
| [src/features/notifications/NotificationSettingsScreen.tsx:142](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:142) | `timeInput` | `{ flex: 1, minHeight: 48, fontSize: 17, color: theme.colors.text }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:151) | `heroCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 16, borderRadius: theme.radius.card, backgroundColor: '#F1F5F0', borderWidth: 1, borderColor: theme.colors.border }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:152](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:152) | `heroCopy` | `{ flex: 1 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:153](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:153) | `heroImage` | `{ width: 56, height: 56, borderRadius: 28 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:156) | `conflictCard` | `{ marginTop: 12, padding: 15, borderRadius: theme.radius.card, borderWidth: 1, borderColor: '#D6C59B', backgroundColor: '#FBF6EA' }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:160) | `formCard` | `{ marginTop: 17, padding: 17, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:161](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:161) | `formTitle` | `{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 15 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:162](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:162) | `field` | `{ marginBottom: 14 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:163](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:163) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 7 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:164) | `input` | `{ minHeight: 54, paddingHorizontal: 14, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17 }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:166) | `breedOption` | `{ minHeight: 50, borderRadius: theme.radius.button, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }` |
| [src/features/onboarding/EditDogProfileScreen.tsx:172](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:172) | `dateInput` | `{ flex: 1, paddingVertical: 10, color: theme.colors.text, fontSize: 17 }` |
| [src/features/onboarding/ProfileScreen.tsx:149](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:149) | `label` | `{ color: theme.colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 2 }` |
| [src/features/onboarding/ProfileScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:151) | `breedOption` | `{ minHeight: 52, borderRadius: theme.radius.button, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }` |
| [src/features/onboarding/ProfileScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:156) | `checkmark` | `{ color: theme.colors.accent, fontSize: 19, fontWeight: '800' }` |
| [src/features/passport/PassportScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:247) | `heroCard` | `{ flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: theme.radius.card, backgroundColor: '#E8EFE8', padding: 16 }` |
| [src/features/passport/PassportScreen.tsx:248](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:248) | `heroIcon` | `{ width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }` |
| [src/features/passport/PassportScreen.tsx:249](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:249) | `heroCopy` | `{ flex: 1 }` |
| [src/features/passport/PassportScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:250) | `heroTitle` | `{ color: theme.colors.text, fontSize: 18, lineHeight: 24, fontWeight: '800' }` |
| [src/features/passport/PassportScreen.tsx:253](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:253) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 23, marginBottom: 10 }` |
| [src/features/passport/PassportScreen.tsx:254](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:254) | `selectionRow` | `{ minHeight: 78, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 11 }` |
| [src/features/passport/PassportScreen.tsx:255](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:255) | `selectionIcon` | `{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/passport/PassportScreen.tsx:256](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:256) | `selectionCopy` | `{ flex: 1 }` |
| [src/features/passport/PassportScreen.tsx:257](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:257) | `selectionTitle` | `{ color: theme.colors.text, fontSize: 16, fontWeight: '800' }` |
| [src/features/passport/PassportScreen.tsx:258](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:258) | `checkbox` | `{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }` |
| [src/features/passport/PassportScreen.tsx:259](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:259) | `checkboxChecked` | `{ backgroundColor: theme.colors.accent }` |
| [src/features/passport/PassportScreen.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:260) | `checkmark` | `{ color: theme.colors.accent, fontWeight: '900', fontSize: 17, lineHeight: 19 }` |
| [src/features/passport/PassportScreen.tsx:261](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:261) | `checkmarkChecked` | `{ color: theme.colors.onAccent }` |
| [src/features/passport/PassportScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:263) | `previewCard` | `{ borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, padding: 17, marginTop: 22 }` |
| [src/features/passport/PassportScreen.tsx:266](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:266) | `snapshotSection` | `{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 12 }` |
| [src/features/passport/PassportScreen.tsx:268](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:268) | `illustrationMark` | `{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accent, color: theme.colors.onAccent, textAlign: 'center', textAlignVertical: 'center', fontSize: 22, fontWeight: '800' }` |
| [src/features/passport/PassportScreen.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:269) | `illustrationLabel` | `{ flex: 1, color: theme.colors.accent, fontSize: 12, fontWeight: '800' }` |
| [src/features/passport/PassportScreen.tsx:271](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:271) | `previewValueRow` | `{ flexDirection: 'row', gap: 12, marginTop: 5 }` |
| [src/features/passport/PassportScreen.tsx:272](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:272) | `previewLabel` | `{ width: 68, color: theme.colors.mutedText, fontSize: 15 }` |
| [src/features/passport/PassportScreen.tsx:274](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:274) | `historyRow` | `{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 7, marginTop: 7 }` |
| [src/features/puppy-log/LogScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:279) | `sectionTitle` | `{ color: theme.colors.text, fontSize: 19, fontWeight: '800', marginTop: 2, marginBottom: 12 }` |
| [src/features/puppy-log/LogScreen.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:280) | `quickGrid` | `{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }` |
| [src/features/puppy-log/LogScreen.tsx:281](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:281) | `quickButton` | `{ flexBasis: '31%', flexGrow: 1, minHeight: 80, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) | `quickMark` | `{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#E4EEF4', alignItems: 'center', justifyContent: 'center' }` |
| [src/features/puppy-log/LogScreen.tsx:283](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:283) | `quickMarkText` | `{ color: theme.colors.accent, fontSize: 19, fontWeight: '800' }` |
| [src/features/puppy-log/LogScreen.tsx:284](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:284) | `quickLabel` | `{ color: theme.colors.text, fontSize: 13, fontWeight: '700', marginTop: 6 }` |
| [src/features/puppy-log/LogScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:287) | `eventCard` | `{ flexDirection: 'row', alignItems: 'flex-start', borderRadius: theme.radius.button, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:290](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:290) | `eventTitleRow` | `{ minHeight: 28, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:292](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:292) | `exampleLabel` | `{ color: '#785716', backgroundColor: '#F5E7BF', fontSize: 9, fontWeight: '800', letterSpacing: 0.4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:293](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:293) | `testLabel` | `{ color: theme.colors.accent, backgroundColor: '#E5EFE8', fontSize: 9, fontWeight: '800', letterSpacing: 0.4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:295](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:295) | `eventActions` | `{ flexDirection: 'row', alignSelf: 'flex-start', gap: 4, marginLeft: -12, marginTop: 2 }` |
| [src/features/puppy-log/LogScreen.tsx:296](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:296) | `editor` | `{ backgroundColor: '#F0E9DC', borderRadius: theme.radius.card, padding: 16, marginTop: 22, marginBottom: 24 }` |
| [src/features/puppy-log/LogScreen.tsx:297](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:297) | `editorTitle` | `{ color: theme.colors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 }` |
| [src/features/puppy-log/LogScreen.tsx:298](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:298) | `fieldTitle` | `{ color: theme.colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:299](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:299) | `typeGrid` | `{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }` |
| [src/features/puppy-log/LogScreen.tsx:300](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:300) | `typeOption` | `{ minHeight: 44, minWidth: 74, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 8 }` |
| [src/features/puppy-log/LogScreen.tsx:301](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:301) | `selectedTypeOption` | `{ borderColor: theme.colors.accent, backgroundColor: '#E5EFE8' }` |
| [src/features/puppy-log/LogScreen.tsx:302](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:302) | `typeOptionText` | `{ color: theme.colors.text, fontSize: 13, fontWeight: '700' }` |
| [src/features/puppy-log/LogScreen.tsx:304](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:304) | `dateTimeRow` | `{ flexDirection: 'row', gap: 10 }` |
| [src/features/puppy-log/LogScreen.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:305) | `dateField` | `{ flex: 1.4 }` |
| [src/features/puppy-log/LogScreen.tsx:306](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:306) | `timeField` | `{ flex: 0.8 }` |
| [src/features/puppy-log/LogScreen.tsx:308](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:308) | `noteInput` | `{ minHeight: 92, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 16, lineHeight: 22, padding: 12, textAlignVertical: 'top' }` |
| [src/features/puppy-log/LogScreen.tsx:314](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:314) | `patternCard` | `{ marginTop: 16, padding: 14, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F1F5F0' }` |
| [src/features/puppy-log/LogScreen.tsx:317](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:317) | `patternRow` | `{ color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 7 }` |
| [src/features/training/PublishedTrainingScreen.tsx:121](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:121) | `hero` | `{ height: 148, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: theme.radius.card, marginBottom: 10 }` |
| [src/features/training/PublishedTrainingScreen.tsx:122](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:122) | `heroImage` | `{ borderRadius: theme.radius.card }` |
| [src/features/training/PublishedTrainingScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:123) | `heroCaption` | `{ alignSelf: 'flex-start', margin: 12, borderRadius: 14, backgroundColor: 'rgba(255,250,240,0.92)', paddingHorizontal: 11, paddingVertical: 7 }` |
| [src/features/training/PublishedTrainingScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:124) | `heroText` | `{ color: theme.colors.accent, fontSize: 10, letterSpacing: 1, fontWeight: '800' }` |
| [src/features/training/PublishedTrainingScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:125) | `programCard` | `{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 16, marginTop: 20 }` |
| [src/features/training/PublishedTrainingScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:128) | `progress` | `{ color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 14 }` |
| [src/features/training/PublishedTrainingScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:130) | `stepCard` | `{ borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBF8F1', padding: 14, marginBottom: 10 }` |
| [src/features/training/PublishedTrainingScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:134) | `sources` | `{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 13, marginTop: 14 }` |
| [src/features/training/PublishedTrainingScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:135) | `sourceHeading` | `{ color: theme.colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' }` |
| [src/features/training/PublishedTrainingScreen.tsx:136](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:136) | `sourceText` | `{ color: theme.colors.accent, fontSize: 13, lineHeight: 19, marginTop: 6 }` |
| [src/features/training/TrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:101) | `previewLabel` | `{ alignSelf: 'flex-start', borderRadius: 20, backgroundColor: '#E5EFE8', paddingHorizontal: 11, paddingVertical: 7 }` |
| [src/features/training/TrainingScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:102) | `previewLabelText` | `{ color: theme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }` |
| [src/features/training/TrainingScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:103) | `programCard` | `{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface, padding: 16, marginTop: 20 }` |
| [src/features/training/TrainingScreen.tsx:107](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:107) | `progress` | `{ color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 14 }` |
| [src/features/training/TrainingScreen.tsx:109](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:109) | `stepCard` | `{ borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#FBF8F1', padding: 14, marginBottom: 10 }` |
| [src/features/training/TrainingScreen.tsx:115](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:115) | `sourceCard` | `{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 13, marginTop: 14 }` |
| [src/features/training/TrainingScreen.tsx:116](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:116) | `sourceLabel` | `{ color: theme.colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' }` |
| [src/features/training/TrainingScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:117) | `sourceTitle` | `{ color: theme.colors.text, fontSize: 14, fontWeight: '700', marginTop: 5 }` |
| [src/features/training/TrainingScreen.tsx:118](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:118) | `sourceUrl` | `{ color: theme.colors.accent, fontSize: 12, lineHeight: 18, marginTop: 4 }` |

### 2.2 Alla anropsställen för knappar/kort/rader och andra interaktiva familjer

Listan visar anropsställe och konkreta props. JSX-villkor och map-loopar påverkar om och hur många element som renderas; tabellen är ingen samtidig knappberäkning.

| Fil:rad | Element | Props |
|---|---|---|
| [src/components/AppPrimitives.tsx:46](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:46) | `Pressable` | `accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && !disabled && (reduceMotion ? styles.buttonReducedPressed : styles.buttonPressed)]}` |
| [src/components/AppPrimitives.tsx:61](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:61) | `Pressable` | `accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.quietButton, pressed && !disabled && (reduceMotion ? styles.quietButtonReducedPressed : styles.quietButtonPressed)]}` |
| [src/components/AppPrimitives.tsx:152](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:152) | `Modal` | `visible={visible} transparent animationType={reduceMotion &#124;&#124; Platform.OS === 'android' ? 'none' : 'fade'} onShow={() => focusAccessibilityNode(headingRef)} onRequestClose={onClose} onDismiss={onDismiss} accessibilityViewIsModal` |
| [src/components/AppPrimitives.tsx:165](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:165) | `QuietButton` | `title="Stäng information" onPress={onClose}` |
| [src/components/AppPrimitives.tsx:195](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:195) | `QuietButton` | `title="Stäng status" onPress={onClose}` |
| [src/components/AppPrimitives.tsx:215](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:215) | `Pressable` | `accessibilityRole="button" accessibilityLabel={&#96;Välj ${label.toLowerCase()} i kalender&#96;} disabled={disabled} onPress={() => { const next = parseDateValue(value); if (next) setMonth(new Date(next.getFullYear(), next.getMonth(), 1)); setVisible(true); }} style={styles.pickerButton}` |
| [src/components/AppPrimitives.tsx:220](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:220) | `Modal` | `visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}` |
| [src/components/AppPrimitives.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:223) | `QuietButton` | `title="Föregående" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}` |
| [src/components/AppPrimitives.tsx:223](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:223) | `QuietButton` | `title="Nästa" onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}` |
| [src/components/AppPrimitives.tsx:224](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:224) | `Pressable` | `key={&#96;${day}-${index}&#96;} accessibilityRole="button" accessibilityLabel={formatDateValue(day)} onPress={() => { onChangeText(formatDateValue(day)); setVisible(false); }} style={styles.calendarDay}` |
| [src/components/AppPrimitives.tsx:226](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:226) | `QuietButton` | `title="Stäng kalender" onPress={() => setVisible(false)}` |
| [src/components/AppPrimitives.tsx:244](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:244) | `Pressable` | `accessibilityRole="button" accessibilityLabel={&#96;Välj ${label.toLowerCase()} från tider&#96;} disabled={disabled} onPress={() => setVisible(true)} style={styles.pickerButton}` |
| [src/components/AppPrimitives.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:246) | `Modal` | `visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}` |
| [src/components/AppPrimitives.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:246) | `Pressable` | `key={time} accessibilityRole="button" onPress={() => { onChangeText(time); setVisible(false); }} style={styles.timeOption}` |
| [src/components/AppPrimitives.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:246) | `QuietButton` | `title="Stäng tider" onPress={() => setVisible(false)}` |
| [src/features/account/AccountSettingsScreen.tsx:70](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:70) | `QuietButton` | `title="Tillbaka till Mer" disabled={busy} onPress={onBack}` |
| [src/features/account/AccountSettingsScreen.tsx:80](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:80) | `Pressable` | `accessibilityRole="button" onPress={onOpenInformation} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}` |
| [src/features/account/AccountSettingsScreen.tsx:85](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:85) | `Pressable` | `accessibilityRole="button" onPress={() => { void openSupport(); }} disabled={busy} style={({ pressed }) => [styles.row, pressed && styles.pressed]}` |
| [src/features/account/AccountSettingsScreen.tsx:90](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:90) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:92](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:92) | `MessageCard` | `` |
| [src/features/account/AccountSettingsScreen.tsx:93](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:93) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:94](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:94) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:95](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:95) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:96](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:96) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:97](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:97) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:98](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:98) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:99](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:99) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:100) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:101) | `MessageCard` | `tone="error"` |
| [src/features/account/AccountSettingsScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:103) | `PrimaryButton` | `title={busy ? 'Raderar konto…' : 'Radera konto'} disabled={busy &#124;&#124; !markerReady &#124;&#124; markerState !== 'clear' &#124;&#124; terminal &#124;&#124; status === 'unavailable'} onPress={confirmDeletion}` |
| [src/features/account/AccountSettingsScreen.tsx:106](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:106) | `QuietButton` | `title="Logga ut på den här enheten" disabled={busy} onPress={() => { void onSignOutLocally(); }}` |
| [src/features/account/AuthCallbackScreen.tsx:18](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AuthCallbackScreen.tsx:18) | `PrimaryButton` | `title="Till Hem" onPress={() => router.replace('/')}` |
| [src/features/account/AuthCallbackScreen.tsx:65](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AuthCallbackScreen.tsx:65) | `MessageCard` | `` |
| [src/features/account/AuthCallbackScreen.tsx:66](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AuthCallbackScreen.tsx:66) | `PrimaryButton` | `title="Till inloggningen" onPress={() => { cancelGoogleSignIn(); router.replace('/'); }}` |
| [src/features/account/BetaInfoScreen.tsx:18](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:18) | `QuietButton` | `title="Tillbaka till konto" onPress={onBack}` |
| [src/features/account/BetaInfoScreen.tsx:23](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:23) | `MessageCard` | `` |
| [src/features/account/BetaInfoScreen.tsx:24](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:24) | `MessageCard` | `` |
| [src/features/account/BetaInfoScreen.tsx:25](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:25) | `MessageCard` | `` |
| [src/features/account/BetaInfoScreen.tsx:30](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:30) | `Pressable` | `accessibilityRole="link" accessibilityLabel="E-post till Tassla support: erimali.ab@gmail.com" onPress={() => { void openEmail(); }} style={({ pressed }) => [styles.email, pressed && styles.pressed]}` |
| [src/features/account/BetaInfoScreen.tsx:35](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:35) | `MessageCard` | `tone="error"` |
| [src/features/account/SignInScreen.tsx:53](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:53) | `MessageCard` | `tone="error"` |
| [src/features/account/SignInScreen.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:54) | `PrimaryButton` | `title={busy ? 'Öppnar Google…' : 'Fortsätt med Google'} disabled={busy &#124;&#124; googlePending &#124;&#124; status === 'unavailable'} onPress={() => { void requestGoogle(); }}` |
| [src/features/account/SignInScreen.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:55) | `MessageCard` | `` |
| [src/features/account/SignInScreen.tsx:56](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:56) | `PrimaryButton` | `title="Avbryt Google-inloggning" onPress={cancelGoogleSignIn}` |
| [src/features/account/SignInScreen.tsx:74](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:74) | `PrimaryButton` | `title={busy ? 'Skickar länk…' : 'Skicka inloggningslänk'} disabled={!validEmail &#124;&#124; busy &#124;&#124; googlePending &#124;&#124; status === 'unavailable'} onPress={() => { void requestLink(); }}` |
| [src/features/account/SignInScreen.tsx:75](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:75) | `MessageCard` | `` |
| [src/features/account/SignInScreen.tsx:76](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:76) | `MessageCard` | `tone="error"` |
| [src/features/account/SignInScreen.tsx:77](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:77) | `MessageCard` | `` |
| [src/features/account/SignInScreen.tsx:78](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:78) | `MessageCard` | `tone="error"` |
| [src/features/account/SignInScreen.tsx:79](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:79) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthHistoryScreen.tsx:117](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:117) | `Pressable` | `accessibilityRole="button" accessibilityLabel="Visa information om hälsans historik" onPress={() => setInfoVisible(true)} style={styles.infoButton}` |
| [src/features/health/HealthHistoryScreen.tsx:122](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:122) | `InfoModal` | `visible={infoVisible} title="Om hälsans historik" onClose={() => setInfoVisible(false)}` |
| [src/features/health/HealthHistoryScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:128) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthHistoryScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:129) | `PrimaryButton` | `title={pending ? 'Kontrollera status' : 'Försök igen'} disabled={busy} onPress={() => onRetry?.()}` |
| [src/features/health/HealthHistoryScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:137) | `PrimaryButton` | `title="Använd aktuell historik och börja om" disabled={busy} onPress={resolveConflict}` |
| [src/features/health/HealthHistoryScreen.tsx:139](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:139) | `MessageCard` | `` |
| [src/features/health/HealthHistoryScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:141) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthHistoryScreen.tsx:142](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:142) | `PrimaryButton` | `title="Försök igen" disabled={busy} onPress={() => onRetry?.()}` |
| [src/features/health/HealthHistoryScreen.tsx:146](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:146) | `MessageCard` | `` |
| [src/features/health/HealthHistoryScreen.tsx:155](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:155) | `DatePickerField` | `label="Datum" disabled={blocked} onChangeText={setDate} value={date}` |
| [src/features/health/HealthHistoryScreen.tsx:163](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:163) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthHistoryScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:164) | `PrimaryButton` | `title={busy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara händelse'} disabled={blocked} onPress={() => { void save(); }}` |
| [src/features/health/HealthHistoryScreen.tsx:165](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:165) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/health/HealthHistoryScreen.tsx:166](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:166) | `QuietButton` | `title="Avbryt rättning" disabled={blocked} onPress={resetForm}` |
| [src/features/health/HealthHistoryScreen.tsx:190](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:190) | `QuietButton` | `title="Ändra" disabled={blocked} onPress={() => edit(record)}` |
| [src/features/health/HealthHistoryScreen.tsx:191](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:191) | `QuietButton` | `title="Radera" disabled={blocked} onPress={() => confirmDelete(record)}` |
| [src/features/health/HealthHistoryScreen.tsx:202](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:202) | `Pressable` | `accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && styles.typeChoiceSelected, pressed && !disabled && styles.typeChoicePressed]}` |
| [src/features/health/HealthScreen.tsx:119](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:119) | `QuietButton` | `title="Tillbaka till Mer" onPress={onBack}` |
| [src/features/health/HealthScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:128) | `MessageCard` | `` |
| [src/features/health/HealthScreen.tsx:134](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:134) | `QuietButton` | `title="Tillbaka till Mer" onPress={onBack}` |
| [src/features/health/HealthScreen.tsx:137](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:137) | `MessageCard` | `` |
| [src/features/health/HealthScreen.tsx:146](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:146) | `PrimaryButton` | `title="Öppna planer" onPress={onOpenPlannedHealth}` |
| [src/features/health/HealthScreen.tsx:148](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:148) | `MessageCard` | `` |
| [src/features/health/HealthScreen.tsx:150](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:150) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthScreen.tsx:151](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:151) | `PrimaryButton` | `title="Försök igen" disabled={isBusy} onPress={() => onRetry?.()}` |
| [src/features/health/HealthScreen.tsx:155](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:155) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:156) | `PrimaryButton` | `title="Kontrollera status" disabled={isBusy} onPress={() => onRetryPending?.()}` |
| [src/features/health/HealthScreen.tsx:158](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:158) | `MessageCard` | `` |
| [src/features/health/HealthScreen.tsx:161](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:161) | `DatePickerField` | `label="Datum" disabled={isBlocked} onChangeText={setDate} value={date}` |
| [src/features/health/HealthScreen.tsx:177](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:177) | `MessageCard` | `tone="error"` |
| [src/features/health/HealthScreen.tsx:178](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:178) | `PrimaryButton` | `title={isBusy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara vikt'} disabled={isBlocked} onPress={() => { void save(); }}` |
| [src/features/health/HealthScreen.tsx:179](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:179) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/health/HealthScreen.tsx:180](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:180) | `QuietButton` | `title="Avbryt rättning" disabled={isBlocked} onPress={cancelEditing}` |
| [src/features/health/HealthScreen.tsx:183](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:183) | `MessageCard` | `` |
| [src/features/health/HealthScreen.tsx:192](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:192) | `QuietButton` | `title="Ändra" disabled={isBlocked} onPress={() => startEditing(record)}` |
| [src/features/health/HealthScreen.tsx:193](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:193) | `QuietButton` | `title="Radera" disabled={isBlocked} onPress={() => confirmDelete(record)}` |
| [src/features/health/PlannedHealthScreen.tsx:210](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:210) | `QuietButton` | `title="Tillbaka till hälsa" disabled={busy} onPress={onBack}` |
| [src/features/health/PlannedHealthScreen.tsx:221](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:221) | `Pressable` | `ref={infoButtonRef} accessibilityRole="button" accessibilityLabel="Visa information om planerade hälsohändelser" onPress={() => {         dispatchFeedback({ type: 'info-opened' });         setInfoVisible(true);       }} style={styles.infoButton}` |
| [src/features/health/PlannedHealthScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:229) | `InfoModal` | `visible={infoVisible} title="Om planerade hälsohändelser" onClose={closeInfo} onDismiss={finishInfoDismissal}` |
| [src/features/health/PlannedHealthScreen.tsx:233](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:233) | `MessageCard` | `` |
| [src/features/health/PlannedHealthScreen.tsx:235](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:235) | `MessageCard` | `tone={statusError ? 'error' : 'neutral'}` |
| [src/features/health/PlannedHealthScreen.tsx:242](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:242) | `PrimaryButton` | `title={busy ? 'Kontrollerar…' : 'Använd aktuell plan och börja om'} disabled={busy} onPress={acceptConflict}` |
| [src/features/health/PlannedHealthScreen.tsx:244](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:244) | `MessageCard` | `` |
| [src/features/health/PlannedHealthScreen.tsx:245](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:245) | `MessageCard` | `tone="error"` |
| [src/features/health/PlannedHealthScreen.tsx:246](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:246) | `PrimaryButton` | `title="Kontrollera sparstatus" disabled={busy} onPress={onRetry}` |
| [src/features/health/PlannedHealthScreen.tsx:247](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:247) | `PrimaryButton` | `title="Försök igen" disabled={busy} onPress={onRetry}` |
| [src/features/health/PlannedHealthScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:250) | `MessageCard` | `` |
| [src/features/health/PlannedHealthScreen.tsx:259](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:259) | `DatePickerField` | `label="Planerat datum" disabled={blocked} onChangeText={setDueOn} value={dueOn}` |
| [src/features/health/PlannedHealthScreen.tsx:260](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:260) | `Pressable` | `accessibilityRole="checkbox" accessibilityState={{ checked: reminderEnabled, disabled: blocked }} disabled={blocked} onPress={() => setReminderEnabled((value) => !value)} style={styles.reminderChoice}` |
| [src/features/health/PlannedHealthScreen.tsx:270](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:270) | `TimePickerField` | `label="Påminnelsetid, lokal tid" disabled={blocked} onChangeText={setReminderTime} value={reminderTime}` |
| [src/features/health/PlannedHealthScreen.tsx:278](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:278) | `MessageCard` | `tone="error"` |
| [src/features/health/PlannedHealthScreen.tsx:279](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:279) | `PrimaryButton` | `title={busy ? 'Sparar…' : editingRecord ? 'Spara rättning' : 'Spara plan'} disabled={blocked} onPress={() => { void save(); }}` |
| [src/features/health/PlannedHealthScreen.tsx:280](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:280) | `ActionFeedbackModal` | `key={feedbackState.activeMessage ?? 'no-feedback'} visible={feedbackState.activeMessage !== null && !infoVisible} message={feedbackState.activeMessage ?? ''} onShown={markFeedbackShown} onClose={() => dispatchFeedback({ type: 'dismiss' })}` |
| [src/features/health/PlannedHealthScreen.tsx:287](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:287) | `QuietButton` | `title="Avbryt rättning" disabled={blocked} onPress={resetForm}` |
| [src/features/health/PlannedHealthScreen.tsx:291](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:291) | `MessageCard` | `` |
| [src/features/health/PlannedHealthScreen.tsx:316](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:316) | `QuietButton` | `title="Ändra" disabled={blocked} onPress={() => edit(record)}` |
| [src/features/health/PlannedHealthScreen.tsx:317](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:317) | `QuietButton` | `title="Ta bort" disabled={blocked} onPress={() => confirmDelete(record)}` |
| [src/features/health/PlannedHealthScreen.tsx:328](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:328) | `Pressable` | `accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.typeChoice, selected && styles.typeChoiceSelected, pressed && !disabled && styles.typeChoicePressed]}` |
| [src/features/home/AppFlow.tsx:21](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/AppFlow.tsx:21) | `MessageCard` | `` |
| [src/features/home/AppFlow.tsx:44](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/AppFlow.tsx:44) | `MessageCard` | `` |
| [src/features/home/AppFlow.tsx:47](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/AppFlow.tsx:47) | `PrimaryButton` | `title="Försök igen" onPress={() => { setState('loading'); setAttempt((count) => count + 1); }}` |
| [src/features/home/AppFlow.tsx:50](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/AppFlow.tsx:50) | `MessageCard` | `` |
| [src/features/home/DevelopmentPreview.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:164) | `PreviewTabBar` | `active={activeTab} onSelect={setScreen}` |
| [src/features/home/DevelopmentPreview.tsx:189](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:189) | `PreviewMenuItem` | `title="Hälsa" description="Visuell grund" onPress={onOpenHealth}` |
| [src/features/home/DevelopmentPreview.tsx:190](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:190) | `PreviewMenuItem` | `title="Kunskap" description="Visuell grund" onPress={onOpenKnowledge}` |
| [src/features/home/DevelopmentPreview.tsx:191](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:191) | `PreviewMenuItem` | `title="Tassla-pass" description="Visuell grund" onPress={onOpenPassport}` |
| [src/features/home/DevelopmentPreview.tsx:192](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:192) | `PreviewMenuItem` | `title="Utkast för granskning" description="Endast utvecklarläge · ej publicerat" onPress={onOpenDrafts}` |
| [src/features/home/DevelopmentPreview.tsx:208](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:208) | `Pressable` | `accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}` |
| [src/features/home/DevelopmentPreview.tsx:230](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/DevelopmentPreview.tsx:230) | `Pressable` | `key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onSelect(tab.id)} style={({ pressed }) => [styles.tab, selected && styles.selectedTab, pressed && styles.pressed]}` |
| [src/features/home/PreviewHomeScreen.tsx:32](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:32) | `MessageCard` | `` |
| [src/features/home/PreviewHomeScreen.tsx:33](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:33) | `PrimaryButton` | `title="Öppna Vardagslogg" onPress={onOpenLog}` |
| [src/features/home/PreviewHomeScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:41) | `QuietButton` | `title="Öppna nästa steg" onPress={onOpenTraining}` |
| [src/features/home/PreviewHomeScreen.tsx:47](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:47) | `QuietButton` | `title="Läs träningsprogram igen" onPress={onOpenTraining}` |
| [src/features/home/PreviewHomeScreen.tsx:51](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewHomeScreen.tsx:51) | `QuietButton` | `title="Redigera hundprofil" onPress={onEditProfile}` |
| [src/features/home/PreviewProfileScreen.tsx:34](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewProfileScreen.tsx:34) | `MessageCard` | `tone="error"` |
| [src/features/home/PreviewProfileScreen.tsx:39](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewProfileScreen.tsx:39) | `MessageCard` | `` |
| [src/features/home/PreviewProfileScreen.tsx:40](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewProfileScreen.tsx:40) | `PrimaryButton` | `title="Visa Hem" disabled={!validName &#124;&#124; !validBirthDate} onPress={() => onSave({ ...dog, name: name.trim(), birthDate: birthDate.trim() })}` |
| [src/features/home/PreviewProfileScreen.tsx:45](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/PreviewProfileScreen.tsx:45) | `QuietButton` | `title="Tillbaka hem" onPress={onCancel}` |
| [src/features/home/ProductWorkspace.tsx:1645](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1645) | `MessageCard` | `` |
| [src/features/home/ProductWorkspace.tsx:1646](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1646) | `MessageCard` | `tone="error"` |
| [src/features/home/ProductWorkspace.tsx:1649](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1649) | `BottomNavigation` | `page={page} onNavigate={setPage}` |
| [src/features/home/ProductWorkspace.tsx:1675](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1675) | `PrimaryButton` | `title="Försök igen" onPress={() => { void retryEvents(); }}` |
| [src/features/home/ProductWorkspace.tsx:1687](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1687) | `MessageCard` | `tone="error"` |
| [src/features/home/ProductWorkspace.tsx:1688](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1688) | `PrimaryButton` | `title="Försök igen" onPress={() => { void retryTraining(); }}` |
| [src/features/home/ProductWorkspace.tsx:1847](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1847) | `MessageCard` | `` |
| [src/features/home/ProductWorkspace.tsx:1849](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1849) | `MessageCard` | `tone="error"` |
| [src/features/home/ProductWorkspace.tsx:1850](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1850) | `PrimaryButton` | `title="Försök igen" onPress={onRetryContent}` |
| [src/features/home/ProductWorkspace.tsx:1852](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1852) | `MessageCard` | `` |
| [src/features/home/ProductWorkspace.tsx:1860](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1860) | `QuietButton` | `title="Läs i Kunskap" onPress={() => onOpenContent(item.id)}` |
| [src/features/home/ProductWorkspace.tsx:1868](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1868) | `QuietButton` | `title="Öppna loggen" onPress={() => onGo('log')}` |
| [src/features/home/ProductWorkspace.tsx:1877](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1877) | `QuietButton` | `title="Öppna nästa steg" onPress={() => onGo('training')}` |
| [src/features/home/ProductWorkspace.tsx:1882](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1882) | `Shortcut` | `icon="create-outline" label="Logga" onPress={() => onGo('log')}` |
| [src/features/home/ProductWorkspace.tsx:1883](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1883) | `Shortcut` | `icon="school-outline" label="Träning" onPress={() => onGo('training')}` |
| [src/features/home/ProductWorkspace.tsx:1884](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1884) | `Shortcut` | `icon="ellipsis-horizontal-circle-outline" label="Mer" onPress={() => onGo('more')}` |
| [src/features/home/ProductWorkspace.tsx:1895](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1895) | `MenuRow` | `icon="book-outline" title="Kunskap" detail="Publicerade guider och checklistor" onPress={() => onNavigate('knowledge')}` |
| [src/features/home/ProductWorkspace.tsx:1896](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1896) | `MenuRow` | `icon="id-card-outline" title="Tassla-pass" detail="En ärlig överblick, utan export" onPress={() => onNavigate('passport')}` |
| [src/features/home/ProductWorkspace.tsx:1897](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1897) | `MenuRow` | `icon="paw-outline" title="Hundprofil" detail="Din hunds uppgifter" onPress={() => onNavigate('profile')}` |
| [src/features/home/ProductWorkspace.tsx:1898](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1898) | `MenuRow` | `icon="notifications-outline" title="Påminnelser" detail="Lokala val och enhetens tillstånd" onPress={onOpenNotifications}` |
| [src/features/home/ProductWorkspace.tsx:1899](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1899) | `MenuRow` | `icon="person-circle-outline" title="Konto och support" detail="Information och kontohantering" onPress={onOpenAccount}` |
| [src/features/home/ProductWorkspace.tsx:1900](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1900) | `MessageCard` | `tone="error"` |
| [src/features/home/ProductWorkspace.tsx:1901](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1901) | `QuietButton` | `title={signingOut ? 'Loggar ut…' : 'Logga ut'} disabled={signingOut} onPress={onSignOut}` |
| [src/features/home/ProductWorkspace.tsx:1907](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1907) | `QuietButton` | `title="Tillbaka till Mer" onPress={onBack}` |
| [src/features/home/ProductWorkspace.tsx:1914](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1914) | `MessageCard` | `` |
| [src/features/home/ProductWorkspace.tsx:1919](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1919) | `Pressable` | `accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}` |
| [src/features/home/ProductWorkspace.tsx:1927](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1927) | `Pressable` | `accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}` |
| [src/features/home/ProductWorkspace.tsx:1944](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1944) | `Pressable` | `key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={tab.label} onPress={() => onNavigate(tab.id)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}` |
| [src/features/knowledge/DraftContentPreview.tsx:37](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:37) | `QuietButton` | `title="Tillbaka till Mer" onPress={onBack}` |
| [src/features/knowledge/DraftContentPreview.tsx:39](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/DraftContentPreview.tsx:39) | `MessageCard` | `tone="error"` |
| [src/features/knowledge/KnowledgeScreen.tsx:45](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:45) | `QuietButton` | `title="Tillbaka" onPress={onBack}` |
| [src/features/knowledge/KnowledgeScreen.tsx:47](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:47) | `MessageCard` | `` |
| [src/features/knowledge/KnowledgeScreen.tsx:49](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:49) | `MessageCard` | `tone="error"` |
| [src/features/knowledge/KnowledgeScreen.tsx:50](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:50) | `PrimaryButton` | `title="Försök igen" onPress={onRetry}` |
| [src/features/knowledge/KnowledgeScreen.tsx:52](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:52) | `MessageCard` | `` |
| [src/features/knowledge/KnowledgeScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:59) | `Pressable` | `key={item.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={&#96;${item.title}, version ${item.version}&#96;} onPress={() => { setSourceMessage(''); onSelectContent(item.id); }} style={({ pressed }) => [styles.guideRow, selected && styles.guideRowSelected, pressed && styles.pressed]}` |
| [src/features/knowledge/KnowledgeScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:103) | `QuietButton` | `title="Öppna extern källa" onPress={() => { void openSource(source); }}` |
| [src/features/knowledge/KnowledgeScreen.tsx:107](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:107) | `MessageCard` | `` |
| [src/features/notifications/NotificationSettingsScreen.tsx:59](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:59) | `QuietButton` | `title="Tillbaka till Mer" disabled={busy} onPress={onBack}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:70](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:70) | `Pressable` | `accessibilityRole="button" accessibilityLabel="Visa information om lokala påminnelser" onPress={() => setInfoVisible(true)} style={styles.infoButton}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:75](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:75) | `InfoModal` | `visible={infoVisible} title="Om lokala påminnelser" onClose={() => setInfoVisible(false)}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:87) | `TimePickerField` | `label="Träningspåminnelse, lokal tid" disabled={busy} onChangeText={setTrainingTime} value={trainingTime}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:89](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:89) | `MessageCard` | `tone={permissionState === 'denied' ? 'error' : 'neutral'}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:90](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:90) | `PrimaryButton` | `title={permissionBusy ? 'Kontrollerar…' : 'Tillåt påminnelser på telefonen'} disabled={busy &#124;&#124; permissionBusy} onPress={() => { void requestPermission(); }}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:92](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:92) | `MessageCard` | `` |
| [src/features/notifications/NotificationSettingsScreen.tsx:93](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:93) | `MessageCard` | `tone="error"` |
| [src/features/notifications/NotificationSettingsScreen.tsx:94](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:94) | `MessageCard` | `tone="error"` |
| [src/features/notifications/NotificationSettingsScreen.tsx:95](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:95) | `MessageCard` | `tone="error"` |
| [src/features/notifications/NotificationSettingsScreen.tsx:96](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:96) | `MessageCard` | `` |
| [src/features/notifications/NotificationSettingsScreen.tsx:97](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:97) | `PrimaryButton` | `title={busy ? 'Sparar…' : 'Spara val'} disabled={busy} onPress={() => { void save(); }}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:98](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:98) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:105) | `Pressable` | `accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && !disabled && styles.pressed]}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:90](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:90) | `QuietButton` | `title="Tillbaka till Mer" disabled={busy} onPress={onBack}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:102) | `MessageCard` | `tone={statusError ? 'error' : 'neutral'}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:103) | `MessageCard` | `tone="neutral"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:105) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:106](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:106) | `PrimaryButton` | `title={busy ? 'Kontrollerar…' : 'Kontrollera sparstatus'} disabled={busy} onPress={onRetryStatus}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:112](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:112) | `PrimaryButton` | `title={busy ? 'Hämtar…' : 'Använd aktuell profil'} disabled={busy} onPress={onAcceptCurrent}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:123) | `MessageCard` | `` |
| [src/features/onboarding/EditDogProfileScreen.tsx:125](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:125) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:126](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:126) | `PrimaryButton` | `title="Hämta raslistan igen" disabled={busy} onPress={() => { setBreedState('loading'); setBreedAttempt((attempt) => attempt + 1); }}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:131) | `Pressable` | `key={breed.id} accessibilityRole="radio" accessibilityLabel={breed.name} accessibilityState={{ selected, disabled: blocked }} disabled={blocked} onPress={() => setBreedId(breed.id)} style={({ pressed }) => [styles.breedOption, selected && styles.breedSelected, pressed && !blocked && styles.breedPressed]}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:138](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:138) | `MessageCard` | `` |
| [src/features/onboarding/EditDogProfileScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:140) | `DatePickerField` | `label="Födelsedatum" disabled={blocked} onChangeText={setBirthDate} value={birthDate}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:141) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:142](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:142) | `PrimaryButton` | `title={busy ? 'Sparar…' : statusError && !pending ? 'Försök igen' : 'Spara profil'} disabled={blocked &#124;&#124; breedState !== 'ready'} onPress={() => { void save(); }}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:144](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:144) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/onboarding/EditDogProfileScreen.tsx:146](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:146) | `QuietButton` | `title="Avbryt" disabled={busy} onPress={onBack}` |
| [src/features/onboarding/ProfileScreen.tsx:95](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:95) | `MessageCard` | `` |
| [src/features/onboarding/ProfileScreen.tsx:97](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:97) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/ProfileScreen.tsx:98](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:98) | `PrimaryButton` | `title="Försök igen" onPress={() => { setBreedsState('loading'); setBreedAttempt((count) => count + 1); }}` |
| [src/features/onboarding/ProfileScreen.tsx:105](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:105) | `Pressable` | `key={breed.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => { setBreedId(breed.id); markEdited(); }} style={({ pressed }) => [styles.breedOption, selected && styles.breedSelected, pressed && styles.breedPressed]}` |
| [src/features/onboarding/ProfileScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:129) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/ProfileScreen.tsx:130](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:130) | `MessageCard` | `tone="error"` |
| [src/features/onboarding/ProfileScreen.tsx:132](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:132) | `PrimaryButton` | `title={busy ? 'Kontrollerar…' : 'Kontrollera sparstatus'} disabled={busy} onPress={() => { void checkSaveStatus(); }}` |
| [src/features/onboarding/ProfileScreen.tsx:133](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/ProfileScreen.tsx:133) | `PrimaryButton` | `title={busy ? 'Sparar…' : 'Fortsätt'} disabled={!canSubmit &#124;&#124; busy &#124;&#124; breedsState !== 'ready'} onPress={() => { void submitProfile(); }}` |
| [src/features/passport/PassportScreen.tsx:144](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:144) | `QuietButton` | `title="Tillbaka till Mer" onPress={props.onBack} disabled={busy}` |
| [src/features/passport/PassportScreen.tsx:156](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:156) | `MessageCard` | `` |
| [src/features/passport/PassportScreen.tsx:158](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:158) | `SelectionRow` | `iconsLoaded={iconsLoaded} icon="person-outline" title="Hundprofil" detail="Namn, ras och födelsedatum" checked={selection.profile} disabled={busy} onPress={() => toggleSelection('profile')}` |
| [src/features/passport/PassportScreen.tsx:159](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:159) | `SelectionRow` | `iconsLoaded={iconsLoaded} icon="scale-outline" title="Senaste vikten" detail="Senaste ägarregistrerade vikt och datum" checked={selection.latestWeight} disabled={busy} onPress={() => toggleSelection('latestWeight')}` |
| [src/features/passport/PassportScreen.tsx:160](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:160) | `SelectionRow` | `iconsLoaded={iconsLoaded} icon="medkit-outline" title="Utförda hälsoposter" detail="Vaccinationer och veterinärbesök" checked={selection.healthHistory} disabled={busy} onPress={() => toggleSelection('healthHistory')}` |
| [src/features/passport/PassportScreen.tsx:162](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:162) | `MessageCard` | `` |
| [src/features/passport/PassportScreen.tsx:164](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:164) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:165](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:165) | `PrimaryButton` | `title="Hämta rasnamnet igen" onPress={() => { setBreedState('loading'); setBreedDataLifetime(currentLifetime); setBreedAttempt((count) => count + 1); }} disabled={busy}` |
| [src/features/passport/PassportScreen.tsx:167](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:167) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:168](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:168) | `MessageCard` | `` |
| [src/features/passport/PassportScreen.tsx:169](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:169) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:170](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:170) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:171) | `MessageCard` | `` |
| [src/features/passport/PassportScreen.tsx:172](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:172) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:173](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:173) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:187](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:187) | `MessageCard` | `tone="error"` |
| [src/features/passport/PassportScreen.tsx:188](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:188) | `PrimaryButton` | `title={exporting ? 'Skapar PDF…' : 'Skapa PDF och öppna delning'} disabled={!ready &#124;&#124; !snapshot &#124;&#124; busy &#124;&#124; !selectedAny} onPress={() => { setDismissedStatus(''); void createAndShare(); }}` |
| [src/features/passport/PassportScreen.tsx:189](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:189) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/passport/PassportScreen.tsx:190](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:190) | `QuietButton` | `title="Försök hämta vikterna igen" disabled={busy} onPress={props.onRetryWeights ?? (() => undefined)}` |
| [src/features/passport/PassportScreen.tsx:191](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:191) | `QuietButton` | `title="Försök hämta hälsoposter igen" disabled={busy} onPress={props.onRetryHistory ?? (() => undefined)}` |
| [src/features/passport/PassportScreen.tsx:200](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:200) | `Pressable` | `accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={[styles.selectionRow, disabled && styles.disabled]}` |
| [src/features/puppy-log/LogScreen.tsx:73](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:73) | `Pressable` | `key={type} accessibilityRole="button" accessibilityLabel={&#96;Lägg till ${LOG_EVENT_LABELS[type]}&#96;} disabled={busy} onPress={() => { onMutationStart?.(); setDismissedStatus(null); setFeedbackEventId(null); setDeletedFeedbackEvent(null); onAdd(type); }} style={({ pressed }) => [styles.quickButton, busy && styles.disabled, pressed && !busy && styles.pressed]}` |
| [src/features/puppy-log/LogScreen.tsx:86](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:86) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => setDismissedStatus(statusMessage)}` |
| [src/features/puppy-log/LogScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:87) | `MessageCard` | `` |
| [src/features/puppy-log/LogScreen.tsx:96](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:96) | `MessageCard` | `tone="error"` |
| [src/features/puppy-log/LogScreen.tsx:97](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:97) | `PrimaryButton` | `title="Kontrollera status" disabled={busy} onPress={onRetryPending}` |
| [src/features/puppy-log/LogScreen.tsx:99](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:99) | `MessageCard` | `` |
| [src/features/puppy-log/LogScreen.tsx:110](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:110) | `MessageCard` | `` |
| [src/features/puppy-log/LogScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:128) | `QuietButton` | `title="Ändra" disabled={busy} onPress={() => setEditingId(event.id)}` |
| [src/features/puppy-log/LogScreen.tsx:129](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:129) | `QuietButton` | `title="Radera" disabled={busy} onPress={() => confirmDelete(event)}` |
| [src/features/puppy-log/LogScreen.tsx:131](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:131) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }}` |
| [src/features/puppy-log/LogScreen.tsx:141](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:141) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }}` |
| [src/features/puppy-log/LogScreen.tsx:154](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:154) | `ActionFeedbackModal` | `visible={dismissedStatus !== statusMessage} message={statusMessage} onClose={() => { setDismissedStatus(statusMessage); setDeletedFeedbackEvent(null); }}` |
| [src/features/puppy-log/LogScreen.tsx:159](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:159) | `PrimaryButton` | `title={loadingMore ? 'Hämtar…' : 'Visa äldre poster'} disabled={loadingMore &#124;&#124; busy} onPress={onLoadMore ?? (() => undefined)}` |
| [src/features/puppy-log/LogScreen.tsx:215](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:215) | `Pressable` | `key={option} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setType(option)} style={({ pressed }) => [styles.typeOption, selected && styles.selectedTypeOption, pressed && styles.pressed]}` |
| [src/features/puppy-log/LogScreen.tsx:229](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:229) | `DatePickerField` | `label="Datum" onChangeText={setDate} value={date}` |
| [src/features/puppy-log/LogScreen.tsx:232](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:232) | `TimePickerField` | `label="Tid" onChangeText={setTime} value={time}` |
| [src/features/puppy-log/LogScreen.tsx:249](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:249) | `MessageCard` | `tone="error"` |
| [src/features/puppy-log/LogScreen.tsx:250](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:250) | `MessageCard` | `tone="error"` |
| [src/features/puppy-log/LogScreen.tsx:251](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:251) | `PrimaryButton` | `title={saving ? 'Sparar…' : 'Spara ändring'} disabled={!valid &#124;&#124; saving} onPress={() => { void save(); }}` |
| [src/features/puppy-log/LogScreen.tsx:252](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:252) | `QuietButton` | `title="Avbryt" onPress={onCancel}` |
| [src/features/training/PublishedTrainingScreen.tsx:52](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:52) | `MessageCard` | `` |
| [src/features/training/PublishedTrainingScreen.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:54) | `MessageCard` | `tone="error"` |
| [src/features/training/PublishedTrainingScreen.tsx:55](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:55) | `PrimaryButton` | `title="Försök igen" onPress={onRetry}` |
| [src/features/training/PublishedTrainingScreen.tsx:58](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:58) | `MessageCard` | `key={item.versionId} tone="error"` |
| [src/features/training/PublishedTrainingScreen.tsx:63](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:63) | `MessageCard` | `` |
| [src/features/training/PublishedTrainingScreen.tsx:80](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:80) | `MessageCard` | `` |
| [src/features/training/PublishedTrainingScreen.tsx:81](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:81) | `PrimaryButton` | `title={isOpen ? 'Dölj program' : 'Visa program'} onPress={() => setOpenProgramId(isOpen ? null : program.id)}` |
| [src/features/training/PublishedTrainingScreen.tsx:83](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:83) | `MessageCard` | `` |
| [src/features/training/PublishedTrainingScreen.tsx:92](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:92) | `PrimaryButton` | `title={busyStepKey === &#96;${program.id}:${step.id}&#96; ? 'Sparar…' : busyStepKey ? 'Vänta…' : 'Markera steg som genomfört'} disabled={Boolean(busyStepKey)} onPress={() => complete(program, step.id)}` |
| [src/features/training/PublishedTrainingScreen.tsx:101](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:101) | `MessageCard` | `` |
| [src/features/training/PublishedTrainingScreen.tsx:102](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:102) | `PrimaryButton` | `title={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} onPress={continueAfterSave}` |
| [src/features/training/PublishedTrainingScreen.tsx:104](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:104) | `QuietButton` | `title={busyStepKey === &#96;${program.id}:reset&#96; ? 'Rensar…' : 'Rensa registrerade steg'} disabled={Boolean(busyStepKey)} onPress={() => confirmReset(program, (selected) => { onResetProgram(selected); setAcknowledged(null); })}` |
| [src/features/training/TrainingScreen.tsx:28](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:28) | `MessageCard` | `` |
| [src/features/training/TrainingScreen.tsx:41](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:41) | `MessageCard` | `` |
| [src/features/training/TrainingScreen.tsx:43](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:43) | `PrimaryButton` | `title={isOpen ? 'Dölj program' : completed.length ? 'Fortsätt eller läs igen' : 'Visa program'} onPress={() => setOpenProgramId(isOpen ? null : program.id)}` |
| [src/features/training/TrainingScreen.tsx:49](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:49) | `MessageCard` | `tone="error"` |
| [src/features/training/TrainingScreen.tsx:61](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:61) | `PrimaryButton` | `title="Markera steg som genomfört" onPress={() => onCompleteStep(program, step.id)}` |
| [src/features/training/TrainingScreen.tsx:68](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:68) | `MessageCard` | `` |
| [src/features/training/TrainingScreen.tsx:69](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:69) | `PrimaryButton` | `title={nextStep ? 'Fortsätt till nästa steg' : 'Visa avslutatläge'} onPress={onContinue}` |
| [src/features/training/TrainingScreen.tsx:72](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:72) | `MessageCard` | `` |
| [src/features/training/TrainingScreen.tsx:79](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/TrainingScreen.tsx:79) | `QuietButton` | `title="Rensa programmets registreringar" onPress={() => confirmReset(program, onResetProgram)}` |

### 2.3 Alla ikonkomponenters anropsställen

Ionicons är den vektoruppsättning som hittas i UI. Dynamiska name/size/color visas som faktiska uttryck; textsymboler i Logg/preview redovisas i den manuella sammanställningen.

| Fil:rad | Element | Namn/storlek/färg och övriga props |
|---|---|---|
| [src/features/account/AccountSettingsScreen.tsx:73](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:73) | `Ionicons` | `name="person-circle-outline" size={26} color={theme.colors.accent}` |
| [src/features/account/AccountSettingsScreen.tsx:81](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:81) | `Ionicons` | `name="information-circle-outline" size={23} color={theme.colors.accent}` |
| [src/features/account/AccountSettingsScreen.tsx:83](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:83) | `Ionicons` | `name="chevron-forward" size={18} color={theme.colors.mutedText}` |
| [src/features/account/AccountSettingsScreen.tsx:86](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:86) | `Ionicons` | `name="mail-outline" size={23} color={theme.colors.accent}` |
| [src/features/account/AccountSettingsScreen.tsx:88](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:88) | `Ionicons` | `name="chevron-forward" size={18} color={theme.colors.mutedText}` |
| [src/features/account/BetaInfoScreen.tsx:20](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/BetaInfoScreen.tsx:20) | `Ionicons` | `name="information-circle-outline" size={25} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/HealthHistoryScreen.tsx:108](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:108) | `Ionicons` | `name="medical-outline" size={21} color={theme.colors.accent}` |
| [src/features/health/HealthHistoryScreen.tsx:118](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:118) | `Ionicons` | `name="information-circle-outline" size={21} color={theme.colors.accent}` |
| [src/features/health/HealthHistoryScreen.tsx:181](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:181) | `Ionicons` | `name={record.event_type === 'vaccination' ? 'bandage-outline' : 'medical-outline'} size={19} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/HealthHistoryScreen.tsx:204](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:204) | `Ionicons` | `name={icon} size={20} color={selected ? theme.colors.accent : theme.colors.mutedText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/HealthScreen.tsx:140](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:140) | `Ionicons` | `name="calendar-outline" size={21} color={theme.colors.accent}` |
| [src/features/health/PlannedHealthScreen.tsx:213](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:213) | `Ionicons` | `name="calendar-outline" size={24} color={theme.colors.accent}` |
| [src/features/health/PlannedHealthScreen.tsx:225](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:225) | `Ionicons` | `name="information-circle-outline" size={22} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/PlannedHealthScreen.tsx:263](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:263) | `Ionicons` | `name="checkmark" size={17} color={theme.colors.onAccent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/PlannedHealthScreen.tsx:305](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:305) | `Ionicons` | `name={record.event_type === 'vaccination' ? 'bandage-outline' : 'medical-outline'} size={19} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/health/PlannedHealthScreen.tsx:330](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/PlannedHealthScreen.tsx:330) | `Ionicons` | `name={icon} size={20} color={selected ? theme.colors.accent : theme.colors.mutedText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/home/ProductWorkspace.tsx:1846](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1846) | `Ionicons` | `name="sparkles-outline" size={22} color={theme.colors.accent}` |
| [src/features/home/ProductWorkspace.tsx:1855](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1855) | `Ionicons` | `name={item.contentType === 'checklist' ? 'checkbox-outline' : 'book-outline'} size={19} color={theme.colors.accent}` |
| [src/features/home/ProductWorkspace.tsx:1862](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1862) | `Ionicons` | `name="calendar-outline" size={22} color={theme.colors.accent}` |
| [src/features/home/ProductWorkspace.tsx:1920](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1920) | `Ionicons` | `name={icon} size={23} color={theme.colors.accent}` |
| [src/features/home/ProductWorkspace.tsx:1922](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1922) | `Ionicons` | `name="chevron-forward" size={18} color={theme.colors.mutedText}` |
| [src/features/home/ProductWorkspace.tsx:1928](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1928) | `Ionicons` | `name={icon} size={22} color={theme.colors.accent}` |
| [src/features/home/ProductWorkspace.tsx:1946](C:/Users/erika/Documents/GitHub/Tassla/src/features/home/ProductWorkspace.tsx:1946) | `Ionicons` | `name={tab.icon} size={22} color={selected ? theme.colors.accent : theme.colors.mutedText}` |
| [src/features/knowledge/KnowledgeScreen.tsx:67](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:67) | `Ionicons` | `name={item.contentType === 'checklist' ? 'checkbox-outline' : 'book-outline'} size={21} color={theme.colors.accent}` |
| [src/features/knowledge/KnowledgeScreen.tsx:78](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:78) | `Ionicons` | `name="leaf-outline" size={18} color={theme.colors.accent}` |
| [src/features/knowledge/KnowledgeScreen.tsx:100](C:/Users/erika/Documents/GitHub/Tassla/src/features/knowledge/KnowledgeScreen.tsx:100) | `Ionicons` | `name={safeUrl ? 'link-outline' : 'document-text-outline'} size={17} color={theme.colors.accent}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:62](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:62) | `Ionicons` | `name="notifications-outline" size={24} color={theme.colors.accent}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:71](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:71) | `Ionicons` | `name="information-circle-outline" size={21} color={theme.colors.accent}` |
| [src/features/notifications/NotificationSettingsScreen.tsx:108](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:108) | `Ionicons` | `name="checkmark" size={17} color={theme.colors.onAccent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:99](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:99) | `Ionicons` | `name="paw-outline" size={19} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/onboarding/EditDogProfileScreen.tsx:135](C:/Users/erika/Documents/GitHub/Tassla/src/features/onboarding/EditDogProfileScreen.tsx:135) | `Ionicons` | `name="checkmark-circle" size={21} color={theme.colors.accent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"` |
| [src/features/passport/PassportScreen.tsx:148](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:148) | `Ionicons` | `name="document-text-outline" size={25} color={theme.colors.accent}` |
| [src/features/passport/PassportScreen.tsx:202](C:/Users/erika/Documents/GitHub/Tassla/src/features/passport/PassportScreen.tsx:202) | `Ionicons` | `name={icon} size={21} color={theme.colors.accent}` |

### 2.4 Positionsavstånd, transform och skugga

Positionskoordinater och skuggvärden är separat från spacing.

| Fil:rad | Egenskap | Värde |
|---|---|---|


## 3. Regelbrott och avvikelser i aktuell källkod

**Sammanfattning:** baspaletten ligger nära målbilden. De största problemen är spridda lokala värden, olika kortfamiljer, för många huvudhandlingar, återkommande statusetiketter och teknisk copy. Att byta färg räcker därför inte; komponenthierarki och informationsmängd behöver också samordnas i kommande godkända UI-arbete.

Nedan är källkodsfynd, inte resultat av visuell QA. Hänvisningar gäller docs/design-rules.md. Produktionsvyer omfattas om inget annat anges. Exakt radbrytning och upplevd storlek kan bara bedömas med rendering.

| Fynd | Källa | Regel | Bedömning och föreslagen riktning |
|---|---|---|---|
| Lokala hexvärden, fontstorlekar, radier och avstånd i skärmfiler | Fullständiga tabeller i 1.1–1.6 och 2.1 | §3, §5 | Belagt. Flytta till semantiska tokens och gemensamma komponenter i berörd slice. Tokenfilens egna literaler är inte regelbrott. |
| Flera olika kortutseenden och lokala komponentfamiljer | ProductWorkspace.tsx:2032–2055; LogScreen.tsx:287–314; HealthScreen.tsx:212–225; KnowledgeScreen.tsx:126; PassportScreen.tsx, se 2.1 | §3–5 | Belagt i definitionerna. Samordna basram, padding 16 och radius lg; fotohero och sheet får egna strukturer enligt policyn. |
| Generell varumärkesrad och vänsterställd PageHeading används i stället för målbildens centrerade appbar | [AppPrimitives.tsx:7](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:7), [AppPrimitives.tsx:26](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:26), app/_layout.tsx | §2, §4, §11 | Belagd komponentstruktur. Gemensam AppBar med rätt titel, bakåtväg och stödhandling behövs. |
| Två primärknappar i inloggning; en tredje vid pågående Google-inloggning | [SignInScreen.tsx:54](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/SignInScreen.tsx:54), :56, :74 | §6 | Belagt samtidiga JSX-grenar. Välj huvudhandling; alternativa sätt och avbryt får annan variant. |
| Två primärknappar i notisinställning | [NotificationSettingsScreen.tsx:90](C:/Users/erika/Documents/GitHub/Tassla/src/features/notifications/NotificationSettingsScreen.tsx:90), :97 | §6 | Båda renderas; disabled ändrar inte hierarkin. Skilj tillståndsfråga från Spara. |
| Programöppning och aktivt träningssteg använder båda primärknapp | [PublishedTrainingScreen.tsx:81](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:81), :92, :102 | §6 | Belagt i öppet program med nästa handling. Programöppning bör vara rad/sekundär handling. |
| Radera konto använder samma fyllda gröna PrimaryButton | [AccountSettingsScreen.tsx:103](C:/Users/erika/Documents/GitHub/Tassla/src/features/account/AccountSettingsScreen.tsx:103) | §6 | Belagt. Destructive ska vara röd text/kontur. Befintlig bekräftelse ska bevaras. |
| Ändra och Radera visas som separata textknappar per loggrad/hälsopost | [LogScreen.tsx:128](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:128); HealthScreen.tsx:192; HealthHistoryScreen.tsx:190; PlannedHealthScreen.tsx:316 | §6 | Belagd placering och gemensam QuietButton-stil. Flytta till detalj/redigering eller liten meny. Befintliga raderingsdialoger är en fungerande del att bevara. |
| SPARAD på normala loggposter | [LogScreen.tsx:123](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:123) | §8 | Belagt i cloud-läge. EXEMPEL/TESTPOST gäller syntetisk preview och ska inte blandas ihop med produktionsfyndet. |
| ÄGARREGISTRERAD på normala hälso-/viktposter och planer | [HealthScreen.tsx:188](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthScreen.tsx:188); HealthHistoryScreen.tsx:185; PlannedHealthScreen.tsx:313 | §8 | Belagt. Källa behöver inte en versal badge på varje vanlig ägarpost. |
| Feedback är inline-ruta med Stäng status och 4 sekunders timer | [AppPrimitives.tsx:171](C:/Users/erika/Documents/GitHub/Tassla/src/components/AppPrimitives.tsx:171), :189, :195 | §8 | Belagt trots komponentnamnet ActionFeedbackModal. Policyn kräver kort toast 2–3 s och fungerande ångra där möjligt. Osäker sparstatus får inte döljas. |
| Teknisk banner och Historiskt mönsterunderlag i logg | [LogScreen.tsx:87](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:87), :93 | §8–9 | Belagd copy om serverbekräftelse, underlag och förutsägelse. Förenkla till vardagligt resultat; fördjupning vid behov. |
| Serverns svarstak och på servern i ägarflöden | [HealthHistoryScreen.tsx:124](C:/Users/erika/Documents/GitHub/Tassla/src/features/health/HealthHistoryScreen.tsx:124); AccountSettingsScreen.tsx:92, :99–100 | §9 | Belagt. Behåll sanningsenlig information om ofullständig historik/radering, men beskriv konsekvens och nästa steg utan interna begrepp. |
| Träningscopy använder registrerade/registreringar | [PublishedTrainingScreen.tsx:79](C:/Users/erika/Documents/GitHub/Tassla/src/features/training/PublishedTrainingScreen.tsx:79), :88, :101; ProductWorkspace.tsx:1522 | §9 | Belagt i produktionsväg. Använd exempelvis genomförda steg där detta motsvarar faktiskt sparad data. |
| Snabblogg använder sex rutor och flexBasis 31% | [LogScreen.tsx:73](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:73), :281 | §4, §11–12 | Belagd avvikelse från målbildens fyra/två kolumner. Exakt layout kräver rendering. Promenad/Vaken får inte tas bort; placering är fortfarande ägarbeslut. |
| Loggens ikonmix: 💧, 💩, ◒, ☾, ◉, ↗ | [LogScreen.tsx:269](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:269) | §7 | Belagt. Emoji och textsymboler blandas med Ionicons i övriga appen. Mat/Vaken använder uttryckligen förbjudna svårtolkade symboler. |
| Samma blå chipbakgrund för alla loggkategorier | [LogScreen.tsx:282](C:/Users/erika/Documents/GitHub/Tassla/src/features/puppy-log/LogScreen.tsx:282) | §3, §7 | Belagt. Saknar kategori-specifika fg/bg-par. |
| Saknade gemensamma komponenter enligt policyn | src/components/AppPrimitives.tsx; lokala familjer i 2.1 | §4, §6 | Delad femvariants-Button, Card, ListRow, AppBar, Tabs, QuickLogTile, HeroCard, Progress och ChecklistItem saknas som gemensamma byggstenar. Lokala motsvarigheter finns; detta betyder inte att funktionerna saknas. |
| Stor variationsbredd i typografi och spacing | 1.2, 1.4–1.5; AppPrimitives.tsx:269–298 | §3, §5 | Belagt: exempelvis heading-marginal 36 och lokala padding 18/20. Tre storlekar per faktiskt visad vy och tvåradersregeln måste kontrolleras separat i rendering. 48 som tryckytehöjd är inte felaktig spacing. |

### 3.1 Sådant som redan kan återanvändas

- Mörkgrön primärfärg, varm bakgrund, vita ytor och mjuka kort finns redan.
- ProductWorkspace har fem bottenposter med Ionicons-par för aktiv/inaktiv, lika stora områden och textetiketter. Samordna denna befintliga BottomTabs i stället för att anta att navigation saknas.
- FormField har etikett; knappar har disabled-state och primärknappen har tryckfeedback. Raderingar har bekräftelse på flera ställen. Detta ersätter inte granskning av laddningslägen och tillgänglighet.
- Befintliga hundillustrationer och Ionicons kan återanvändas. Dekorbild måste förbli en tydlig illustration/platshållare, aldrig påstås vara ägarens hundfoto.
- TrainingScreen och PreviewHomeScreen tillhör utvecklingspreview. Produktionsvägen använder PublishedTrainingScreen; preview-status som TESTINNEHÅLL är därför inte i sig ett produktionsfel.

### 3.2 Verifieringsluckor

Samtliga 18 visuella kontrollpunkter i policyn är **NOT TESTABLE som visuell helhetsgranskning** i denna inventering: ingen renderad appskärmdump finns. Tabellen ovan visar ändå konkreta källkodsfynd för bland annat punkterna 1, 3–8, 10 och 12. Radantal, kontrast 4,5:1, tumräckvidd, textskalning, överlapp med bottenmeny, foto-layout, faktiska tryckytor och laddar/tom/fel/normal behöver separat skärmgranskning. Artikeltext i en avsedd läsvy är inte automatiskt ett brott mot tvåradersregeln för arbetsflöden.

## 4. Föreslagen tokenuppsättning — inte implementerad

Förslaget behåller dagens basfärger och viktigaste radier. Målbilden har bedömts visuellt; färgerna är inte pixelmätta från bilden. Namnen och kompletteringarna nedan är förslag, inte godkända kodändringar. Alla kategoriers kontrast ska verifieras före användning för text.

### 4.1 Semantiska basfärger

| Token | Värde | Ursprung/användning |
|---|---|---|
| background | #F7F1E7 | Dagens bakgrund |
| surface | #FFFFFF | Dagens kort/fält |
| primary / success | #186A4D | Dagens accent; huvudhandling och bock |
| primaryPressed | #12543D | Befintlig lokal tryckfärg |
| onPrimary | #FFFFFF | Dagens onAccent |
| textPrimary | #1C3027 | Dagens text |
| textSecondary | #536257 | Dagens mutedText |
| border | #D9DFD7 | Dagens ram |
| selectedSurface | #E8EFE8 | Befintlig grön ton; val/flik |
| successSurface | #EAF3EC | Befintlig feedbackyta |
| warning / warningSurface | #785716 / #F5E7BF | Befintlig varm varningston |
| danger / dangerSurface / dangerBorder | #A32929 / #F7EAE7 / #D5A5A0 | Befintliga felvärden |
| overlay | #0008 | Befintligt överlägg; inte textfärg |

Använd samma primary överallt. Extra ljusa ytor är semantiska tillstånd, inte nya primärfärger. Vanliga kort använder surface + border; ingen permanent statusbanner behövs bara för att en färg finns.

### 4.2 Kategorifärger och ikonprincip

| category.<namn> | fg | bg | Avsedd ikon/ursprung |
|---|---|---|---|
| pee | #246A98 | #E4EEF4 | Droppe; bg finns, fg nytt förslag |
| poop | #885839 | #F5E9DF | Bajs som vektor; båda nya förslag |
| food | #186A4D | #E5EFE8 | Matskål; befintliga färger |
| sleep | #72558E | #F0E9F5 | Måne; båda nya förslag |
| awake | #72558E | #F0E9F5 | Begriplig vaken-symbol behöver väljas; färger nya |
| walk | #785716 | #F5E7BF | Gå/fotspår; befintlig amber, varken grön eller blå |
| training | #186A4D | #E5EFE8 | Träningssymbol; befintliga färger |
| vaccination | #A32929 | #F7EAE7 | Spruta/skydd; befintliga färger |
| deworming | #72558E | #F0E9F5 | Kapsel; nya färgförslag |
| veterinary | #246A98 | #E4EEF4 | Veterinärsymbol; fg nytt förslag |

Behåll en ikonuppsättning. Exakta ikonnamn ska väljas från faktiskt installerad uppsättning; tabellen lovar inte att varje motiv finns i Ionicons. Saknat motiv behöver ett uttryckligt beslut om en enhetlig vektorlösning, inte emoji eller en påhittad API. Mappa kategorin centralt så samma ikon/färg används på Hem, Logg, Hälsa och pass.

### 4.3 Spacing och radius

| Token | Värde | Avsedd användning |
|---|---|---|
| spacing.xs / sm / md / lg / xl / xxl | 4 / 8 / 12 / 16 / 24 / 32 | Hela tillåtna skalan |
| layout.pageInset | spacing.xl = 24 | Behåll dagens sidmarginal; kontrollera på liten mobil |
| layout.sectionGap | spacing.xl = 24 | Mellan sektioner |
| layout.headingGap | spacing.sm = 8 | Rubrik till innehåll |
| layout.listGap | spacing.md = 12 | Mellan rader/kort |
| layout.cardPadding | spacing.lg = 16 | Gemensamt kort |
| radius.sm / md / lg | 8 / 14 / 20 | Chips/fält; knappar/rader; kort/hero/sheets |

Cirkulära chips får geometrisk radie halva chipstorleken i den delade komponenten; det är en formregel, inte en fjärde allmän radiusnivå. Fältets 8 och knappens 14 är förslag som behöver jämföras visuellt. Avstånd ska komma från skalan; kontrollhöjder är separata mått och ska inte pressas ned till 32.

### 4.4 Typografi

Native använder idag systemfont; någon gemensam fontFamily-token finns inte. PDF anger Arial/Helvetica/sans-serif. Behåll systemfont för appen och motsvarande läsbar PDF-fallback; ingen ny fontdependency föreslås.

| Stil | fontSize / lineHeight | Vikt | Färg/roll |
|---|---|---|---|
| title | 24 / 32 | 800 | Sidtitel; mindre än dagens lokala 30 |
| heading | 20 / 28 | 700 | Sektionsrubrik |
| body | 16 / 24 | 400 | Primär lästext |
| caption | 14 / 20 | 400 | Metadata, textSecondary |
| label | 16 / 24 | 700 | Knappar/fältetiketter |

Det är fyra globala storlekar, men **max tre i varje vy**: normalt title/body/caption eller heading/body/caption. Skillnader kan även göras med vikt och färg. Stor text ska få omflöde; använd inte mindre text eller klippning för att hålla två rader. theme.type finns idag men ersätter inte de lokala fontSize-deklarationerna i tabellen.

### 4.5 Komponentmått och varianter

| Förslag | Mått/utseende |
|---|---|
| Button | primary/secondary/tertiary/icon/destructive; gemensam label, radius.md, höjd 56 som utgångspunkt; disabled + loading |
| Tryckyta | Minst 44×44 pt; 48×48 kan användas för bekvämlighet. Stor text får öka höjden. |
| Card | surface, border 1, radius.lg, padding 16; innehållsstyrd höjd |
| ListRow | Chip + titel/metarad + chevron; hela raden tryckbar, minhöjd anpassad till innehåll |
| IconChip | Samma storlek inom grupp, förslagsvis 32; ikon 20, kategorins fg/bg |
| Navigation | Befintlig bottenposthöjd 56 som utgångspunkt; ikon 24, fem lika breda poster |
| AppBar / Tabs / Section | Delad placering och spacing; AppBar-titel centrerad, flik med understreck |
| QuickLogTile / HeroCard / Progress / ChecklistItem | Delade byggstenar enligt målbildens struktur; detaljer verifieras i referensskärm innan fler skärmar följer |

PDF ska använda samma semantiska palett och typografiska hierarki, men CSS px och native pt/dp är olika renderingsmiljöer. Återanvänd inte mått blint utan separat exportgranskning.

## 5. Avslut och kvarstående beslut

Inventeringen är sparad; appkod, tokens, komponenter och navigation är oförändrade. Ingen paketimplementation eller UI-ombyggnad har startats genom denna rapport. Följande behöver avgöras inför ett senare ändringsuppdrag: referensskärm, placering av Promenad/Vaken utöver fyra snabbloggar, slutliga kategoriikoner och visuell validering av föreslagna tokens. Ingen publicering, build eller fysisk telefonverifiering har utförts.


