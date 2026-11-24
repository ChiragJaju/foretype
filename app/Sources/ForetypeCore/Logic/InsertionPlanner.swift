// Slice A. The public signatures below are frozen (app/CONTRACTS.md); the bodies are yours.

/// Picks the insertion ladder per host. AppKit: AX first, then Unicode. WebKit, Chromium, Electron:
/// Unicode only (their AX write is a silent no-op). Text with a leading space in a Cocoa text view
/// prefers Unicode, because the AX write can autocorrect the previous word.
public enum InsertionPlanner {
    /// Placeholder: no rungs, so an insert does nothing.
    public static func methods(for host: TextHost, text: String) -> [InsertionMethod] {
        []
    }
}
