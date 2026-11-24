# make verify

One command for the checks CI runs, on the scope you name. CI stays the
verdict; `make verify` is the fast local answer before you push. The runner is
`scripts/verify.mjs`.

```sh
make verify                                      # the checks CI runs, on what you changed
node scripts/verify.mjs --changed                # only the files changed against origin/main
node scripts/verify.mjs --changed --tier fast    # only the fast checks
node scripts/verify.mjs --list                   # the plan: which checks would run; runs nothing
```

Every `scripts/check-*.mjs` and every `scripts/*.test.mjs` suite runs on its
own, with no list to update: a new repo check is picked up by its file name.
`--list` prints the current checks and the command each runs.

A failing check is fixed, never silenced (CODE-25). The rule ids each check
enforces are in [rules-index.md](../guidelines/rules-index.md).

## What runs where

Every check blocks from the start: there are no baselines. With `--changed`, a
linter runs only when a file of its kind changed.

| Stage | Budget | Runs |
| --- | --- | --- |
| pre-commit (`.githooks/pre-commit`) | about 2 s, staged files only | the 1 MB limit, gitleaks; swift-format and SwiftLint on staged Swift; oxfmt on staged site and script files, oxlint (no type information) on staged site files; shellcheck on staged `*.sh` and hooks; typos on every staged file; actionlint and zizmor only when a workflow is staged; agnix only when an agent file is staged |
| pre-push (`.githooks/pre-push`) | about 30 s | `verify.mjs --changed --tier fast`: the repo tier and the lint tier below, on the branch's changes |
| CI | minutes | Repo checks: `verify.mjs --tier repo` on every file; Lint: SwiftLint, swift-format, oxfmt, `oxlint --type-aware --deny-warnings`, knip; Type-check; Unit tests: the app tests and the site's Vitest suite |

The tiers nest:

- **repo**: every `scripts/check-*.mjs`, the node tests, and the repo linters
  shellcheck, typos (`_typos.toml`), actionlint, `zizmor --offline` and
  `agnix --strict`.
- **fast**: adds SwiftLint, swift-format, oxfmt, `oxlint --type-aware
  --deny-warnings` and knip (`site/knip.jsonc`; any site change runs it on the
  whole site).
- **full**: adds `tsc -b`, `swift build`, the app unit tests and the site's
  Vitest suite (`npm test` in `site/`, one worker).

## The repo checks

| Check | Fails on |
| --- | --- |
| `check-guidelines` | the rule system ([guidelines.md](guidelines.md)) |
| `check-anti-slop` | on lines the branch adds: `TODO`, `FIXME`, `HACK`, a `// removed` or `// old` marker, a disable comment without its rule and reason, and any SwiftLint or oxlint finding, warnings included |
| `check-budgets` | a SwiftUI `body` over 80 lines (CODE-22) and a `.tsx` function that is not a component over 50 (CODE-20); SwiftLint and oxlint hold the other budgets |
| `check-imports` | an import or `Package.swift` edge outside MOD-1, MOD-2 or MOD-7, `llama` outside `LlamaEngine.swift`, a wall-clock read in Core, a network or clipboard API, a telemetry SDK |
| `check-contracts-frozen` | a change to `Contracts/` or `Threading.swift` without a `CONTRACT-CHANGE` waiver and a `contracts.md` update |
| `check-doc-currency` | code in `scripts/doc-currency-map.json` changed without its guide, unless `DOC-SKIP(<id>)` |
| `check-quarantine` | a skipped test without a quarantine line, or one expired or more than 30 days out |
| `check-large-files` | a tracked file over 1 MB other than the lockfiles |
| `check-exemplars` | a `## Copy from` file that is missing, carries a disable, or has a lint finding |

A length is counted in code lines from the declaration to its closing bracket;
blank and comment-only lines do not count. The checks that judge a branch
compare with `VERIFY_BASE` (set by `--changed`) or the merge base with
`origin/main`, and read waivers from the branch's commit messages and, in CI,
the PR body ([CONTRIBUTING.md](../../CONTRIBUTING.md) § Waivers). A check whose
linter is missing locally says so and skips that part; CI's Lint job lints
every file.

Periphery (dead Swift code) is not wired in: it needs a full Xcode index, so it
would only fit a manual or nightly run.
