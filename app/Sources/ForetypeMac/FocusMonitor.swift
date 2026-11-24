// Slice C. The public signatures are frozen (app/CONTRACTS.md); the bodies are yours.

import ForetypeCore

/// AXObserver for focus, value and selection changes, plus a 150 ms poll for the ~10% of changes
/// apps do not notify. Sets `AXManualAccessibility` on Electron apps and `AXEnhancedUserInterface`
/// on Chromium (ignore its error; the tree is there anyway).
/// Placeholder: reports nothing.
@AXActor
public final class FocusMonitor: FocusMonitoring {
    private nonisolated let stream: AsyncStream<FocusEvent>
    private nonisolated let continuation: AsyncStream<FocusEvent>.Continuation

    public nonisolated init() {
        (stream, continuation) = AsyncStream.makeStream(of: FocusEvent.self)
    }

    public nonisolated func events() -> AsyncStream<FocusEvent> {
        stream
    }

    public func start() async {}

    public func stop() async {}

    public func track(_ field: FocusedField?) async {}
}
