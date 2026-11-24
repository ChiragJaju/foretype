# Guidelines: rule files, ids and enforcement

How Foretype's rules are written, where each lives, and how a check declares
the rules it enforces. `node scripts/check-guidelines.mjs` checks all of it,
in the required `Repo checks`.

## Where rules live

| Tier | Files | Ids |
| --- | --- | --- |
| Shared | `docs/guidelines/<family>.md` | `CODE-n`, `SWIFT-n`, `CONC-n`, `PRIV-n`, `MOD-n`, `OBS-n`, `TEST-n`, `SEC-n`, `UI-n`, `SITE-n`, `AGENTS-n`, `DOC-n`, each family in its one file |
| Module | `app/Sources/<Module>/AGENTS.md` | `MOD-<module>-n` (`MOD-core-1`, `MOD-engine-2`), owned by that one file |
| Routers | `AGENTS.md`, `app/AGENTS.md`, `site/AGENTS.md` | none: they point at the files above and cite ids |

Every `AGENTS.md` has a `CLAUDE.md` beside it that is the one line
`@AGENTS.md`. The root `AGENTS.md` table says which file to read for which
work.

## Writing a rule

- A definition opens its line: `**PREFIX-n. Sentence.**`, then the detail in
  the same paragraph, at most 60 words in all. An example goes in a fenced
  block after the paragraph.
- **MUST** / **MUST NOT** are required; **SHOULD** is required unless the PR
  says why not; no keyword means **MUST**.
- Write a rule only for what is true in the repo or already decided. No
  history and no incident story; those go in the PR.
- An id keeps its number for good. A new rule takes the next number in its
  file; a deleted rule's number is never reused.
- A module rule takes the next `MOD-<module>-n` in that module's `AGENTS.md`.

## Declaring what enforces a rule

Each rule is enforced by a check, or a note says why a reviewer does
(AGENTS-4).

- **A repo check** `scripts/check-<name>.mjs` declares its ids in
  `scripts/check-<name>.rules.json`, a JSON array:

  ```json
  ["AGENTS-1", "DOC-1"]
  ```

- **An outside tool** (SwiftLint, swift-format, the compiler, `tsc`, oxlint,
  knip, typos, shellcheck, actionlint, zizmor, agnix, commitlint, gitleaks) maps its own rule names to ids in
  `docs/guidelines/tool-enforcement.json`:

  ```json
  { "swiftlint": { "runsIn": "Lint", "rules": { "no_print": ["OBS-1"] } } }
  ```

- **Review**: `docs/guidelines/enforcement-notes.json` holds one line per rule
  no check fully covers, saying why it is review or what a partial check
  leaves out. When a check starts covering a rule, delete its note.

## Generated files

`node scripts/generate-guidelines.mjs` writes `docs/guidelines/rules-index.md`
(every id, its file, what enforces it) and `docs/guidelines/enforcement.md`
(`enforcement.intro.md`, the tools, then a table per rule file with the
notes). Never edit them by hand; a merge conflict in one is fixed by running
the generator. `--check` exits 1 when either is stale.

## Adding or changing a rule

1. Edit the rule in its one file (or add it with the next id).
2. Declare its check in the check's `*.rules.json` or in
   `tool-enforcement.json`, or add its note to `enforcement-notes.json`.
3. Run `node scripts/generate-guidelines.mjs`, then
   `node scripts/check-guidelines.mjs` and
   `node --test scripts/check-guidelines.test.mjs`.
4. A new guideline file also gets a `.claude/rules/<name>.md` digest with the
   `paths` it governs, a row in the root `AGENTS.md` table, and its prefix in
   `FAMILIES` in `scripts/check-guidelines.mjs`.

Recurring review corrections become rules through `/learn-from-reviews`, in a
PR of their own (AGENTS-13).

## What `check-guidelines` fails on

- a duplicate id, a definition not in the `**PREFIX-n. Sentence.**` form, a
  rule over 60 words, or a rule outside its family's file or module file;
- a declaration or note naming an undefined id, or a rule with neither;
- an `AGENTS.md` without its one-line `CLAUDE.md`;
- a skill whose `.claude/skills/<name>` is not the relative symlink to
  `.agents/skills/<name>`, or whose `SKILL.md` lacks `name` and `description`
  or runs past 200 lines;
- a file in `docs/` or a Markdown file at the root outside the allowlist, or a
  stray Markdown file anywhere else (`CONTRIBUTING.md` § Documentation);
- a date in a doc outside the history docs;
- a stale generated file.

Each problem prints as `path:line: RULE-ID message`.
