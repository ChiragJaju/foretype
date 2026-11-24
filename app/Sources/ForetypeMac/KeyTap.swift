// Slice C. The public signatures are frozen (docs/guides/contracts.md); the bodies are yours.

import ForetypeCore

/// A listen-only tap (tail-append) and a consuming tap (head-insert, created once, enabled only in
/// `.listenAndIntercept`), both on their own `RunLoopThread`. Rules the spike proved:
/// - `tapDisabledByUserInput` is our own `tapEnable(false)` echoing back: ignore it. Re-enable only
///   on `tapDisabledByTimeout`, and only to the desired state (re-enabling on user input spun 25k callbacks).
/// - Events we post carry a source-user-data tag and are ignored by both taps.
/// - Swallow the key-up that pairs with a swallowed key-down.
/// Placeholder: creates no taps and reports nothing.
public final class KeyTap: KeyTapping {
    private let stream: AsyncStream<TapEvent>
    private let continuation: AsyncStream<TapEvent>.Continuation

    public init() {
        (stream, continuation) = AsyncStream.makeStream(of: TapEvent.self)
    }

    public func events() -> AsyncStream<TapEvent> {
        stream
    }

    public func start() throws(KeyTapError) {}

    public func stop() {}

    public func setMode(_ mode: TapMode) {}

    public func replay(_ key: SuggestionKey) {}
}
