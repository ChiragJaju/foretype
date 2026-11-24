// Slice C. The public signatures are frozen (app/CONTRACTS.md); the bodies are yours.

import ForetypeCore

/// Value, selection, the caret ladder (range bounds cross-checked against the previous character,
/// text marker, previous character, next character, field frame) and the nearby-text walk.
/// The walk stays inside the field's own container plus labels: a window-wide walk leaks Notes'
/// other note titles and Slack's other messages.
/// Placeholder: reads nothing.
@AXActor
public final class AXContextReader: ContextReading {
    public nonisolated init() {}

    public func snapshot(of field: FocusedField) async -> FieldSnapshot? {
        nil
    }

    public func capture(_ field: FocusedField, budget: ContextBudget) async -> CapturedContext? {
        nil
    }
}
