---
name: learn-from-reviews
description: Mine recent Foretype PR reviews for corrections that recur and make each one hold next time, as a check where a tool can see it, else a rule with an id in the file that owns the topic. Opens its own PR. Run after a heavily reviewed PR merges, or every few weeks.
---

# Learn from reviews

Turn review comments that keep coming back into rules and checks, so the same
comment is not needed again (AGENTS-13). The output is one PR that may edit
only:

- the rule homes in the root `AGENTS.md` § Where the rules live: a
  `docs/guidelines/*.md` file or a module `AGENTS.md`;
- the checks: `scripts/check-*.mjs` with its `*.rules.json` and tests,
  `docs/guidelines/tool-enforcement.json`, `.swiftlint.yml` custom rules;
- `docs/guidelines/enforcement-notes.json`, the `.claude/rules/*.md` digests,
  and the generated index.

## Arguments

Optional: PR numbers (`12 15`), or `--since YYYY-MM-DD`. With none, use every
PR merged since the last `docs(repo): rules from reviews` commit on
`origin/main` (`git log -1 --format=%cs --grep='^docs(repo): rules from reviews' origin/main`),
minus one day.

## 1. Collect

Evidence is a correction someone acted on: a review comment followed by a fix
commit, or a "fixed in <sha>" reply.

```sh
gh pr list --state merged --search "merged:>=<since>" --json number --jq '.[].number'
gh api repos/{owner}/{repo}/pulls/<n>/comments --paginate --jq '.[] | "\(.user.login)\t\(.path):\(.line // .original_line)\t\(.body)"'
gh api repos/{owner}/{repo}/pulls/<n>/reviews --paginate --jq '.[] | select(.body != "") | "\(.user.login)\tREVIEW\t\(.body)"'
gh api repos/{owner}/{repo}/issues/<n>/comments --paginate --jq '.[] | "\(.user.login)\tISSUE\t\(.body)"'
```

Read the commits pushed after each comment (`gh pr view <n> --json commits`,
then `git show`): what the author changed is often a clearer statement of the
rule than the comment.

## 2. Distil

Default is **reject**. Every rule costs attention on every future change, so a
theme becomes a rule only if it passes all of these:

1. **Recurs.** Two separate occurrences, or one where the reviewer states it as
   general ("we always…", "never…").
2. **Generalizes.** The next change in an unrelated area could break it.
3. **Is a choice, not a bug.** The author picked a worse pattern that compiled
   and passed tests.
4. **Is not already enforced.** Not caught by the compiler, SwiftLint,
   swift-format, oxlint, `tsc`, a repo check or a test, and not already a
   rule: `git grep` the key noun across `docs/guidelines/` and
   every `AGENTS.md` first. If a rule almost covers it, sharpen that rule.
5. **Is checkable from a diff.** A reviewer can point at a line.
6. **Costs less than it saves** across the next twenty PRs.

Cap a run at about six new rules. Record every rejected theme with the
criterion it failed.

## 3. Apply

Give each admitted theme the strongest home that holds it, in this order:

1. **A type or a test** that makes the mistake impossible or pins it.
2. **A lint rule** when one line shows the violation: a SwiftLint custom rule
   in `.swiftlint.yml` (its message cites the rule id) mapped in
   `tool-enforcement.json`.
3. **A repo check** when it needs the whole tree: `scripts/check-<name>.mjs`,
   its `scripts/check-<name>.rules.json`, and a `node:test` case that fails the
   bad input and passes the good one.
4. **A rule only**, when no tool can see it, with its note in
   `enforcement-notes.json`.

Every theme gets its rule in the file that owns the topic, as
`**PREFIX-n. Sentence.**` with the next free id (`docs/guides/guidelines.md`).
Then run `node scripts/generate-guidelines.mjs` and `make verify`.

## 4. Ship

If nothing passed, print the rejected table and open nothing. Otherwise: a
fresh worktree off `origin/main`, one commit, PR titled
`docs(repo): rules from reviews <since>..<today>`, with two tables in the
body:

- **Added:** theme → evidence (PR numbers) → enforced by → rule id and file.
- **Rejected:** theme → evidence → failing criterion.

Report the PR URL (or "no PR — nothing passed") and the two tables.
