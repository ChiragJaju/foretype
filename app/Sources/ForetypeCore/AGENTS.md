# ForetypeCore

Pure Swift, no AppKit. Owns every shared value type and seam protocol
(`Contracts/`, frozen) and the suggestion logic (`Logic/`): the session
reducer and its runner, prefix trim, ranking, context building, the prompt,
policy, field classification, insertion planning and the encrypted snippet
store. Because nothing here touches the OS, the whole pipeline runs in
`swift test` against the fakes.

## Dependencies

- **May import:** Foundation, `os`, Observation, Synchronization, CryptoKit,
  Security (MOD-1).
- **Imported by:** every other module.
- **Contracts:** `Contracts/` is frozen (MOD-3); the change process is
  `docs/guides/contracts.md`.

## Rules

**MOD-core-1. `SuggestionSession` is a pure reducer.** One event in, a list of
effects out: no I/O, no `await`, no clock reads (time arrives as `now:`).
`SessionRunner` is the only thing that runs effects.

**MOD-core-2. Effects come out in the order the runner must run them.**
`.setTapMode(.listenAndIntercept)` before `.showGhost`; `.hideGhost` before
`.setTapMode(.listen)`, so the consuming tap is never live without a ghost.

**MOD-core-3. A typed character that matches the suggestion trims it with no
engine call.** Only a mismatch asks the engine again, after
`SuggestionLimits.requeryDebounce`.

## Copy from

| Need | Exemplar |
| --- | --- |
| A seam protocol and its documentation | `Contracts/Seams.swift` |
| A value type with a named budget | `Contracts/Context.swift` (`ContextBudget`) |
| A seam with a production and a test implementation | `Contracts/Clock.swift` with `../ForetypeTestSupport/ManualClock.swift` |

## Commands

```sh
cd app && ./scripts/test.sh --filter ForetypeCoreTests
```
