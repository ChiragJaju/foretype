import ForetypeCore
import Synchronization

/// Settable permission state; `set` yields to `updates()` when the state changes.
public final class FakePermissions: PermissionChecking {
    private struct State {
        var current: PermissionState
        var accessibilityRequests = 0
        var settingsOpened = 0
    }

    private let state: Mutex<State>
    private let stream: AsyncStream<PermissionState>
    private let continuation: AsyncStream<PermissionState>.Continuation

    public init(_ initial: PermissionState = PermissionState(accessibilityTrusted: true, secureInput: .inactive)) {
        state = Mutex(State(current: initial))
        (stream, continuation) = AsyncStream.makeStream(of: PermissionState.self)
    }

    public var accessibilityRequests: Int { state.withLock { $0.accessibilityRequests } }
    public var settingsOpened: Int { state.withLock { $0.settingsOpened } }

    public func set(_ newState: PermissionState) {
        let changed = state.withLock { state -> Bool in
            guard state.current != newState else { return false }
            state.current = newState
            return true
        }
        if changed { continuation.yield(newState) }
    }

    public func current() -> PermissionState {
        state.withLock { $0.current }
    }

    public func requestAccessibility() {
        state.withLock { $0.accessibilityRequests += 1 }
    }

    public func openAccessibilitySettings() {
        state.withLock { $0.settingsOpened += 1 }
    }

    public func updates() -> AsyncStream<PermissionState> {
        stream
    }
}
