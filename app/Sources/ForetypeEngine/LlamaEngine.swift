// Slice B. The whole llama.cpp C API lives in this one file, because it churns (35 functions were
// removed in v1.0.0). Use only the b12676 API the P0 spike proved: llama_batch_ext_*, llama_process,
// llama_memory_*, llama_state_seq_* for hybrid models. The public signatures are frozen.

import Foundation
import ForetypeCore
import llama

/// llama.cpp on Metal, one sequence. Runs on its own serial queue so a 100 ms prefill never blocks
/// the main actor or the cooperative pool.
/// Placeholder: reports the model missing, so the session runs snippets only.
public actor LlamaEngine: Engine {
    public nonisolated let descriptor: EngineDescriptor
    private let modelFileURL: URL?
    private let queue = DispatchSerialQueue(label: "dev.foretype.engine", qos: .userInitiated)

    public nonisolated var unownedExecutor: UnownedSerialExecutor {
        queue.asUnownedSerialExecutor()
    }

    /// `modelFileURL` is nil when the model is not downloaded yet.
    public init(model: ModelSpec, modelFileURL: URL?) {
        self.descriptor = EngineDescriptor(kind: .llama, modelID: model.id, displayName: model.displayName)
        self.modelFileURL = modelFileURL
    }

    public func status() -> EngineStatus {
        .unloaded
    }

    public func load() throws(EngineError) {
        throw .modelMissing
    }

    public func unload() {}

    public func prepare(_ prompt: PreparedPrompt) throws(EngineError) {
        throw .notPrepared
    }

    public func complete(_ request: CompletionRequest, onPartial: @escaping @Sendable (String) -> Void) throws(EngineError) -> Completion {
        throw .notPrepared
    }

    public func blur() {}

    /// A cheap call into the framework (no Metal init). Proves it links and loads.
    static func backendSupportsMemoryMapping() -> Bool {
        llama_supports_mmap()
    }
}
