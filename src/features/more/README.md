# Mer

`MoreScreen` is the presentational menu for existing support and account routes. It groups the three dog destinations separately from reminders and account/support. Each destination keeps its established callback and route in `ProductWorkspace`.

The opt-in `tokens.colors.support.*` roles distinguish the existing destination families with color and icon; they do not change global component defaults. Sign-out confirmation, progress, and error recovery remain owned by `ProductWorkspace` and are passed into this screen.

`tools/visual-check/app.tsx` mounts the same screen with local display fixtures. That web preview is not production data or native-device/accessibility certification.
