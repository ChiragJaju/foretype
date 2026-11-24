# Research: why Foretype exists

Checked 2026-11-24. Some sources are secondary. Claims we could not verify are marked.

## The idea, and what changed

The first idea was a layer above the phone keyboard: swipe or tap sloppily, and a language model fixes it. We checked whether that is possible, whether it helps, and who is already there. The answer sent us to the desktop and to a different product: predict the **answer**, using what is on screen.

## Feasibility by platform

**iOS: no.** No public API lets a third-party app draw above, read keystrokes from, or intercept touches on the system keyboard. Apps are sandboxed and iOS has no overlay window type. The only way in is to be a keyboard. A keyboard extension can draw only inside its own view ([Apple docs](https://developer.apple.com/library/archive/documentation/General/Conceptual/ExtensibilityPG/CustomKeyboard.html)). App Review also requires a keyboard to work without network or Full Access ([guidelines](https://developer.apple.com/app-store/review/guidelines/)), so an offline fallback is mandatory. The "no" rests on the absence of an API, so it is an inference, not a quote.

**Android: only with an Accessibility service, or as a keyboard.** A floating bubble plus an Accessibility service can read a field and insert text. Wispr Flow ships this on Google Play ([Wispr Android](https://wisprflow.ai/android)). It cannot see or reshape the keys underneath, so swipe and dynamic hit targets need a real keyboard (an IME). Policy risk is rising: Play restricts autonomous use of the API ([policy](https://support.google.com/googleplay/android-developer/answer/10964491)), and Android 17 Advanced Protection can block non-accessibility tools ([report](https://www.androidauthority.com/android-advanced-protection-mode-accessibility-apk-teardown-3640742/); sources disagree on beta against stable).

**Mac and Windows: yes.** The Accessibility API reads the focused field and nearby text. An event tap catches Tab. A small panel draws ghost text at the caret. Mac App Store apps are sandboxed and cannot do this ([Apple DTS](https://developer.apple.com/forums/thread/756130)), so the app ships by direct download.

**Hit targets are not a feature.** Apple has grown invisible touch targets since the first iPhone (see the [Kocienda excerpt](https://9to5mac.com/2018/08/08/excerpt-iphone-software-keyboard-design/); patent US 9086802, whose text we did not read in full). Gboard uses a neural touch model ([Google](https://research.google/blog/the-machine-intelligence-behind-gboard/)). If we are not a keyboard, the user already has them.

**Conclusion: desktop first, Mac first.**

## Does LLM-assisted typing save time?

The evidence is mixed. It points away from "fix sloppy input" and toward "type less".

- **Decoding noisy input helps accuracy, and speed only a little.** An LLM decoder reached 93.1% top-1 on drawn gestures and 95.4% on real tap data ([CHI 2025](https://researchconnect.stonybrook.edu/en/publications/llm-powered-text-entry-decoding-and-flexible-typing-on-smartphone/)); the abstract reports no speed result. KeySense, a small fine-tuned model for touchscreen typing, reached 28.3 WPM against 26.2 for baselines ([arXiv 2602.12432](https://arxiv.org/abs/2602.12432)).
- **Word prediction can slow people down.** In the 37,370-user Typing37k study, the mean mobile speed was 36.2 WPM, and prediction users did not type faster. Reading a suggestion costs attention ([Aalto](https://userinterfaces.aalto.fi/typing37k)). The per-group prediction result comes from a secondary summary, and we have not rechecked it against the paper.
- **Typing less is where the gain is.** SpeakFaster expanded word-initial abbreviations with context-aware models. Hand-typists on mobile saved 56% of keystrokes in a scripted test and 45% unscripted ([arXiv 2312.01532](https://arxiv.org/abs/2312.01532); abstract-level reading). An earlier study found that one turn of dialogue context more than doubled expansion accuracy ([NAACL 2022](https://preview.aclanthology.org/update-py-deps/2022.naacl-main.91/)).

So the useful product is "it already knows what you are about to say". Screen context is the speed-up. We measure acceptance rate and keystrokes saved, not WPM.

## Why use Accessibility, not screen recording

Accessibility returns real text: the field, the labels, the message you are answering. It is cheap and needs no image processing. Screen Recording on macOS 15 and later re-asks for permission every month, so we keep it only as an opt-in fallback for canvas apps.

Known gaps: Slack, Discord and other Electron apps expose little text. VS Code reports odd caret boxes. Other apps that hold Secure Event Input can silently disable every Tab-catching tool. We expect partial support at first.

## Competitor landscape

Desktop autocomplete is crowded, and almost every player is a solo builder. Status checked 2026-11-24.

| Project | What it is | Status |
|---|---|---|
| [Cotypist](https://cotypist.app) | On-device Tab autocomplete, reads text near the field, paid with a free tier | Active; launched May 2026 ([Daring Fireball](https://daringfireball.net/linked/2026/06/18/cotypist)). Update date unverified |
| [Cotabby](https://github.com/FuJacob/cotabby) | Open source (AGPL), llama.cpp | Active; v0.7.0-beta on 2026-11-23, 1.1k stars |
| [Pretype](https://github.com/nikiomori/Pretype) | Open source (MIT), MLX, free | Active; v2.11.0 on 2026-11-12. Closest open competitor, with a rigorous eval |
| [KeyType](https://github.com/johnbean393/KeyType) | Open source (MIT), Cotypist alternative | Slowing; last push 2026-08-29 |
| [TypeSeer](https://typeseer.com) | Mac and Windows autocomplete | Active |
| [MacAutocomplete](https://macautocomplete.com) | One-time purchase | Active, recent launch |
| [GhostType](https://github.com/mk668a/GhostType) | Ollama / LM Studio, non-commercial licence | Slowing; last push 2026-08-11 |
| [Screenpipe](https://github.com/mediar-ai/screenpipe) | Screen-recording context layer | Active, but moving toward work automation |
| Rewind / Limitless | Screen memory | Dead. Acquired by Meta, product shut down in December 2025 ([9to5Mac](https://9to5mac.com/2025/12/05/rewind-limitless-meta-acquisition/)) |

Hobby clones tend to stall within three to six months. Several other names we checked (Typeahead, Glintype, Nimbus) could not be verified as live.

**Mobile money goes to voice and agents, not typing.** Wispr raised $280M at a $2B valuation in August 2026 ([SiliconANGLE](https://siliconangle.com/2026/08/17/wispr-raises-280m-to-power-up-natural-speech-to-text-using-ai/)). Acti raised a $5.3M seed for an agentic keyboard ([TechCrunch](https://techcrunch.com/2026/06/30/acti-puts-ai-agents-directly-into-your-smartphone-keyboard)). Typed-prediction keyboards are slowing or have moved to B2B: Typewise has had no iOS update in 19 months, and Fleksy sells an SDK. [FUTO Keyboard](https://github.com/futo-org/android-keyboard) is the only active open swipe keyboard we found.

**Platforms are moving in.** Inline predictions have shipped in macOS since version 14, and macOS 27 adds proofreading as you type. Apple is the main risk for any tool in this space. We cannot control that, so the plan leans on what a platform feature is unlikely to give you: open source, your own snippets, and answers drawn from the screen.

## Where Foretype fits

Pretype, Cotabby and KeyType complete the text you are writing. We found nothing in their READMEs about answering from nearby on-screen text, or about a personal snippet store. That is the focus. Small models also look tied on English next-word accuracy: Pretype's own held-out eval put ten downloadable models at 26 to 29% first-word accuracy and Apple's on-device model at 22% ([Pretype eval notes](https://github.com/nikiomori/Pretype/blob/main/docs/models.md)). So latency, prompt context and ranking matter more than model choice.

## Open questions

1. **Can a 0.8B to 2B local model answer an on-screen question well enough?** Small models continue text fine, but answering is harder. No one has published acceptance rates for small against large models. Our eval will measure it.
2. **Which engine is faster in practice, MLX or llama.cpp?** No Swift-level head-to-head exists. The benchmark is in progress.
3. **How much of the real app surface does Accessibility cover?** We expect roughly 70% of fields at first. Slack, Chrome and Electron need testing.
4. **Is an optional cloud mode worth it?** It would raise answer quality and weaken the "nothing leaves your Mac" claim. Not in v0.1.
5. **Will Apple ship context-aware completion?** The macOS 27 release notes show no public API for third-party inline predictions.
6. **Is a mobile version possible later?** Only as a keyboard: an Android IME first, then an iOS keyboard extension. That is outside this project for now.
7. **How do we prove "local"?** A non-sandboxed app can always open a connection. The credible proof is open source plus checking with a network monitor.
