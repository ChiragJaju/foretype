// Slice C. The public signatures are frozen (docs/guides/contracts.md); the bodies are yours.

import ForetypeCore

/// `AXIsProcessTrusted` and `IsSecureEventInputEnabled`, polled once a second. Accessibility alone
/// covers both taps on macOS 27; never ask for Input Monitoring, never read the TCC database.
/// Placeholder: reports untrusted.
public final class SystemPermissions: PermissionChecking {
    public init() {}

    public func current() -> PermissionState {
        .untrusted
    }

    public func requestAccessibility() {}

    public func openAccessibilitySettings() {}

    public func updates() -> AsyncStream<PermissionState> {
        AsyncStream { $0.finish() }
    }
}
