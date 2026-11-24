# Writing code

The rules every change follows, in the app (`app/`), the site (`site/`) and the
repo scripts (`scripts/`): reuse, types, naming, comments, dependencies, size,
performance and verification. Swift adds [swift.md](./swift.md) and
[concurrency.md](./concurrency.md), the site adds [site.md](./site.md), tests
follow [testing.md](./testing.md), and each module's `AGENTS.md` adds its own.

Every rule has an id (`CODE-4`). Cite it in reviews and commits. **MUST** and
**MUST NOT** are required. **SHOULD** is required unless the PR says why not. A
rule with neither keyword is a **MUST**.

## 1. Reuse and scope

**CODE-1. Search before you add.** Check, in order: the Core contracts
(`app/Sources/ForetypeCore/Contracts/`), the fakes in `ForetypeTestSupport`, the
helpers already in the module you are in, and on the site `site/src/lib/` and
`site/src/components/`. Extend what exists instead of writing a parallel one.

**CODE-2. Two files that differ only in names MUST be one shared file.**

**CODE-3. New code MUST go where the repo already keeps that kind of thing.** A
new seam protocol goes in `Contracts/Seams.swift`, a new fake in
`ForetypeTestSupport`, site copy in `site/src/lib/content.ts`. "The existing file
is big" is not a reason for a new home; changing a convention is its own PR.

**CODE-4. Nothing is added that the same PR doesn't use.** Helpers, parameters,
`public` declarations, exports, types, files. Every `public` Swift declaration
and every TypeScript export has a user outside its own file.

**CODE-5. A helper used by one file MUST live in that file**, `private` in Swift.
A new `*Utils` or `*Helpers` file needs a second user.

**CODE-6. A parameter every caller passes the same value for MUST NOT be a
parameter, and a function whose body is one trivial expression MUST NOT be a
function.**

**CODE-7. The simplest fix SHOULD win.** A constant, a guard or a changed
condition beats a new abstraction for one case. A shared type's contract or
error behavior MUST NOT change for one new caller: add to it, or handle it at the
call site.

**CODE-8. One cause, one change.** No drive-by refactors, renames or
reformatting in a diff about something else, and no compatibility shims or
feature flags unless the issue asks for them. The old path is deleted in the
same change that replaces it.

## 2. Types and naming

**CODE-9. TypeScript is strict and the type checker is never silenced.** No
`any`, no `as` cast to quiet an error, no `@ts-ignore`; narrow with a type
guard. Swift's equivalents are SWIFT-1 and SWIFT-2.

**CODE-10. Names state intent.** Functions are verb phrases, types are nouns,
parameters are named for what they hold (no `data`, `info`, `params`, `opts`). A
derived collection is bound to a named variable instead of a chain of raw
booleans.

**CODE-11. Control flow stays flat.** Guard clauses and early returns over
nesting; no nested ternaries; a lookup table over a long `if`/`else if` chain.
Cyclomatic complexity stays at 12 or below.

**CODE-12. No magic numbers.** A number with meaning is a named constant with
its unit in the name or the type (`requeryDebounce: Duration`,
`THEME_REVEAL_MS`).

## 3. Comments

**CODE-13. A comment MUST be one or two lines saying what code can't.** An
invariant, a data-shape contract, or the reason behind a number. No narrating
the diff, no restating the code, no essays on small helpers.

**CODE-14. Long rationale MUST go in `docs/guides/` or the PR description, with
at most a one-line pointer in the file.** No incident stories, version history
or "this is correct because…" in comments.

**CODE-15. Code holds no commented-out code and no `TODO`, `FIXME` or `HACK`.**
Open a GitHub issue for the follow-up instead.

## 4. Dependencies

**CODE-16. A new dependency MUST NOT duplicate an established one, and a new
SwiftPM dependency needs the maintainer's yes before it lands.** Ask in the
issue or PR first. The site's icon library is `lucide-react` (UI-1).

**CODE-17. No code is copied from a project whose license is incompatible with
MIT**, such as AGPL or GPL projects (for example Cotabby). Read ideas, write your
own.

## 5. Size budgets

A budget is met by extracting a cohesive piece (a pure move, in its own
commit), never by splitting to dodge the count, deleting cases or editing the
number. A PR that must break one says so with `BUDGET-SKIP(<rule-id>): <reason>`
(`CONTRIBUTING.md` § Waivers).

**CODE-18. A Swift or `.ts` file is at most 300 code lines.** Comment-only and
blank lines do not count.

**CODE-19. A `.tsx` file is at most 600 code lines.**

**CODE-20. A function, method or closure body is at most 50 lines.**

**CODE-21. A Swift type body, or a React component, is at most 250 lines.**

**CODE-22. A SwiftUI `body` is at most 80 lines.** Extract a subview with a name
that says what it shows.

## 6. Performance

**CODE-23. The suggestion path meets its latency and memory budgets.** First
visible word at most 150 ms p50 with the model warm; focus to first suggestion
at most 700 ms cold; idle memory under 1.5 GB. The eval harness
(`foretype-eval`) or an XCTest performance test measures them; a PR that moves
one reports before and after.

## 7. Verification

**CODE-24. Every change MUST pass `make verify` on what it touched.** It runs
the same checks as CI on the changed files ([verify.md](../guides/verify.md));
CI is the record.

**CODE-25. Work MUST NOT be called done while a check is red, and a failing
check is fixed, never silenced.** No disable comment without the rule and a
reason; a pre-existing failure that blocks you is named in the PR, not worked
around.

**CODE-26. Your own diff MUST be swept for unused code, dead imports and stale
docs** before review, and anything the change made dead is deleted in it.
