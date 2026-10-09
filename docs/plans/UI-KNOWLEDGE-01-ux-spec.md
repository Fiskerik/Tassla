# UI-KNOWLEDGE-01 – UX-plan för Kunskap

Status: Architect APPROVE mottaget; implementerad, QA lokalt genomförd

## Mål och flöde

- Kunskap öppnas som pushed route med befintlig Back-AppBar från workspace-shellen.
- Publicerade guider visas som Card/HeroCard från den redan hämtade content-listan; inga nya tabs.
- Vald guide visar läsbar body och säkra källor. Extern källa öppnas endast via befintlig validering.
- Ingen stockhund, Luna eller draft-content får visas.

## Tillstånd och scope

- Loading: Skeleton.
- Empty: en EmptyState för inget publicerat relevant innehåll.
- Error: högst en åtgärdskrävande InfoBanner/notice med retry.
- Normal: Card/HeroCard, body och källor; legal/honesty-text som kort caption.

Avgränsade filer:

- `src/features/knowledge/KnowledgeScreen.tsx`
- `tests/knowledge-screen-policy.test.mjs`
- `tests/content-delivery.test.mjs` – endast strukturassertions som ändras av UI-migreringen.
- `docs/design-rules.md` section 14
- `docs/plans/UI-KNOWLEDGE-01-ux-spec.md`

Skyddat: content selection, published-only filtering, source URL validation och navigation.

## QA

Typecheck, lint, relevanta tester. Rendering NOT TESTABLE lokalt; Erik tar `Kunskap normal`, `Kunskap tom`, `Kunskap error`, `Kunskap stor text`.
