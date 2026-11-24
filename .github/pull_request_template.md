## What

What changed, at a glance. Link the issue if there is one.

## Why

The problem this solves. The reasoning that justifies the code goes here, not in code comments.

## How

Key decisions and trade-offs; anything a reviewer would otherwise have to reconstruct.

## Scope

The modules or areas this touches (`core`, `engine`, `mac`, `app`, `eval`, `site`, `docs`, `repo`), and one line for anything outside the issue's area and why.

## Verification

Commands run and what they covered (`make verify`, targeted `./scripts/test.sh --filter …`, `/app-ui-verify`, `/site-ui-verify`). For a bug fix, the test that failed on the old code (TEST-7). Map each criterion to its test when there are criteria.

### Screenshots (UI changes only)

Attach images; never commit them (UI-6).

- [ ] Site: the changed section beside its sibling at 1440 and 390 px, light and dark
- [ ] App: the changed surface beside its sibling, light and dark

## Waivers

Each on its own line, also in a commit message (`CONTRIBUTING.md` § Waivers), or `None`.

## Guidelines touched

The guideline files and module `AGENTS.md` files whose rules this change had to follow, or that it changes.

## Checklist

Each item is `[x]`, `N/A`, or `[ ] — reason`.

- [ ] Reuse first, nothing added unused, one cause per change (CODE-1 to CODE-8)
- [ ] No new network path, clipboard use, telemetry, or logged user text (PRIV-1 to PRIV-4)
- [ ] Typing still works if permissions, taps or the engine fail (SEC-1)
- [ ] Module boundaries kept; no contract change without `CONTRACT-CHANGE` (MOD-1 to MOD-6)
- [ ] Tests pin behavior; a bug fix has a test that failed first (TEST-5 to TEST-7)
- [ ] Size budgets kept, or `BUDGET-SKIP` with a reason (CODE-18 to CODE-22)
- [ ] The guide this made untrue is updated; no dated entry outside the history docs (DOC-2, DOC-3)
- [ ] `/deslop` ran; nothing stray committed (AGENTS-10, AGENTS-11)
- [ ] `make verify` green (CODE-24)
