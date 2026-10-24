# Kunskap and Träning image presentation — local checkpoint

**Date:** 2026-10-22
**Branch:** `2026-10-22-panel7-insights-profile`
**Data:** public empty fixture and labelled synthetic review fixture. No user content was used.

## Render results

- `public/RESULTS.json`: **2/2 PASS**. Knowledge and Training show honest empty content at 375 and 430 px.
- `review/RESULTS.json`: **16/16 PASS**. Three stable guide IDs show three distinct images; the featured crop is 200 pt high and smaller crops are 132 pt high at 375/430 px. Home opens the exact guide ID and the current Training recommendation opens its exact next exercise. Training's continuation card uses the generated Corgi image at **88×88 pt** and opens that same exercise. Knowledge and Training image content is reachable above navigation at 375×667, with no horizontal overflow in the 140% CSS text proxy.
- Page errors: none in the checked screens.
- Captures include `review/knowledge-guides-375.png`, `review/knowledge-guides-430.png`, `review/home-knowledge-card-375.png`, `review/home-training-card-375.png`, `review/training-overview-375.png`, `review/training-overview-430.png`, `review/knowledge-short-375.png`, and `review/training-short-375.png`.

The captures were inspected. Knowledge shows three different dogs with clean, readable crops; the warm photos sit above each guide title and metadata. Training keeps its large 4:3 recommendation and uses a clear square Corgi crop for the in-progress exercise. The Corgi crop does not cover the title or progress, and the bottom menu remains visible.

## Home-route finding

The production `HomeScreen` uses a text-only `Just nu` card, matching the current Home contract. The `HomeCarousel` component containing a separate photo-card mapping has no production import and is not mounted in the Home route. The checkpoint does not count that inactive component as user-visible UI and does not add a photo treatment that would change the Home target. Home is checked for opening the exact guide ID or next exercise; the actual images are checked on Knowledge and Training. This supersedes the HomeCarousel image-continuity wording from the original v1 plan.

## §14 review

| Item | Result | Evidence / limit |
|---|---|---|
| 1. Clear next action | Yes, local | Guide and training cards open the named content. |
| 2. Equal actions | N/A | The image surfaces do not add peer primary actions. |
| 3. Delete confirmation | N/A | No delete action is part of this image slice. |
| 4. Home list rows | N/A | The image slice does not change Home checklist rows. |
| 5. Spacing, scroll and menu | Yes, local | 375/430 renders and 375×667; target crops remain reachable above navigation. Native safe-area testing remains separate. |
| 6. Shared tokens/components | Yes | Existing Knowledge/Training components; Training uses the shared 88 pt token. |
| 7. Icon family | N/A | No new icons. |
| 8. Color/image distribution | Yes, local | Three distinct Knowledge photos plus a separate Training continuation photo. Public without published data remains an honest empty state. |
| 9. Symbol/action match | Yes | The image is decorative and the named card opens the content beside it. |
| 10. Honest state | Yes, local | Images do not claim completion; the visible progress belongs to the synthetic review program only. |
| 11. Banner/encouragement | N/A | No image-slice banner. |
| 12. Copy | Yes, local | Existing guide/step copy is retained. |
| 13. Hierarchy/image share | Yes, local | 200/132 pt Knowledge hierarchy and 88×88 pt Training continuation crop match the updated target. |
| 14. Read states | Partial | Public empty and review ready states were rendered; loading/error states are outside this image-only checkpoint. |
| 15. Touch/accessibility/large text | Partial | Existing button labels remain; 140% CSS proxy passes. Native VoiceOver/Dynamic Type was not re-run. |
| 16. Full rev02 match | Partial | The active image surfaces were rendered; full Knowledge/Training panel acceptance remains a separate scope. |
| 17. Routes/back | Yes, local | Home guide and exercise actions open the exact destination; exercise opens its detail action. |
| 18. Dog/image role | Yes | Images are decorative editorial assets and are not described as the user's dog. |

## Boundaries

These are React Native Web renders of production components with synthetic callbacks. They do not verify native safe area/VoiceOver/Dynamic Type, published-content availability, live Supabase/RLS, migration application or full Panel 6/7 acceptance. The task is a local image-presentation checkpoint only.
