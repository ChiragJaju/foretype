# Agents and the rule system

How the rules are kept, and how an agent (or a person) works a change through
the repo. How the files fit together is [guidelines.md](../guides/guidelines.md);
branching, commits and PRs are `CONTRIBUTING.md`.

Every rule has an id (`AGENTS-4`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. The rule files

**AGENTS-1. Every `AGENTS.md` has a `CLAUDE.md` beside it that is the one line
`@AGENTS.md`.** Claude Code imports the rules through it; a symlink or a copy
does not count.

**AGENTS-2. A rule is defined once, as `**PREFIX-n. Sentence.**` at the start of
a line, in at most 60 words.** The detail follows in the same paragraph; an
example goes in a fenced block after it. Everywhere else cites the id.

**AGENTS-3. A shared rule lives in `docs/guidelines/`; a rule for one module
lives in that module's `AGENTS.md` with a scoped id.** `MOD-core-1` belongs to
`app/Sources/ForetypeCore/AGENTS.md` alone, and an `AGENTS.md` defines no shared
numbers.

**AGENTS-4. Every rule is enforced by a check that declares it, or
`docs/guidelines/enforcement-notes.json` says why a reviewer does.** A check
declares its ids in `scripts/check-<name>.rules.json`; an outside tool's rules
map to ids in `docs/guidelines/tool-enforcement.json`.

**AGENTS-5. `rules-index.md` and `enforcement.md` are generated, never edited by
hand.** Run `node scripts/generate-guidelines.mjs` after changing a rule, a
declaration or a note.

## 2. Skills

**AGENTS-6. A skill's source is `.agents/skills/<name>/SKILL.md`, and
`.claude/skills/<name>` is the relative symlink `../../.agents/skills/<name>`.**
Edit the source; the mirror follows.

**AGENTS-7. A `SKILL.md` is at most 200 lines and opens with front matter giving
its `name` (the folder name) and a `description`.** Longer detail goes in a file
beside it.

**AGENTS-15. Agent files follow their tool's format.** `AGENTS.md`,
`CLAUDE.md`, `.claude/rules/*.md`, `.claude/settings.json` and each `SKILL.md`
use only the front-matter keys their tool reads, and every file path they cite
resolves from the file's folder or the repo root.

## 3. Working a change

**AGENTS-8. One task per worktree, on a lowercase branch cut from a freshly
fetched `origin/main`.** The maintainer's and agents' branches are
`chiragjaju/<slug>`; a fork names its own.

**AGENTS-9. Commits follow Conventional Commits with a scope from the list in
`CONTRIBUTING.md`.** `type(scope): summary`, imperative, lowercase.

**AGENTS-10. Run `/deslop` on the branch diff before opening or updating a
PR.** It applies these rules to the lines you changed and removes what breaks
them.

**AGENTS-11. Nothing stray is committed.** No plans, notes, hand-offs,
transcripts, scratch scripts, screenshots or unrelated generated files. Markdown
lives only where `CONTRIBUTING.md` § Documentation says.

**AGENTS-12. A waiver is one line, `TAG(<id>): <reason>`, in the PR body and in
a commit message.** Outside code blocks, quotes and backticks, with a reason.
The tags are listed in `CONTRIBUTING.md` § Waivers.

**AGENTS-13. A correction that recurs in review becomes a rule.** It gets an id
in the file that owns its topic and, where a tool can see it, a check, through
`/learn-from-reviews`, in its own PR.

**AGENTS-14. A file a `## Copy from` table names exists and is a clean model.**
Agents copy it, so it carries no lint or type-check disable and passes SwiftLint
or oxlint with no findings.

**AGENTS-16. No tracked file is over 1 MB, except the npm lockfiles.** Images,
recordings and models stay out of git; a model is downloaded and pinned
(SEC-7).
