import ForetypeCore
import Synchronization

/// Scripted reads. `readFieldIDs` lists every field anything was read from, in order: the privacy
/// tests assert a denied or secure field never appears in it.
public final class FakeContextReader: ContextReading {
    private struct State {
        var snapshots: [FieldID: FieldSnapshot] = [:]
        var contexts: [FieldID: CapturedContext] = [:]
        var readFieldIDs: [FieldID] = []
    }

    private let state = Mutex(State())

    public init() {}

    public var readFieldIDs: [FieldID] { state.withLock { $0.readFieldIDs } }

    public func setSnapshot(_ snapshot: FieldSnapshot) {
        state.withLock { $0.snapshots[snapshot.fieldID] = snapshot }
    }

    public func setContext(_ context: CapturedContext) {
        state.withLock { $0.contexts[context.field.id] = context }
    }

    public func snapshot(of field: FocusedField) async -> FieldSnapshot? {
        state.withLock { state in
            state.readFieldIDs.append(field.id)
            return state.snapshots[field.id]
        }
    }

    public func capture(_ field: FocusedField, budget: ContextBudget) async -> CapturedContext? {
        state.withLock { state in
            state.readFieldIDs.append(field.id)
            return state.contexts[field.id]
        }
    }
}
