// Slice B. Offline eval harness: first-word accuracy (silence is a miss), GOOD/OK/BAD ratings,
// keystrokes saved and latency percentiles, paired across models. Results go to docs/EVAL.md.

import Foundation
import ForetypeCore
import ForetypeEngine

let usage = "usage: foretype-eval <model.gguf> <cases.json> <out.json> [passes]\n"
FileHandle.standardError.write(Data(usage.utf8))
exit(EX_USAGE)
