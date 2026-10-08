# MVP content approval — bundle v1

Approval date: 2026-10-08 (Europe/Stockholm)
Bundle: `mvp-content-bundle-v1`
Scope: the ten runtime-supported version 1 records listed below.

Erik confirmed in the product-owner conversation on 2026-10-08 that the MVP content bundle is approved and that the dog expert has verified it. This record documents that confirmation; it does not claim the expert personally authored or signed this repository file. No content body or claim trace was changed as part of recording approval.

## Approved versions

| Slug | Version ID | Human approval | Dog-expert gate |
| --- | --- | --- | --- |
| first-week | `62000000-0000-4000-8000-000000000002` | Approved by Erik | Confirmed verified by Erik |
| daily-log-routines | `62000000-0000-4000-8000-000000000003` | Approved by Erik | Not required by content policy |
| handling-guide | `62000000-0000-4000-8000-000000000004` | Approved by Erik | Confirmed verified by Erik |
| environment-checklist | `62000000-0000-4000-8000-000000000005` | Approved by Erik | Confirmed verified by Erik |
| being-alone-guide | `62000000-0000-4000-8000-000000000006` | Approved by Erik | Confirmed verified by Erik |
| weight-history-guide | `62000000-0000-4000-8000-000000000007` | Approved by Erik | Not required by content policy |
| health-records-guide | `62000000-0000-4000-8000-000000000008` | Approved by Erik | Not required by content policy |
| handling-program | `62000000-0000-4000-8000-000000000009` | Approved by Erik | Confirmed verified by Erik |
| environment-program | `62000000-0000-4000-8000-000000000010` | Approved by Erik | Confirmed verified by Erik |
| being-alone-program | `62000000-0000-4000-8000-000000000011` | Approved by Erik | Confirmed verified by Erik |

`before-homecoming` (`62000000-0000-4000-8000-000000000001`) remains a draft. It is marked `onboarding-only`, while the current database schema and runtime feed do not carry/enforce that context. Publishing it before a context-aware onboarding path exists could expose it in the ordinary age-based feed. It therefore remains hidden until that runtime contract is implemented and reviewed.

Approval metadata is not a database deployment. The published-version SQL must be applied to the intended Supabase environment and verified there before the approved content is visible in that environment.
