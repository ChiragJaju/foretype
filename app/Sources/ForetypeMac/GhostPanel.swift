// Slice C. The public signatures are frozen (docs/guides/contracts.md); the bodies are yours.

import AppKit
import ForetypeCore

/// A borderless, non-activating, click-through `NSPanel` at the caret, and the inline card attached
/// to the field when the caret is only estimated. Converts `AXRect` with `NSScreen.screens[0]`.
/// Placeholder: draws nothing.
@MainActor
public final class GhostPanel: GhostPresenting {
    public init() {}

    public func show(_ ghost: GhostContent) {}

    public func hide() {}
}
