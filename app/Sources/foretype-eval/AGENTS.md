# foretype-eval

The offline eval harness: runs a model over a case file and reports first-word
accuracy, GOOD/OK/BAD ratings, keystrokes saved and latency percentiles,
paired across models. It measures the budgets in CODE-23.

## Dependencies

- **May import:** ForetypeCore, ForetypeEngine, Foundation.
- **Imported by:** nothing.

## Rules

**MOD-eval-1. Silence counts as a miss in first-word accuracy.** An engine that
says nothing never scores better than one that guesses.

**MOD-eval-2. The harness writes its results only to the output path it is
given.** Usage and progress go to standard error; nothing goes to the network.

## Commands

```sh
cd app && swift run -c release foretype-eval <model.gguf> <cases.json> <out.json> [passes]
```
