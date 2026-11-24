# Observability

How the app reports what it does: the unified logging system, through the
logging contract in `app/Sources/ForetypeCore/Contracts/Logging.swift`. What may
never be logged is [privacy.md](./privacy.md) PRIV-3.

Every rule has an id (`OBS-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

**OBS-1. No `print`, `debugPrint` or `NSLog` in app sources; use `os.Logger`
with a subsystem and category.** The eval harness writes its report to the
output file it is given and its usage text to standard error.

**OBS-2. Loggers come from `ForetypeLog.logger(_:)` with a `LogCategory`.** The
subsystem is always `dev.foretype`. A new category is a change to
`Logging.swift`, so it follows MOD-3.

**OBS-3. A log line carries IDs, lengths, methods, timings and reasons.** For
example the `FieldID`, the bundle ID, the `RequestID`, an `InsertionMethod`, a
latency in milliseconds, a `DenyReason`. That is enough to debug a session
without the text.

```swift
✅ log.info("insert via \(method.rawValue, privacy: .public): \(request.text.utf16.count) units, \(elapsedMilliseconds) ms")
❌ log.info("inserted \(request.text, privacy: .private)")   // the text itself is never logged
```
