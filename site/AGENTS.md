# site/ — the marketing site

A Vite + React 19 single page with Tailwind 4, `motion`, three.js and
`lucide-react`, deployed to Vercel by `.github/workflows/activity.yml`.
Sections are in `src/components/` (order in `src/App.tsx`), shared logic and
copy in `src/lib/`, static files in `public/`.

## Guidelines

`docs/guidelines/site.md` (SITE), `docs/guidelines/ui.md` (UI) and
`docs/guidelines/code.md` (CODE). The site makes no claim the app does not back
(SITE-1).

## Copy from

| Need | Exemplar |
| --- | --- |
| Fetching same-origin JSON with a type guard | `src/lib/activity.ts` (`createJsonStore`) |
| Theme state shared across components | `src/lib/theme.ts` |
| Long-form copy | `src/lib/content.ts` |

## Commands

Run from `site/`.

```sh
npm ci
npm run dev       # local server
npm run lint      # oxlint
npm run build     # tsc -b, then vite build
```

## Before you finish

- [ ] `npm run lint` and `npm run build` pass.
- [ ] `/site-ui-verify` screenshots at 1440 and 390 px, light and dark, are in the PR (UI-6).
