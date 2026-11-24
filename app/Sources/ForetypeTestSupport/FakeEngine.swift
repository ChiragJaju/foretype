import ForetypeCore

/// Scripted engine. `complete` returns the rest of the first reply that starts with the typed text,
/// streamed word by word with `perWordDelay` on the given clock, and honours cancellation.
public actor FakeEngine: Engine {
    public nonisolated let descriptor: EngineDescriptor
    public private(set) var preparedPrompts: [PreparedPrompt] = []
    public private(set) var requests: [CompletionRequest] = []
    public private(set) var cancelledRequests: [RequestID] = []
    public private(set) var blurCount = 0
    public private(set) var loadCount = 0

    private var replies: [String]
    private var loadError: EngineError?
    private var currentStatus: EngineStatus = .unloaded
    private var preparedFieldID: FieldID?
    private let clock: any MonotonicClock
    private let perWordDelay: Duration

    public init(
        replies: [String] = [],
        descriptor: EngineDescriptor = EngineDescriptor(kind: .stub, modelID: nil, displayName: "Fake"),
        clock: any MonotonicClock = SystemClock(),
        perWordDelay: Duration = .zero
    ) {
        self.replies = replies
        self.descriptor = descriptor
        self.clock = clock
        self.perWordDelay = perWordDelay
    }

    public func setReplies(_ replies: [String]) {
        self.replies = replies
    }

    /// The next `load()` fails with this error.
    public func failLoad(with error: EngineError?) {
        loadError = error
    }

    public func status() -> EngineStatus {
        currentStatus
    }

    public func load() throws(EngineError) {
        loadCount += 1
        if let loadError {
            currentStatus = .failed(loadError)
            throw loadError
        }
        currentStatus = .ready
    }

    public func unload() {
        currentStatus = .unloaded
        preparedFieldID = nil
    }

    public func prepare(_ prompt: PreparedPrompt) throws(EngineError) {
        guard currentStatus == .ready else { throw .notPrepared }
        preparedPrompts.append(prompt)
        preparedFieldID = prompt.fieldID
    }

    public func complete(_ request: CompletionRequest, onPartial: @escaping @Sendable (String) -> Void)
        async throws(EngineError) -> Completion
    {
        guard preparedFieldID == request.fieldID else { throw .notPrepared }
        requests.append(request)
        let continuation =
            replies.first { $0.hasPrefix(request.typed) }.map { String($0.dropFirst(request.typed.count)) } ?? ""
        var visible = ""
        for word in Self.words(continuation) {
            do {
                try await clock.sleep(for: perWordDelay)
            } catch {
                cancelledRequests.append(request.id)
                throw .cancelled
            }
            if Task.isCancelled {
                cancelledRequests.append(request.id)
                throw .cancelled
            }
            visible += word
            onPartial(visible)
        }
        return Completion(requestID: request.id, text: visible, stopReason: .endOfGeneration, timings: .zero)
    }

    public func blur() {
        blurCount += 1
        preparedFieldID = nil
    }

    /// Splits keeping each word's leading whitespace, the way tokens arrive.
    private static func words(_ text: String) -> [String] {
        var words: [String] = []
        var current = ""
        for character in text {
            if character.isWhitespace, current.contains(where: { !$0.isWhitespace }) {
                words.append(current)
                current = ""
            }
            current.append(character)
        }
        if !current.isEmpty { words.append(current) }
        return words
    }
}
