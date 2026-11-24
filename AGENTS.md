# AGENTS.md

Foretype is local-first autocomplete for macOS: `app/` is the Swift package
(the app, its engine and adapters), `site/` the marketing site, `scripts/` the
repo checks. `CLAUDE.md` is the one line `@AGENTS.md`, which imports this file.

## Non-negotiables

- **Nothing leaves the Mac.** The only network code is the model download in
  `ModelStore.swift`; no telemetry, ever (PRIV-1, PRIV-4).
- **Captured text is never stored or logged.** It lives in memory, is dropped
  on blur, and loggers never see it (PRIV-3, PRIV-6).
- **Never touch the clipboard** (PRIV-2).
- **Fail open.** If permissions, taps or the engine fail, typing keeps working
  exactly as without Foretype (SEC-1).
- **Every rule lives in exactly one place, with an id**, and a check enforces
  it or `enforcement-notes.json` names the reviewer (AGENTS-2 to AGENTS-4).
- **A failing check is fixed, never silenced.** Waivers are explicit, reasoned
  lines in the PR and a commit (CODE-25, AGENTS-12).
- **Docs are few and current.** Present tense, no dates, except the closed list
  of history docs: `docs/DEVLOG.md`, `docs/PLAN.md`, `docs/RESEARCH.md`,
  `CHANGELOG.md` (DOC-1 to DOC-3).
- **Smallest true diff.** One cause, one change; reuse before adding (CODE-1,
  CODE-8).

## Where the rules live

Read the `AGENTS.md` nearest the file you change, then the guidelines it names.

| Working in… | Read |
| --- | --- |
| Any code | `docs/guidelines/code.md` (CODE) |
| `app/` | `app/AGENTS.md`, then `app/Sources/<Module>/AGENTS.md` |
| Swift | `swift.md` (SWIFT), `concurrency.md` (CONC), `privacy.md` (PRIV), `observability.md` (OBS) |
| Module boundaries, `Package.swift`, `Contracts/` | `modules.md` (MOD), `docs/guides/contracts.md` |
| Tests, fakes, `app/E2E/` | `testing.md` (TEST) |
| Signing, entitlements, input safety | `security.md` (SEC) |
| App or site UI | `ui.md` (UI); the site also `site/AGENTS.md` and `site.md` (SITE) |
| Rules, skills, agent workflow | `agents.md` (AGENTS), `docs/guides/guidelines.md` |
| Docs | `docs.md` (DOC) |
| Branches, commits, PRs, waivers | `CONTRIBUTING.md`, `.github/pull_request_template.md` |
| How the app works | `docs/architecture.md` |

Guidelines are in `docs/guidelines/`. Every id, where it is defined and what
enforces it: `docs/guidelines/rules-index.md` and `enforcement.md` (generated).

How each agent gets them:

- **Claude Code** loads the nearest `CLAUDE.md` (which imports `AGENTS.md`)
  and the digest in `.claude/rules/` whose `paths` match the file you open.
  A PostToolUse hook (`.claude/hooks/lint-edited-file.mjs`) formats each file
  you edit and lints it with SwiftLint or oxlint; it says once when a tool is
  missing. A SessionStart hook prints `make doctor`.
- **Codex, Cursor and others** read this file; open the nearest `AGENTS.md`
  and the guidelines it names before editing.

## Skills

Procedures live in `.agents/skills/` (mirrored in `.claude/skills/`). Use the
one that matches the task:

| Task | Skill |
| --- | --- |
| One change end to end, issue to PR | `/implement-change` |
| Self-review for slop before a PR | `/deslop` |
| Check a site change (screenshots at 1440 and 390, light and dark) | `/site-ui-verify` |
| Check an app UI change (build, run, screenshot) | `/app-ui-verify` |
| Turn repeated review corrections into rules | `/learn-from-reviews` |

## Running locally

```sh
make bootstrap   # once: tools, git hooks, site dependencies
make verify      # the CI checks, on what you changed
```

`docs/guides/verify.md` has the flags. The app alone: `cd app && swift build &&
./scripts/test.sh`; building, signing and the end-to-end harness are in
`docs/architecture.md` § Build, sign, test.

## Before you call it done

- [ ] `make verify` is green on what you touched (CODE-24); nothing is called
      done while a check is red (CODE-25).
- [ ] A bug fix has a test that failed on the old code (TEST-7).
- [ ] No new network path, clipboard use, or logged text (PRIV-1 to PRIV-3).
- [ ] The guide your change made untrue is updated; no dated entry outside the
      history docs (DOC-2, DOC-3).
- [ ] `/deslop` ran on the branch diff (AGENTS-10); nothing stray is committed
      (AGENTS-11).
- [ ] UI changes have screenshots in the PR, light and dark (UI-6).
- [ ] The PR template is filled in, with every waiver also in a commit message
      (AGENTS-12).
