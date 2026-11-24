# Dev log

Newest first. Foretype is pre-alpha, and this log says what is true on each date.

## 2026-11-24

### Model spike: speed and quality pass

20 realistic reply cases (email, Slack, scheduling, yes/no, form fields), each rated GOOD (accept as is), OK (right idea, needs edits) or BAD. Latency in milliseconds, p50 / p95, on an Apple M5 Pro.

| Engine and model | Prompt | First word, warm | Focus to first word | RAM | GOOD / OK / BAD |
|---|---|---|---|---|---|
| llama.cpp, Qwen2.5-1.5B-Instruct Q4_K_M | plain continuation | 7 / 22 | 105 / 166 | 1.34 GB | 14 / 4 / 2 |
| llama.cpp, Qwen3.5-2B-Base | plain continuation | 10 / 32 | 135 / 220 | 1.48 GB | 13 / 5 / 2 |
| llama.cpp, Qwen3.5-0.8B-Base | plain continuation | 7 / 18 | 70 / 112 | 0.73 GB | 11 / 6 / 3 |
| llama.cpp, Qwen2.5-1.5B-Instruct Q4_K_M | chat template | 7 / 25 | 143 / 194 | 1.29 GB | 10 / 5 / 5 |
| Apple Foundation Models | instructions | 643 / 882 | 643 / 882 | system | 9 / 3 / 8 |

- **Verdict: go.** The budget was a first word within 150 ms; the default setup shows it in about 7 ms once the field's context is loaded.
- A plain "continue this text" prompt beats the chat template on the same model.
- Every llama.cpp run respected what you had already typed, thanks to token healing.
- The first launch of a fresh build takes about 6.5 s while Metal compiles, so the app will preload at launch.
- **Plan:** ship llama.cpp with Qwen2.5-1.5B-Instruct. Qwen3.5-2B-Base stays the challenger for the 50-case eval, Qwen3.5-0.8B-Base covers low-RAM Macs, and Apple's model is only the no-download fallback. MLX is benchmarked next.

### Accessibility spike: five real apps

The throwaway spike app now shows ghost text at the caret and inserts it on Tab in TextEdit, Notes, Safari, Chrome and Slack on macOS 27.3. Mail was not tested (no account on the test Mac).

- **Caret position:** exact in Safari, Chrome and Slack. TextEdit and Notes report the caret one line too high, so the app checks it against the previous character's position.
- **Insertion:** setting the selected text through Accessibility works in TextEdit and Notes (about 130 ms). Safari, Chrome and Slack report success but insert nothing, so they get typed key events (about 255 ms in Safari). The app always reads the field back to confirm the text landed.
- **Undo:** one ⌘Z removes exactly the insertion in TextEdit and Slack. In Notes and Safari it also removes what you typed, and Chrome undoes 20 characters at a time. Making undo clean everywhere is on the v0.1 list.
- **Context:** nearby text was captured in every app, but it picks up unrelated text (other note titles, older Slack messages), so the real app reads a tighter area around the field.
- **Signing:** the Accessibility grant survived 8 rebuilds, including the switch from the Command Line Tools to Xcode.

### Research and market scan

We checked whether an LLM layer above the keyboard is possible. On iOS it is not, because there is no way to draw over or read the system keyboard. On Android it needs an Accessibility service or a keyboard of its own. On the desktop it works, through the Accessibility API. So Foretype starts on the Mac. Desktop autocomplete is crowded with solo builders, so the focus is answering from on-screen text, plus saved snippets, all local. Details are in [RESEARCH.md](RESEARCH.md).

### Landing site live

The website is live at <https://foretype.vercel.app>. We built two designs. Design B's method section was merged into design A, and A is now the single site.

### Plan written and independently reviewed

The v0.1 plan was written, then reviewed by someone with no stake in it. What changed:

- Tests use Swift Testing, because the Command Line Tools have no XCTest. Once Xcode was installed, XCTest and XCUITest came back (see below).
- Permissions: Accessibility only, with a watchdog that tears down the event taps if trust is revoked.
- The app reads the field value and caret back from AX after every key, instead of rebuilding them from keystrokes.
- Privacy claims were tightened to match the code. The debug panel shows only the current field. There is no clipboard fallback. "No network except the model download" is a statement about the source, not an OS guarantee.
- The model must be pinned by revision, byte size and SHA-256.
- A quality go/no-go on a small eval comes before the main build.
- Qwen2.5-3B was dropped because its license is research-only.

The plan was then revised twice more. The engine is now chosen by benchmark, with MLX Swift LM and llama.cpp behind one protocol. Qwen3.5 0.8B and 2B base models are the candidates. Apple's Foundation Models stay as the no-download fallback. The consolidated result is in [PLAN.md](PLAN.md).

### Full Xcode toolchain installed

Xcode 27.2 is installed and its license accepted. That unlocks XCTest, XCUITest, `xcodebuild`, Instruments and `notarytool`. It also allows the end-to-end tests described in the plan.

### P0 spike results so far (Accessibility, event taps, signing)

Tested on macOS 27.3, Apple Silicon, with throwaway code. Testing is not finished.

- **Signing.** A self-signed identity keeps the Accessibility grant across rebuilds on macOS 27. Three successive builds stayed trusted with no new prompt. The bundle must be replaced by rename, not copied over a running binary.
- **Permissions.** Accessibility alone is enough for both event taps (listen-only and consuming). No Input Monitoring prompt appeared. Trust flips live, about 2 seconds after the toggle, with no relaunch.
- **Bug found and fixed.** Disabling a tap delivers a "disabled by user input" event to that tap's own callback. Our first version re-enabled the tap in response, which caused about 25,000 callbacks in 10 seconds. The rule now: treat that event as informational, and re-enable only after a timeout.
- **TextEdit.** Insertion through the Accessibility API worked in about 136 ms from Tab to a verified result. One Cmd-Z removes exactly the inserted text. Two quirks: inserting text that begins with a space can trigger autocorrect on the word before the caret, and Unicode-event insertion merges with the user's typing in undo.
- **Caret position.** For TextEdit, a zero-length range returned a rectangle one line above the text, so we derive the caret from the previous character and check that it lies inside the field.
- **Not done yet.** Notes, Safari, Chrome, Slack and Mail are untested. The ghost panel position has not been checked by eye. Esc dismiss and secure-field checks in a browser are still to do.

### Model benchmark in progress

We are comparing MLX and llama.cpp with Qwen3.5 0.8B and 2B base models, using the real prompt. The result decides the default engine. No numbers yet.
