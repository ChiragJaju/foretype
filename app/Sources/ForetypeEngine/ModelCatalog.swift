// Slice B. Pins come from the P0 spike, verified locally with `shasum -a 256`.

import ForetypeCore
import Foundation

public enum ModelCatalog {
    /// Best measured in P0 with the base-style prompt: 70% GOOD, 90% GOOD+OK, 1.3 GB RSS.
    public static let qwen25Instruct1_5B = ModelSpec(
        id: "qwen2.5-1.5b-instruct-q4_k_m",
        displayName: "Qwen2.5 1.5B Instruct (Q4_K_M)",
        downloadURL: URL(
            string:
                "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/91cad51170dc346986eccefdc2dd33a9da36ead9/qwen2.5-1.5b-instruct-q4_k_m.gguf"
        )!,
        repository: "Qwen/Qwen2.5-1.5B-Instruct-GGUF",
        revision: "91cad51170dc346986eccefdc2dd33a9da36ead9",
        fileName: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        byteCount: 1_117_320_736,
        sha256: "6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e",
        license: "Apache-2.0"
    )

    public static let all: [ModelSpec] = [qwen25Instruct1_5B]
    public static let defaultModelID = qwen25Instruct1_5B.id
}
