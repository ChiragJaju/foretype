---
name: implement-change
description: Take one Foretype change (an issue, a feature or a bug) from criteria to an open PR in its own worktree - criteria, explore, plan, failing test first for bugs, smallest change, verify, deslop, PR with the template. Use when asked to implement, build or fix something end to end.
---

# Implement a change

The rules for the code are the guidelines the root `AGENTS.md` lists; this is
the order of work. Follow them, do not restate them.

## 1. Worktree

One task, one worktree, cut from a freshly fetched `origin/main`, on a
lowercase branch `chiragjaju/<slug>` (AGENTS-8):

```sh
git fetch origin main
git worktree add ../foretype-wt/<slug> -b chiragjaju/<slug> origin/main
```

## 2. Criteria

Turn the request into numbered criteria (`AC1`, `AC2`), each an outcome a user
would notice, with the test level that proves it (`docs/guidelines/testing.md`):

```text
AC1  Typing `n` after a yes/no question switches the ghost to "no".  → Core pipeline test
AC2  A secure field reads nothing.                                   → Core pipeline test (readFieldIDs)
AC3  Tab inserts the text in TextEdit.                               → XCUITest (local only)
```

If the request has no testable criteria, draft them and ask before writing
code.

## 3. Explore

Read the root `AGENTS.md`, the `AGENTS.md` of each module you will touch, its
guidelines, and `docs/architecture.md` for the subsystem. Search for what
exists before adding (CODE-1): the contracts, the fakes, the helpers beside
your file. A change to `Contracts/`, `Threading.swift` or a frozen entry point
is its own PR (MOD-3, `docs/guides/contracts.md`).

## 4. Plan

For anything beyond one file, list the files, the module each is in, and the
test per criterion. Share it; do not commit it (AGENTS-11).

## 5. Tests first

Write the tests for the criteria and run them; each fails for the reason you
expect. Extend the test that already covers a behavior instead of adding a
parallel one, and add a test only for a named risk (TEST-9). For a bug, the test reproduces it and fails on the current code
(TEST-7). Change a test only if the criterion changed.

```sh
cd app && ./scripts/test.sh --filter <Module>Tests
```

## 6. Implement

The smallest change that turns the tests green (CODE-7, CODE-8). Keep the
privacy and fail-open rules (PRIV-1 to PRIV-3, SEC-1). Note pre-existing
problems for a follow-up issue instead of fixing them here.

## 7. Verify

```sh
make verify
```

Fix anything red; never silence it (CODE-25). A UI change runs
`/site-ui-verify` or `/app-ui-verify`. A guide the change made untrue is
updated now (DOC-3).

## 8. Self-review

Run `/deslop` on the branch diff (AGENTS-10). Read the diff against the PR
template's checklist.

## 9. Commit and open the PR

Conventional commits with a scope (`CONTRIBUTING.md`). Push and open the PR
only when the maintainer asks. Fill `.github/pull_request_template.md`; in
Verification, map each criterion to its test:

```markdown
| Criterion | Test |
| --- | --- |
| AC1 | `app/Tests/ForetypeCoreTests/<File>.swift` › "n switches yes to no" |
```

Put every waiver in the PR body and a commit message (AGENTS-12).

Report a 1-3 sentence summary and the branch or PR link.
