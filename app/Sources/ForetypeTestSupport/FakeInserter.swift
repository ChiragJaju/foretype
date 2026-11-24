import ForetypeCore
import Synchronization

/// Records requests. Lands on the first rung unless `setOutcome` scripts another result.
public final class FakeInserter: TextInserting {
    private struct State {
        var requests: [InsertRequest] = []
        var scriptedOutcome: InsertOutcome?
    }

    private let state = Mutex(State())

    public init() {}

    public var requests: [InsertRequest] { state.withLock { $0.requests } }

    public func setOutcome(_ outcome: InsertOutcome?) {
        state.withLock { $0.scriptedOutcome = outcome }
    }

    public func insert(_ request: InsertRequest) async -> InsertResult {
        let scripted = state.withLock { state -> InsertOutcome? in
            state.requests.append(request)
            return state.scriptedOutcome
        }
        let outcome = scripted ?? request.methods.first.map(InsertOutcome.landed) ?? .failed
        return InsertResult(request: request, outcome: outcome, attempts: [])
    }
}
