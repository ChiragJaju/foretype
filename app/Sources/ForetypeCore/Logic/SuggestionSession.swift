// Slice A. The public signatures below are frozen (docs/guides/contracts.md); the bodies are yours.

import Foundation

/// The pure state machine. See `Contracts/Session.swift` for states, events and effects.
/// Placeholder: stays idle and emits no effects, so nothing is read and no key is touched.
public struct SuggestionSession: Sendable {
    public private(set) var state: SessionState
    public let configuration: SessionConfiguration

    public init(configuration: SessionConfiguration) {
        self.configuration = configuration
        self.state = .idle
    }

    /// Applies one event and returns the effects to run, in order. `now` is wall-clock time for
    /// the pause deadline; latency and debounce use the runner's `MonotonicClock`.
    public mutating func handle(_ event: SessionEvent, now: Date) -> [SessionEffect] {
        []
    }
}
