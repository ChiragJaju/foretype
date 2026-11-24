# Contributing to Foretype

Foretype is pre-alpha. The app is not usable yet, so the most helpful things right now are bug reports on the plan, test results from your own apps, and small focused pull requests. Open an issue before you start on anything large.

## Dev setup

You need an Apple Silicon Mac on macOS 26 or later, Xcode 27 or the Command Line Tools, Node 24 and Homebrew.

```sh
git clone https://github.com/ChiragJaju/foretype.git
cd foretype
make bootstrap          # npm installs, git hooks, swiftlint and gitleaks; ends with make doctor
make verify             # the checks CI runs: repo checks, lint, type-check, build, tests
app/scripts/bundle.sh   # builds Foretype.app
```

Run `./scripts/dev-sign.sh` once. It creates a local self-signed identity, so your Accessibility grant survives rebuilds. Grant Accessibility to the built app in System Settings → Privacy & Security → Accessibility.

The architecture is in [docs/PLAN.md](docs/PLAN.md). `ForetypeCore` has no AppKit and is where most logic and tests live.

## Code style

- Small functions. Use guard clauses and early returns, not deep nesting.
- Names say what a thing is for. Name constants, and put units in the name (`debounceMilliseconds`).
- No `any`, and no casts to silence the compiler. Narrow with type checks. Pass typed errors up with their cause. Never swallow an error.
- Comments say only what code cannot: an invariant, a data contract, or the reason behind a number. One or two lines. No commented-out code.
- Delete dead code in the same change.
- No `print` in app code. Use structured logging.
- Reuse an existing helper before writing a new one.
- Keep diffs small. One cause, one change. No drive-by renames or reformatting.

## Tests

- Use Swift Testing for new tests. Use XCTest where you need performance metrics or UI tests.
- A test pins a named risk and asserts an outcome. Do not assert only that a mock was called.
- A test that comes with a bug fix must fail on the old code.
- Anything that needs the Accessibility permission runs locally, not in CI.

## Privacy rules for contributors

- No new network calls. The model download is the only one.
- No logging of field contents or screen text.
- No clipboard use.
- Do not copy code from AGPL projects such as Cotabby. Read ideas, write your own.

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Keep commits small. Describe what changed and why. Link the issue if there is one.

By contributing, you agree that your work is released under the [MIT License](LICENSE).
