# UI

How Foretype's surfaces look and behave: the macOS app (menu bar, onboarding,
settings, the ghost panel) and the site. Site-only rules are
[site.md](./site.md).

Every rule has an id (`UI-3`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

**UI-1. Icons are lucide glyphs.** `lucide-react` on the site; in the app, a
template image drawn in code from the lucide path (no SF Symbols, no SwiftPM
resources).

**UI-2. No emoji in product UI**, in the app or on the site.

**UI-3. Every surface works in light and dark.** The app uses system semantic
colors (`labelColor`, `secondaryLabelColor`, materials) so it follows the
system appearance; the site uses its theme tokens (SITE-4).

**UI-4. Every control has an accessibility label, and the ghost panel's label
is exactly the text it shows.** VoiceOver users hear the suggestion, and the
XCUITest cases read the label to assert the ghost text.

**UI-5. The ghost panel never takes focus or clicks.** It is a borderless,
non-activating, click-through panel at the caret, or an inline card beside the
field when the caret is only estimated.

**UI-6. A PR that changes UI shows it.** Screenshots in the PR description:
the site at 1440 and 390 px, the app in its window size, each in light and dark,
beside the sibling surface it sits next to. Images are attached, never committed.
