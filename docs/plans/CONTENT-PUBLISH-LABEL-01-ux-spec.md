# CONTENT-PUBLISH-LABEL-01 UX-spec

## User goal and entry
A dog owner opens a published guide in Kunskap and can tell the text was AI-generated while reading it.

## Happy path
Open Kunskap → open an article/guide → see `AI-genererat innehåll` directly below the title and above the body. Existing source links stay in their source section. Training detail uses the same provenance field when opened.

## States and accessibility
The label is ordinary visible text, never color-only, and is announced as text by screen readers. Human-origin content has no AI label. Existing loading, error, empty, source-open feedback and back navigation are unchanged. Review fixtures retain their separate unreviewed-example banner.

## Visual contract comparison
- Article title: unchanged.
- AI provenance: currently absent → compact text label adjacent to article metadata, using existing caption/neutral notice tokens and no new icon/dependency.
- Sources: unchanged and remain below the body.
- Detail width/spacing: use existing card padding and token gaps; avoid adding a large banner that displaces the article.

## Scope
Only Knowledge article/program detail UI and content-origin mapping. No new tabs, content, tracking, or onboarding.

## Verification limit
Code and rendered tests can verify conditional text/accessibility. Visual screenshot comparison is NOT TESTABLE unless the existing RN Web workflow can produce the screen in this environment.
