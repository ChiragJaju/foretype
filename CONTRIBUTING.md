# Contributing to Foretype

Foretype is pre-alpha. The app is not usable yet, so the most helpful things
right now are bug reports on the plan, test results from your own apps, and
small focused pull requests. Open an issue before you start on anything large.

The rules for the code are in [AGENTS.md](AGENTS.md) and `docs/guidelines/`,
each with an id (`CODE-4`, `PRIV-2`); this file is the process around them.

## Dev setup

You need an Apple Silicon Mac on macOS 26 or later, Xcode 27 or the Command
Line Tools, Node 24 and Homebrew.

```sh
git clone https://github.com/ChiragJaju/foretype.git
cd foretype
make bootstrap          # npm installs, git hooks, the Brewfile linters; ends with make doctor
make verify             # the checks CI runs: repo checks, lint, type-check, build, tests
```

Run `app/scripts/dev-sign.sh` once so your Accessibility grant survives
rebuilds, then build the app with `app/scripts/bundle.sh`. Details:
[docs/architecture.md](docs/architecture.md) § Build, sign, test and
[docs/guides/verify.md](docs/guides/verify.md).

## Branching

- `main` is always green. Every change lands through a pull request.
- One task per branch, and per worktree when you run several at once, cut
  from a freshly fetched `origin/main` (AGENTS-8).
- Branch names are lowercase: `chiragjaju/<slug>` for the maintainer and
  agents, any lowercase `<name>/<slug>` on a fork.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) with a scope,
checked by commitlint (AGENTS-9):

```text
<type>(<scope>): <summary>
```

**Types:** `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`,
`chore`.

**Scopes:** `app`, `core`, `engine`, `mac`, `ui`, `eval`, `site`, `docs`, `ci`,
`repo`, `deps`, `design`.

```text
fix(core): drop a stale completion after the field changes
feat(site): add the privacy section's network-monitor demo
docs(repo): add the threading rules to concurrency.md
```

Keep commits small; say what changed and why. By contributing, you agree that
your work is released under the [MIT License](LICENSE).

## Pull requests

1. Branch from `main` and follow the rules the nearest `AGENTS.md` names.
2. `make verify` is green on what you touched (CODE-24).
3. Run `/deslop` on the branch diff (AGENTS-10), or do the same pass by hand:
   remove what the rules forbid from the lines you changed.
4. Open the PR against `main` with `.github/pull_request_template.md` filled
   in. The reasoning that justifies the code goes in the description, not in
   comments.
5. CI must pass the required checks: **Repo checks**, **Lint**,
   **Type-check** and **Unit tests**.
6. PRs are squash-merged.

Foretype has one maintainer and no review bot. A maintainer cannot approve
their own PR, so branch protection requires the checks above and no
approvals. Waivers that would need a second approver (a budget or a baseline
that grows) are reported by their checks, not enforced, until a second
approver exists.

### In review

- Answer every review comment: `Fixed in <sha>` with what changed, or a
  reasoned decline.
- A finding about a pre-existing gap is out of scope: say so, open an issue,
  and keep the diff on its own change.
- Corrections that keep recurring become rules through `/learn-from-reviews`
  (AGENTS-13).

### Waivers

A waiver is one line, `TAG(<id>): <reason>`, in the PR body **and** in a
commit message (an empty commit is fine). A waiver inside a code block, quote
or backticks does not count, and the reason is required (AGENTS-12).

| Waiver | Waives |
| --- | --- |
| `DOC-SKIP(<id>): <reason>` | updating a guide although the PR touches its code; the ids are in `scripts/doc-currency-map.json` (DOC-3) |
| `CONTRACT-CHANGE(<reason>)` | a change to `app/Sources/ForetypeCore/Contracts/`, `Threading.swift` or a frozen entry point (MOD-3, MOD-6) |
| `BUDGET-SKIP(<rule-id>): <reason>` | one `check-budgets` budget (CODE-20 or CODE-22): the check prints it and passes; a SwiftLint or oxlint budget takes a disable comment with its rule and reason |

### Nothing stray

No plan files, notes, hand-offs, transcripts, scratch scripts, screenshots or
unrelated generated files in the diff (AGENTS-11). UI changes put screenshots
in the PR description: the site at 1440 and 390 px and the app, each in light
and dark (UI-6).

## Documentation

Docs stay few and current. Foretype is built in public, so it keeps a closed
list of history docs; everything else says what is true now.

- **`docs/` holds only** `guidelines/` (the rules), `guides/` (one living
  guide per subsystem), `assets/`, `architecture.md`, and the history docs
  (DOC-1).
- **The history docs** are `docs/DEVLOG.md`, `docs/PLAN.md`,
  `docs/RESEARCH.md` and the root `CHANGELOG.md`. Only they carry dates and
  past tense.
- **At the root** the Markdown files are `README.md`, `CONTRIBUTING.md`,
  `SECURITY.md`, `CHANGELOG.md`, `AGENTS.md` and `CLAUDE.md`, beside
  `LICENSE`. Elsewhere, Markdown lives only in `AGENTS.md` and `CLAUDE.md`
  files, `.agents/skills/`, `.claude/rules/`, `.github/` and `design/` (the
  design reference folder).
- **Update the guide your change makes untrue** (DOC-3). A guide is in the
  present tense: no dates, no "previously", no plans (DOC-2). `git log`, the PR
  and the history docs own what changed and when.
- **Verification is an executable test or check**, never a prose checklist
  in a doc (DOC-5).
- **CI enforces it.** `scripts/check-guidelines.mjs` fails on a file outside
  this list or a date in a living doc.

## Privacy

Foretype reads other apps' text, so its privacy rules are code rules
(`docs/guidelines/privacy.md`): no network call outside the model download,
no clipboard, no logging of field or screen text, no telemetry. Report a
privacy or security issue privately, as [SECURITY.md](SECURITY.md) describes.
