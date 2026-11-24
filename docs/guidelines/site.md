# Site

How the marketing site in `site/` (Vite, React, Tailwind, motion, three) is
written. Shared UI rules are [ui.md](./ui.md); the rules for every language are
[code.md](./code.md).

Every rule has an id (`SITE-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

**SITE-1. The site says only what is true of the app.** A feature the app does
not have yet is marked as planned, matching the README's status and roadmap; a
privacy claim matches [privacy.md](./privacy.md).

**SITE-2. The site runs no analytics, trackers or third-party scripts.** Data
comes from its own origin (`/activity.json`, `/milestones.json`); the only
outside request is the Google Fonts stylesheet.

**SITE-3. Long-form copy SHOULD live in `site/src/lib/content.ts`**, not inline
in components.

**SITE-4. Colors come from the theme tokens in `site/src/index.css`**, which
switch on `data-theme`. A component SHOULD NOT hardcode a color.

**SITE-5. Motion respects `prefers-reduced-motion: reduce`.** Every animation,
smooth scroll and 3D scene checks it and settles to a still state.

**SITE-6. Fetched JSON is checked with a type guard before use.** Load it through
`createJsonStore` in `site/src/lib/activity.ts` with an `is…` guard, and show an
unavailable state when the shape is wrong.

**SITE-7. `site/public/activity.json` is generated, never committed.**
`scripts/activity.mjs` builds it from git history at deploy time; commit
subjects go into it only with `--public`.
