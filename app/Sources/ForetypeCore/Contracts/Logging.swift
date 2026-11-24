// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

import os

/// Structured logs through the unified logging system; no `print` in app code.
/// Field text, screen text, snippets and keystrokes are never logged, not even as `.private`.
/// Log IDs, lengths, methods, timings and reasons instead.
public enum LogCategory: String, Sendable {
    case session
    case focus
    case context
    case keys
    case insert
    case ghost
    case engine
    case models
    case snippets
    case permissions
    case app
}

public enum ForetypeLog {
    public static let subsystem = "dev.foretype"

    public static func logger(_ category: LogCategory) -> Logger {
        Logger(subsystem: subsystem, category: category.rawValue)
    }
}
