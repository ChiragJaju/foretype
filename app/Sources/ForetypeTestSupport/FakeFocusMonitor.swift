import ForetypeCore
import Synchronization

/// Push focus events by hand with `send`. Records every `track` call so tests can assert that a
/// denied field was never tracked (and so never read).
public final class FakeFocusMonitor: FocusMonitoring {
    private struct State {
        var isStarted = false
        var trackedFields: [FocusedField?] = []
    }

    private let state = Mutex(State())
    private let stream: AsyncStream<FocusEvent>
    private let continuation: AsyncStream<FocusEvent>.Continuation

    public init() {
        (stream, continuation) = AsyncStream.makeStream(of: FocusEvent.self)
    }

    public var isStarted: Bool { state.withLock { $0.isStarted } }
    public var trackedFields: [FocusedField?] { state.withLock { $0.trackedFields } }

    public func send(_ event: FocusEvent) {
        continuation.yield(event)
    }

    public func events() -> AsyncStream<FocusEvent> {
        stream
    }

    public func start() async {
        state.withLock { $0.isStarted = true }
    }

    public func stop() async {
        state.withLock { $0.isStarted = false }
    }

    public func track(_ field: FocusedField?) async {
        state.withLock { $0.trackedFields.append(field) }
    }
}
