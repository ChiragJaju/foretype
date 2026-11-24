# Documentation

Docs stay few and current. Foretype is built in public, so it keeps a closed
list of history docs; every other doc says what is true now. The policy in prose
is `CONTRIBUTING.md` § Documentation.

Every rule has an id (`DOC-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

**DOC-1. `docs/` holds only `guidelines/`, `guides/`, `assets/`,
`architecture.md` and the history docs `DEVLOG.md`, `PLAN.md` and
`RESEARCH.md`.** At the root the Markdown files are `README.md`,
`CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `AGENTS.md` and `CLAUDE.md`.

**DOC-2. Outside the history docs, a doc is in the present tense with no
dates.** No "previously", "as of", dated entries or plans. `git log`, the PR and
the history docs (`docs/DEVLOG.md`, `docs/PLAN.md`, `docs/RESEARCH.md`,
`CHANGELOG.md`) own what changed and when.

**DOC-3. A change updates the guide it makes untrue, in the same PR.** A PR that
truly leaves a guide true while touching its subsystem says so with
`DOC-SKIP(<guide>): <reason>`.

**DOC-4. One living guide per subsystem.** `docs/architecture.md` is the map;
a subsystem gets a guide in `docs/guides/` only once it has content the map
cannot hold, and the map links to it.

**DOC-5. Verification is an executable test or check, never a prose checklist
in a doc.**
