---
name: site-ui-verify
description: Check a change to the Foretype site by rendering it headless with playwright-core - full-page and per-section screenshots at 1440 and 390 px, in light and dark, with the changed section beside its sibling. Use after any change under site/src or site/index.html, before opening the PR.
---

# Verify a site change

A green build says the site compiles, not that it looks right. This skill
renders the built site the way a visitor sees it and gives you the images the
PR needs (UI-6). Look at every image before you say the change works.

## 1. Build and serve

```sh
cd site
npm ci
npm run lint
npm run build
npx vite preview --port 4173 --strictPort &   # serves dist/ at http://localhost:4173
```

## 2. Pick the sections

The page is the `<section>`s inside `<main>`, in the order `src/App.tsx`
renders them. Note the index of the section you changed (0-based) and of the
sibling next to it, so the reviewer sees the change in context. Changed the nav
or footer: use the first or last section as the sibling.

## 3. Capture

`playwright-core` is a site dev dependency; it drives the installed Chrome
(`channel: 'chrome'`). Without Chrome, run `npx playwright-core install
chromium` once and drop the `channel` option.

Run from `site/`, with `SECTIONS` set to the two indexes and `OUT` to a folder
outside the repo (screenshots are never committed, AGENTS-11):

```sh
SECTIONS=3,4 OUT="$TMPDIR/site-shots" node --input-type=module <<'JS'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const url = process.env.URL ?? 'http://localhost:4173'
const out = process.env.OUT
const sections = (process.env.SECTIONS ?? '0').split(',').map(Number)
const widths = [1440, 390]
const schemes = ['light', 'dark']
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })
for (const width of widths) {
  for (const colorScheme of schemes) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
    await page.goto(url, { waitUntil: 'networkidle' })
    // Scroll through once so every in-view reveal has fired before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 60))
      }
      window.scrollTo(0, 0)
    })
    const name = `${width}-${colorScheme}`
    await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true })
    for (const index of sections) {
      await page.locator('main > section').nth(index).screenshot({ path: `${out}/${name}-section-${index}.png` })
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    console.log(`${name}: horizontal overflow ${overflow}px, ${errors.length} console errors`, errors)
    await context.close()
  }
}
await browser.close()
JS
```

## 4. Check

Open every image (Read the PNGs) and check, at both widths and in both themes:

- the changed section matches the request and sits cleanly beside its sibling;
- no horizontal overflow at 390 px (the script prints it; it must be 0);
- no console errors;
- text and icons are readable in dark as well as light (UI-3), icons are
  lucide, no emoji (UI-1, UI-2);
- with reduced motion the section is in its settled state (SITE-5);
- every claim it makes is true of the app (SITE-1).

For a deeper pass on demand (a new section, a form, a control), review the
changed components against Vercel's Web Interface Guidelines
(https://github.com/vercel-labs/web-interface-guidelines): keyboard and focus,
hit targets, input sizes, motion, dark-mode color scheme. It is a review aid,
not a gate.

Fix what is wrong and capture again. Stop the preview server when done.

## 5. Report

Attach the section images (and the full pages when the layout moved) to the PR
description with `gh pr comment <n> --body-file` or the web editor; never
commit them. Report one line per width and theme: pass, or what is wrong.
