# ForetypeTestSupport

A fake for every Core seam (`FakeFocusMonitor`, `FakeContextReader`,
`FakeKeyTap`, `FakeInserter`, `FakeGhostPresenter`, `FakePermissions`,
`FakeEngine`, `FakeModelProvider`, in-memory stores), `ManualClock` and
fixtures. Linked only by test targets (MOD-7).

## Dependencies

- **May import:** ForetypeCore, Foundation, Synchronization.
- **Imported by:** test targets and the E2E bundle only.

## Rules

**MOD-testsupport-1. A fake behaves like the real adapter and records what a
test must assert.** Scripted and deterministic, honouring cancellation, and
exposing what the privacy tests check (`FakeContextReader.readFieldIDs`,
`FakeFocusMonitor` tracked fields).

**MOD-testsupport-2. A fake is thread-safe through a `Mutex` or an actor.** No
`@unchecked Sendable` and no unguarded mutable state.

## Copy from

| Need | Exemplar |
| --- | --- |
| A fake seam with recorded reads | `FakeContextReader.swift` |
| A fake that drives time | `ManualClock.swift` |

## Commands

```sh
cd app && ./scripts/test.sh --filter ForetypeTestSupportTests
```
