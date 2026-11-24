// Slice B. The public signatures are frozen.

import ForetypeCore

/// Deterministic canned replies for end-to-end tests. The app selects it only in debug builds when
/// `FORETYPE_ENGINE=stub` is set, so XCUITest can assert exact ghost text.
/// Placeholder: always silent.
public actor StubEngine: Engine {
    public nonisolated let descriptor = EngineDescriptor(kind: .stub, modelID: nil, displayName: "Stub (tests)")
    /// Full replies; `complete` returns the rest of the first one that starts with the typed text.
    private let replies: [String]

    public init(replies: [String]) {
        self.replies = replies
    }

    public func status() -> EngineStatus {
        .ready
    }

    public func load() throws(EngineError) {}

    public func unload() {}

    public func prepare(_ prompt: PreparedPrompt) throws(EngineError) {}

    public func complete(_ request: CompletionRequest, onPartial: @escaping @Sendable (String) -> Void)
        throws(EngineError) -> Completion
    {
        Completion(requestID: request.id, text: "", stopReason: .endOfGeneration, timings: .zero)
    }

    public func blur() {}
}
