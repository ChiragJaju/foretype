// Slice A. The public signatures below are frozen (app/CONTRACTS.md); the bodies are yours.

import Observation

/// Feeds `SuggestionSession` from the seams and executes its effects. Main actor; every await on
/// a seam hops to that seam's own executor (AX actor, engine actor, tap thread).
///
/// Cancellation: one completion task at most. `.requestCompletion` cancels the previous task
/// before starting the next, and the session drops any result whose `RequestID` is not current.
/// Placeholder: never starts, so the app runs but stays silent.
@MainActor
@Observable
public final class SessionRunner {
    public private(set) var status: RunnerStatus

    @ObservationIgnored private let dependencies: SessionDependencies
    @ObservationIgnored private let configuration: SessionConfiguration

    public init(dependencies: SessionDependencies, configuration: SessionConfiguration) {
        self.dependencies = dependencies
        self.configuration = configuration
        self.status = .stopped(engine: configuration.engine)
    }

    /// Subscribes to every seam's stream, loads snippets and settings, and starts the engine load.
    public func start() async {}

    /// Hides the ghost, turns the taps off, blurs the engine and stops the focus monitor.
    public func stop() async {}
}
