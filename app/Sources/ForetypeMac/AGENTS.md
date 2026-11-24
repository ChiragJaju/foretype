# ForetypeMac

The AppKit, Accessibility and CGEvent adapters that implement the Core seams:
`FocusMonitor`, `AXContextReader`, `KeyTap`, `AXInserter`, `GhostPanel`,
`SystemPermissions`, and the threading primitives in `Threading.swift`
(frozen, MOD-6).

## Dependencies

- **May import:** ForetypeCore, Foundation, AppKit, ApplicationServices.
- **Imported by:** ForetypeApp only. Never ForetypeEngine (MOD-2).
- **Threads:** AX work on `AXActor`, taps on their own `RunLoopThread`, the
  panel on the main actor (CONC-3 to CONC-5).

## Rules

**MOD-mac-1. One `FieldID` → `AXUIElement` registry, on `AXActor`, is shared by
the monitor, the reader and the inserter.** No adapter keeps its own map of
elements.

**MOD-mac-2. No field text is read until `track` names the field.** Before
that the monitor sees roles and frames only.

**MOD-mac-3. The inserter verifies by reading the field back, never by the AX
error code.** It reads about 120 ms after inserting; Unicode key events go in
chunks of at most 20 UTF-16 units and never split a `Character`.

**MOD-mac-4. Events Foretype posts carry a source-user-data tag, and both taps
ignore tagged events.** A replayed or inserted key never re-enters the session.

## Copy from

| Need | Exemplar |
| --- | --- |
| A global actor on its own run-loop thread | `Threading.swift` (`AXActor`, `RunLoopExecutor`) |
| How the session expects a seam to behave | the matching fake in `ForetypeTestSupport/` |

## Commands

```sh
cd app && ./scripts/test.sh --filter ForetypeMacTests
./scripts/bundle.sh   # then check the behavior in a real host app
```
