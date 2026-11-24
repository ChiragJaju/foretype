---
name: deslop
description: Remove AI code slop from the branch diff by applying the repo's rules (AGENTS.md files and docs/guidelines). Run before opening or updating a PR.
---

# Remove AI code slop

Read the root `AGENTS.md`, `docs/guidelines/code.md`, the `AGENTS.md` nearest
every file the diff touches, and the guidelines the root `AGENTS.md` table names
for what the diff changes (Swift, concurrency, privacy, tests, site, docs).

Then diff this branch against its base and bring every changed hunk into
line. The base is the branch the PR targets (`gh pr view --json baseRefName
--jq .baseRefName` when a PR exists, or the argument passed to this skill);
default `origin/main`. Use `git diff <base>...HEAD` so only this branch's
commits are in scope.

Remove what an engineer on this repo would not have written:

- duplicated code where a helper, fake or contract type already exists (CODE-1, CODE-2);
- anything the diff adds and does not use: parameters, `public` declarations,
  exports, files (CODE-4);
- comments that narrate the diff or restate the code, commented-out code,
  `TODO`s (CODE-13 to CODE-15);
- defensive checks abnormal for the area, force unwraps, swallowed errors
  (SWIFT-1 to SWIFT-3);
- `print` or logged user text (OBS-1, PRIV-3);
- shape or filler tests, tests that only assert a fake was called (TEST-5, TEST-6);
- stray files, dated lines in living docs, a guide left untrue (AGENTS-11, DOC-2, DOC-3);
- drive-by renames, refactors or reformatting outside the change (CODE-8).

Constraints:

- Do not change behavior, add features, or touch code outside the diff.
- Do not restate or reinterpret the rules: the files above are the only
  source; where they are silent, match the surrounding file.
- Re-run `make verify` (or the targeted test with `./scripts/test.sh --filter`)
  for what you edited.

Report a 1-3 sentence summary of what you changed.
