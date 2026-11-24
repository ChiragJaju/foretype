// FROZEN CONTRACT. Owned by the orchestrator. See docs/guides/contracts.md before changing anything here.

/// A point on a monotonic timeline with an arbitrary origin.
public struct MonotonicInstant: Sendable, Hashable, Comparable {
    public var sinceOrigin: Duration

    public init(sinceOrigin: Duration) {
        self.sinceOrigin = sinceOrigin
    }

    public static func < (lhs: MonotonicInstant, rhs: MonotonicInstant) -> Bool {
        lhs.sinceOrigin < rhs.sinceOrigin
    }

    public static func + (lhs: MonotonicInstant, rhs: Duration) -> MonotonicInstant {
        MonotonicInstant(sinceOrigin: lhs.sinceOrigin + rhs)
    }

    public static func - (lhs: MonotonicInstant, rhs: MonotonicInstant) -> Duration {
        lhs.sinceOrigin - rhs.sinceOrigin
    }
}

/// The clock seam: debounce, idle unload and latency all read time through this, so tests drive
/// time by hand with `ManualClock`. Named apart from `Swift.Clock` to avoid shadowing it.
public protocol MonotonicClock: Sendable {
    func now() -> MonotonicInstant
    /// Throws `CancellationError` if the calling task is cancelled while asleep.
    func sleep(for duration: Duration) async throws
}

/// `ContinuousClock`, which keeps counting while the Mac sleeps.
public struct SystemClock: MonotonicClock {
    private let origin = ContinuousClock.now

    public init() {}

    public func now() -> MonotonicInstant {
        MonotonicInstant(sinceOrigin: origin.duration(to: .now))
    }

    public func sleep(for duration: Duration) async throws {
        try await ContinuousClock().sleep(for: duration)
    }
}
