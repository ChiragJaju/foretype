# Privacy

Foretype reads text from other apps, so its privacy promises are code rules.
Each promise in the README's privacy model maps to code in
[architecture.md](../architecture.md) § Privacy guarantees; this file holds the
rules a change must keep. A privacy bug is a security bug (`SECURITY.md`).

Every rule has an id (`PRIV-3`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. Nothing leaves the Mac

**PRIV-1. The only network code is the model download in
`app/Sources/ForetypeEngine/ModelStore.swift`.** No `URLSession`, `Network`
framework, socket, stream or web view anywhere else in the app. A second network
path is a product decision for an issue, not a PR.

**PRIV-2. Never touch the clipboard.** No `NSPasteboard` read or write anywhere
in the app, for insertion or anything else. `InsertionMethod` has no clipboard
case.

**PRIV-3. Captured screen text is never persisted or logged.** Field text,
nearby text, snippets and keystrokes stay in memory: log IDs, lengths, methods,
timings and reasons instead (OBS-3). Any other dynamic string in an `os.Logger`
message is interpolated with `privacy: .private`, so a mistake stays redacted.

**PRIV-4. No telemetry or analytics in the app.** No crash reporting, usage
pings, update checks or third-party SDKs that phone home.

## 2. Read only what is allowed, keep it only while focused

**PRIV-5. Policy decides before anything is read.** `Policy.evaluate` rejects
secure fields, deny-listed apps, Foretype itself and paused states; the session
emits `.track` and `.captureContext` only after `.allow`. `FocusedField` carries
no text by construction.

**PRIV-6. Context is dropped when the field loses focus.** On `.blurred` the
session emits `.track(nil)`, `.blurEngine` (the engine clears its KV cache),
`.hideGhost` and `.publishContext(nil)`. Nothing read survives a blur.

**PRIV-7. The model download needs the user's consent and a verified file.**
`ModelProviding.download` requires a `DownloadConsent`, which only the onboarding
and settings download buttons create, and the file's size and SHA-256 are checked
before it is moved into place.

**PRIV-8. Snippets are encrypted at rest.** `EncryptedSnippetStore` seals the
file with AES-GCM and keeps the 256-bit key in the Keychain. Tests inject the
key and never touch the real Keychain.

**PRIV-9. Foretype asks for Accessibility only.** No Screen Recording, Input
Monitoring or other TCC permission, no usage strings for them in `Info.plist`,
and never a read of the TCC database.
