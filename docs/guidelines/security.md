# Security

How Foretype stays safe to run with Accessibility: it never breaks the user's
typing, never reads what it must not, and ships from a repo with no secrets.
Privacy rules are [privacy.md](./privacy.md); reporting is `SECURITY.md`.

Every rule has an id (`SEC-2`). **MUST** and **MUST NOT** are required.
**SHOULD** is required unless the PR says why not. A rule with neither keyword is
a **MUST**.

## 1. Fail open

**SEC-1. If anything fails, typing keeps working exactly as without Foretype.**
Taps tear themselves down when Accessibility trust is lost, without waiting for
the session; a tap re-enables only after `tapDisabledByTimeout`; a swallowed key
the session cannot use is replayed (`.replayKey`); an engine that fails to load
leaves snippets only.

## 2. Never read what must not be read

**SEC-2. The context reader refuses secure fields even when policy allowed
them.** `AXContextReader` checks `isSecure` again before every read, as a second
line of defense behind PRIV-5.

**SEC-3. While another app holds Secure Event Input, Foretype observes no
keys.** `IsSecureEventInputEnabled` turns policy to
`.deny(.secureInputHeld(by:))`, the taps go to `.off`, and the menu bar shows
"Paused: secure input held by <app>".

**SEC-4. Only public macOS APIs.** No private frameworks, SPI or reads of
system databases (TCC, Keychain items Foretype did not create).

## 3. Build and supply chain

**SEC-5. Entitlements stay minimal.** `app/Support/Foretype.entitlements` holds
the hardened runtime's `disable-library-validation`, which the self-signed
`llama.framework` needs, and nothing else unless a PR says which feature needs
the new one and why.

**SEC-6. The bundle is signed inside out with the hardened runtime, by
`app/scripts/bundle.sh`.** The local identity comes from `dev-sign.sh` and lives
in its own keychain; no certificate, identity or provisioning file is committed.

**SEC-7. Every binary or model Foretype downloads is pinned by URL and
SHA-256.** The `llama` xcframework in `Package.swift` and each `ModelCatalog`
entry; a bump changes both together, never one alone.

**SEC-8. No secrets in the repo.** No keys, tokens, `.env*` files, certificates
or credentials, in code, fixtures or history. CI secrets live in GitHub Actions
secrets.
