# UI-BETA-INFO-01 – UX-plan för Beta-info

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Pushed route använder Back-AppBar från workspace-shellen.
- Informationen visas som korta Card/caption-sektioner utan upprepade MessageCard-banners.
- Support e-post är en ListRow/link med minst 44 pt tryckyta.
- Legal/honesty-texter behålls sanningsenliga men komprimeras till captions; link error visas endast när länken faktiskt misslyckas.

## Tillstånd och scope

- Normal och link-error täcks; inga nya claims, destinations eller contentflöden.

Avgränsade filer:

- `src/features/account/BetaInfoScreen.tsx`
- `tests/beta-info-screen-policy.test.mjs`
- `docs/design-rules.md` section 14
- `docs/plans/UI-BETA-INFO-01-ux-spec.md`

Skyddat: support-adress, auth, navigation och befintligt informationsinnehålls innebörd.

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Beta-info normal`, `Beta-info link-error` och `Beta-info stor text`.
