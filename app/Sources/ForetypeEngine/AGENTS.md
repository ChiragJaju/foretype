# ForetypeEngine

Model engines behind the `Engine` protocol, and the consented model download.
Owns `LlamaEngine` (llama.cpp on Metal), `ModelStore` (the only network code in
Foretype, PRIV-1), `ModelCatalog` (pinned models) and `StubEngine`
(deterministic replies for end-to-end tests).

## Dependencies

- **May import:** ForetypeCore, Foundation, and `llama` (only in
  `LlamaEngine.swift`).
- **Imported by:** ForetypeApp, `foretype-eval`. Never ForetypeMac (MOD-2).

## Rules

**MOD-engine-1. The whole llama.cpp C API lives in `LlamaEngine.swift`.** No
other file imports `llama`, so an API bump touches one file.

**MOD-engine-2. Only the pinned b12676 API is used.** `llama_batch_ext_*`,
`llama_process`, `llama_memory_*` and `llama_state_seq_*` for hybrid models;
never the deprecated `llama_decode`.

**MOD-engine-3. Model downloads resume with `Range` requests over HTTP/1.1.**
Hugging Face drops long HTTP/2 transfers; a partial file resumes instead of
restarting.

**MOD-engine-4. `StubEngine` is selected only in debug builds with
`FORETYPE_ENGINE=stub`.** Its replies are deterministic so XCUITest can assert
the exact ghost text.

## Copy from

| Need | Exemplar |
| --- | --- |
| An `Engine` that streams and honours cancellation | `ForetypeTestSupport/FakeEngine.swift` |
| A pinned download (URL plus checksum, bumped together) | the `llama` binary target in `app/Package.swift` |

## Commands

```sh
cd app && ./scripts/test.sh --filter ForetypeEngineTests
```
