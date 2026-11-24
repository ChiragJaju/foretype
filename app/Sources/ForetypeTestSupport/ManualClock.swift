import ForetypeCore
import Synchronization

/// Time moves only when a test calls `advance(by:)`. Sleepers whose deadline has passed resume in
/// deadline order; a cancelled sleeper throws `CancellationError` at once.
public final class ManualClock: MonotonicClock {
    private struct Sleeper {
        let id: UInt64
        let deadline: MonotonicInstant
        let continuation: CheckedContinuation<Void, any Error>
    }

    private struct State {
        var now = MonotonicInstant(sinceOrigin: .zero)
        var nextID: UInt64 = 0
        var sleepers: [Sleeper] = []
        var cancelledBeforeRegistering: Set<UInt64> = []
    }

    private let state = Mutex(State())

    public init() {}

    public func now() -> MonotonicInstant {
        state.withLock { $0.now }
    }

    public var pendingSleeperCount: Int {
        state.withLock { $0.sleepers.count }
    }

    public func sleep(for duration: Duration) async throws {
        let id = state.withLock { state -> UInt64 in
            state.nextID += 1
            return state.nextID
        }
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
                let resumeNow: Result<Void, any Error>? = state.withLock { state in
                    if state.cancelledBeforeRegistering.remove(id) != nil { return .failure(CancellationError()) }
                    if duration <= .zero { return .success(()) }
                    state.sleepers.append(Sleeper(id: id, deadline: state.now + duration, continuation: continuation))
                    return nil
                }
                if let resumeNow { continuation.resume(with: resumeNow) }
            }
        } onCancel: {
            let sleeper = state.withLock { state -> Sleeper? in
                guard let index = state.sleepers.firstIndex(where: { $0.id == id }) else {
                    state.cancelledBeforeRegistering.insert(id)
                    return nil
                }
                return state.sleepers.remove(at: index)
            }
            sleeper?.continuation.resume(throwing: CancellationError())
        }
    }

    /// Moves time forward and resumes every sleeper whose deadline is now due.
    public func advance(by duration: Duration) {
        let due = state.withLock { state -> [Sleeper] in
            state.now = state.now + duration
            let now = state.now
            let ready = state.sleepers.filter { $0.deadline <= now }.sorted { $0.deadline < $1.deadline }
            state.sleepers.removeAll { $0.deadline <= now }
            return ready
        }
        for sleeper in due {
            sleeper.continuation.resume()
        }
    }
}
