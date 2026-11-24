# Security policy

## Reporting a vulnerability

Please report security issues privately. Do not open a public issue.

Use GitHub's private reporting: go to the repository's **Security** tab and choose **Report a vulnerability** (a GitHub security advisory). Include what you found, the steps to reproduce it, and the macOS and Foretype versions.

We aim to reply within a few days. This is a personal project, so there is no formal SLA. We will credit you in the fix unless you prefer not to be named.

## Supported versions

Foretype is pre-alpha. Only the latest commit on `main` is supported.

## What is in scope

Foretype reads text from other apps, so privacy bugs count as security bugs. These are in scope:

- Any network call other than the one-time model download.
- Any case where text from a field, the screen or the clipboard is written to disk, logged or sent anywhere.
- Reading or showing a secure field, or text from a deny-listed app.
- Using the clipboard to insert text.
- Snippets stored unencrypted, or the key stored outside the Keychain.
- A model download that is not verified against its SHA-256.
- Event-tap bugs that can freeze or swallow input, for example after Accessibility is revoked.
- Local privilege or code-signing problems in the build and bundle scripts.

## Out of scope

- Findings that need an attacker who already has full control of your Mac or your user account.
- Issues in macOS itself or in third-party apps Foretype reads from.
- The documented fact that a non-sandboxed app can open network connections. Our guarantee is about the source code.
