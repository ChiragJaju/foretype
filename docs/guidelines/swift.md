# Writing Swift

How Swift is written in `app/`: optionals, errors, value types, access control
and naming. Threads and actors are [concurrency.md](./concurrency.md); the
rules for every language are [code.md](./code.md). SwiftLint (`.swiftlint.yml`)
and swift-format (`.swift-format`) check what they can.

Every rule has an id (`SWIFT-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. Optionals and errors

**SWIFT-1. App sources never force: no `!` unwrap, `try!`, `as!` or implicitly
unwrapped optional.** Unwrap with `guard let` and handle the nil. Tests may
force-unwrap a fixture they just built, since a crash there is a clear failure.

```swift
✅ guard let element = elements[field.id] else { return nil }
❌ let element = elements[field.id]!
```

**SWIFT-2. Errors are typed and keep their cause.** A seam throws its own error
enum (`EngineError`, `ModelStoreError`, `KeyTapError`, `SnippetStoreError`),
with typed `throws(...)` where the contract declares it. A `catch` rethrows, maps
to the seam's error with the cause, or logs the reason and fails open (SEC-1).
Never an empty `catch`.

**SWIFT-3. `try?` is used only where nil is the answer, never to hide a
failure.** A failed read of an element that is gone is nil; a failed decrypt,
download or save is an error the caller sees.

**SWIFT-4. `fatalError` and `precondition` are for programmer errors only, with
a message.** A missing permission, model, field or network is a runtime
condition: return, throw, or fail open.

## 2. Types

**SWIFT-5. Data is a value type.** Contracts are `struct` or `enum`, `Sendable`,
and `Hashable` or `Equatable` where compared. A `class` or `actor` is for
identity: an adapter, a store, a fake that records calls.

**SWIFT-6. Protocol-typed values spell `any`.** `ExistentialAny` is on for
every target in `Package.swift`, so the compiler enforces it.

**SWIFT-7. Access is the smallest that works.** `public` only for what another
module uses; `private` for helpers in one file (swift-format's file-scoped
privacy is `private`); `internal` otherwise. A frozen `public` declaration
follows MOD-3.

## 3. Naming and layout

**SWIFT-8. Names follow the Swift API Design Guidelines.** Types
`UpperCamelCase`, everything else `lowerCamelCase`, acronyms kept whole
(`AXRect`, `FieldID`), a Bool reads as an assertion (`isStarted`), and argument
labels make the call read as a phrase (`trimmed(_:typedBeforeCaret:)`).

**SWIFT-9. swift-format owns layout.** Run `swift format` (the PostToolUse hook
does) instead of hand-formatting against `.swift-format`.

**SWIFT-10. No SwiftPM resources.** `Bundle.module` breaks the signed bundle;
images such as the menu-bar icon are drawn in code.
