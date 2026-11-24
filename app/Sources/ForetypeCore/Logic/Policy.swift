// Slice A. The public signatures below are frozen (docs/guides/contracts.md); the bodies are yours.

import Foundation

/// The gate in front of every read: deny list, secure fields, Foretype's own windows, pause.
public enum Policy {
    /// A reason that silences Foretype everywhere, or nil. Placeholder: always disabled.
    public static func globalDenyReason(settings: ForetypeSettings, permissions: PermissionState, now: Date)
        -> DenyReason?
    {
        .disabled
    }

    /// Runs on focus, before any text is read. Placeholder: denies every field.
    public static func evaluate(
        _ field: FocusedField, settings: ForetypeSettings, permissions: PermissionState, ownBundleID: String, now: Date
    ) -> PolicyDecision {
        .deny(.disabled)
    }
}
