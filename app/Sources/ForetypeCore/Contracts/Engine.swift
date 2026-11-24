// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

public enum EngineKind: String, Sendable, Hashable, Codable {
    /// llama.cpp with a downloaded GGUF model.
    case llama
    /// Deterministic canned output for end-to-end tests (`FORETYPE_ENGINE=stub`, debug builds only).
    case stub
    /// No model: snippets are the only suggestions.
    case snippetsOnly
}

/// What the menu bar shows as the active engine.
public struct EngineDescriptor: Sendable, Hashable {
    public var kind: EngineKind
    /// `ModelSpec.id` when a model backs the engine.
    public var modelID: String?
    public var displayName: String

    public init(kind: EngineKind, modelID: String?, displayName: String) {
        self.kind = kind
        self.modelID = modelID
        self.displayName = displayName
    }
}

public enum EngineError: Error, Sendable, Hashable {
    case modelMissing
    case loadFailed(String)
    /// `complete` was called before `prepare` for the current field.
    case notPrepared
    case promptTooLong(tokens: Int, limit: Int)
    case decodeFailed(code: Int32)
    /// The caller's task was cancelled (a newer keystroke, a blur). Not a failure; never shown.
    case cancelled
}

public enum EngineStatus: Sendable, Hashable {
    case unloaded
    case loading
    case ready
    case failed(EngineError)
}

/// The prompt prefix evaluated once per focused field. The engine keeps its KV state until `blur()`.
public struct PreparedPrompt: Sendable, Hashable {
    public var fieldID: FieldID
    /// Everything up to and including "My reply:" in the base-style continuation template.
    public var text: String
    /// Template text between `text` and the typed prefix: " " for the base-style template.
    public var lead: String

    public init(fieldID: FieldID, text: String, lead: String) {
        self.fieldID = fieldID
        self.text = text
        self.lead = lead
    }
}

/// Monotonic per run. Results tagged with an older ID than the session's current one are dropped.
public struct RequestID: Sendable, Hashable, Comparable {
    public var rawValue: UInt64

    public init(rawValue: UInt64) {
        self.rawValue = rawValue
    }

    public static func < (lhs: RequestID, rhs: RequestID) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

public struct CompletionRequest: Sendable, Hashable {
    public var id: RequestID
    public var fieldID: FieldID
    /// The reply text before the caret. The engine token-heals its trailing partial word.
    public var typed: String
    public var maxTokens: Int

    public init(id: RequestID, fieldID: FieldID, typed: String, maxTokens: Int = SuggestionLimits.maxTokens) {
        self.id = id
        self.fieldID = fieldID
        self.typed = typed
        self.maxTokens = maxTokens
    }
}

public enum StopReason: String, Sendable, Hashable {
    case endOfGeneration
    case newline
    /// `.`, `?` or `!` followed by a token that starts with whitespace, so "p.m." and emails stay whole.
    case sentenceEnd
    case maxTokens
}

/// Timings measured inside the engine from the start of `complete`. Logged locally, never sent.
public struct CompletionTimings: Sendable, Hashable {
    public var prefixEval: Duration
    public var firstToken: Duration?
    public var firstVisibleWord: Duration?
    public var total: Duration
    public var generatedTokens: Int
    public var reusedPrefixTokens: Int

    public init(
        prefixEval: Duration, firstToken: Duration?, firstVisibleWord: Duration?, total: Duration, generatedTokens: Int,
        reusedPrefixTokens: Int
    ) {
        self.prefixEval = prefixEval
        self.firstToken = firstToken
        self.firstVisibleWord = firstVisibleWord
        self.total = total
        self.generatedTokens = generatedTokens
        self.reusedPrefixTokens = reusedPrefixTokens
    }

    public static let zero = CompletionTimings(
        prefixEval: .zero, firstToken: nil, firstVisibleWord: nil, total: .zero, generatedTokens: 0,
        reusedPrefixTokens: 0)
}

public struct Completion: Sendable, Hashable {
    public var requestID: RequestID
    /// The visible continuation after the typed prefix. May be empty (silence).
    public var text: String
    public var stopReason: StopReason
    public var timings: CompletionTimings

    public init(requestID: RequestID, text: String, stopReason: StopReason, timings: CompletionTimings) {
        self.requestID = requestID
        self.text = text
        self.stopReason = stopReason
        self.timings = timings
    }
}

/// A local text-continuation model. One field at a time: `prepare` on focus, `complete` per keystroke,
/// `blur` on focus loss.
///
/// Threading: implementations are actors on their own serial executor (never the main actor), so a
/// 100 ms prefill blocks nothing else. Calls are serialised in arrival order per caller.
///
/// Cancellation: `complete` checks `Task.isCancelled` between tokens and throws `.cancelled`
/// within one decode step. The session cancels the in-flight task on every new keystroke, so at most
/// one completion runs at a time.
public protocol Engine: Sendable {
    var descriptor: EngineDescriptor { get }
    func status() async -> EngineStatus
    /// Loads weights and runs one warm-up decode (the first Metal compile takes seconds). Idempotent.
    func load() async throws(EngineError)
    /// Frees the weights. Called after 10 minutes idle.
    func unload() async
    /// Drops any previous field's state and evaluates the prompt prefix.
    func prepare(_ prompt: PreparedPrompt) async throws(EngineError)
    /// Drafts a continuation of `request.typed`. `onPartial` receives the visible text so far after each
    /// token, on the engine's executor; it must return quickly.
    func complete(_ request: CompletionRequest, onPartial: @escaping @Sendable (String) -> Void)
        async throws(EngineError) -> Completion
    /// Forgets everything the model saw for the current field (clears the KV cache).
    func blur() async
}
