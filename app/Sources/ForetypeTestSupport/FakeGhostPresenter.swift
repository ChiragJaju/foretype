import ForetypeCore

/// Records what would be drawn. `current` is what is on screen now.
@MainActor
public final class FakeGhostPresenter: GhostPresenting {
    public private(set) var shown: [GhostContent] = []
    public private(set) var current: GhostContent?
    public private(set) var hideCount = 0

    public init() {}

    public func show(_ ghost: GhostContent) {
        shown.append(ghost)
        current = ghost
    }

    public func hide() {
        hideCount += 1
        current = nil
    }
}
