import ForetypeCore
import Synchronization

/// Push tap events with `send`. Records the mode history and replayed keys.
public final class FakeKeyTap: KeyTapping {
    private struct State {
        var isStarted = false
        var modes: [TapMode] = []
        var replayedKeys: [SuggestionKey] = []
        var startError: KeyTapError?
    }

    private let state = Mutex(State())
    private let stream: AsyncStream<TapEvent>
    private let continuation: AsyncStream<TapEvent>.Continuation

    public init() {
        (stream, continuation) = AsyncStream.makeStream(of: TapEvent.self)
    }

    public var isStarted: Bool { state.withLock { $0.isStarted } }
    public var modes: [TapMode] { state.withLock { $0.modes } }
    public var currentMode: TapMode { state.withLock { $0.modes.last ?? .off } }
    public var replayedKeys: [SuggestionKey] { state.withLock { $0.replayedKeys } }

    public func failStart(with error: KeyTapError?) {
        state.withLock { $0.startError = error }
    }

    public func send(_ event: TapEvent) {
        continuation.yield(event)
    }

    public func events() -> AsyncStream<TapEvent> {
        stream
    }

    public func start() throws(KeyTapError) {
        let error = state.withLock { state -> KeyTapError? in
            if state.startError == nil { state.isStarted = true }
            return state.startError
        }
        if let error { throw error }
    }

    public func stop() {
        state.withLock {
            $0.isStarted = false
            $0.modes.append(.off)
        }
    }

    public func setMode(_ mode: TapMode) {
        state.withLock { $0.modes.append(mode) }
    }

    public func replay(_ key: SuggestionKey) {
        state.withLock { $0.replayedKeys.append(key) }
    }
}
