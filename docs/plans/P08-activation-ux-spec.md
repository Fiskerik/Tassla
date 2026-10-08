# P08 activation spec

Date: 2026-10-08. Scope: complete the voluntary kennel-code path using the existing `create_dog(..., kennel_code)` contract. Owner decision: kennel attribution is optional, retained only for the same installation/onboarding for up to seven days, and not visible to kennels. No pilot codes or install URLs are created here.

## User goal and flow

An owner opens a `tassla://join?code=...` link, may sign in, then sees the code on the dog-profile form. They can correct or remove it. Before creation, they explicitly choose whether to connect the source code to their profile. Ordinary onboarding remains unchanged when no code is present or the owner removes it.

## States and feedback

- Invalid deep links are ignored; malformed manual codes are explained beside the field.
- An inactive/unknown code is reported as unrecognized and remains editable/removable.
- The owner may remove the code or leave source attribution unchecked.
- Duplicate submit is blocked. After an uncertain write, continue only if the active account's dog profile and exact attribution both read back as requested; otherwise show an uncertain status and allow a readback retry, never a blind second create.
- Clear the pending secure value after explicit removal, verified creation, or explicit sign-out. Keep it through auth loading/sign-in.

## Accessibility and design

Use the existing form/button/message components and theme tokens. Label the source field and explicit source-choice checkbox; preserve 44 pt touch targets, readable error text and keyboard scrolling. No new animation is needed. Screenshot/device rendering is required for visual PASS; absent renderer means NOT TESTABLE.

## Files and protected areas

Planned writes: `src/onboarding-referral/referral-model.ts`, `referral-secure-storage.ts`, module README; `src/features/home/AppFlow.tsx` deep-link ingress; `src/features/account/AuthProvider.tsx`; `src/features/onboarding/ProfileScreen.tsx`; `src/data/app-data.ts`, `src/data/contracts.ts`; one additive Supabase migration and synthetic SQL test; focused Node tests; synthetic QR example and P08 release log. No install URL, real kennel seed, kennel portal, analytics or owner/kennel data sharing. Existing auth callback route and `create_dog` transaction remain intact.
