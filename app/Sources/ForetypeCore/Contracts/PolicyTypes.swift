// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

import Foundation

/// Why Foretype stays silent for a field or for everything.
public enum DenyReason: Sendable, Hashable {
    case disabled
    case paused(until: Date)
    case accessibilityNotTrusted
    /// Another app holds Secure Event Input. The menu bar shows "Paused: secure input held by <app>".
    case secureInputHeld(by: String?)
    case secureField
    case deniedApp(bundleID: String)
    /// Foretype's own windows (settings, onboarding).
    case ownApp
    case notEditable
    /// Rejects stray 1x1 helper fields that some Electron apps focus.
    case fieldTooSmall
}

/// The gate in front of every read. Nothing from a field or its window is read unless this is `.allow`.
public enum PolicyDecision: Sendable, Hashable {
    case allow
    case deny(DenyReason)
}

/// Whether another process holds Secure Event Input (`IsSecureEventInputEnabled`).
public enum SecureInputState: Sendable, Hashable {
    case inactive
    case active(holderName: String?)
}

public struct PermissionState: Sendable, Hashable {
    public var accessibilityTrusted: Bool
    public var secureInput: SecureInputState

    public init(accessibilityTrusted: Bool, secureInput: SecureInputState) {
        self.accessibilityTrusted = accessibilityTrusted
        self.secureInput = secureInput
    }

    public static let untrusted = PermissionState(accessibilityTrusted: false, secureInput: .inactive)
}

/// User settings. Persisted by `SettingsStoring` in UserDefaults; snippets are not part of this.
public struct ForetypeSettings: Sendable, Hashable, Codable {
    public var isEnabled: Bool
    public var pausedUntil: Date?
    /// Bundle IDs where Foretype never reads or suggests. Starts as `defaultDeniedBundleIDs`.
    public var deniedBundleIDs: Set<String>
    public var hasCompletedOnboarding: Bool
    /// `ModelSpec.id` of the model to load; nil runs snippets only.
    public var activeModelID: String?
    public var launchAtLogin: Bool
    /// The name the prompt writes as ("Replies I (<name>) typed"). nil uses the account's full name.
    public var displayName: String?

    public init(
        isEnabled: Bool = true,
        pausedUntil: Date? = nil,
        deniedBundleIDs: Set<String> = ForetypeSettings.defaultDeniedBundleIDs,
        hasCompletedOnboarding: Bool = false,
        activeModelID: String? = nil,
        launchAtLogin: Bool = false,
        displayName: String? = nil
    ) {
        self.isEnabled = isEnabled
        self.pausedUntil = pausedUntil
        self.deniedBundleIDs = deniedBundleIDs
        self.hasCompletedOnboarding = hasCompletedOnboarding
        self.activeModelID = activeModelID
        self.launchAtLogin = launchAtLogin
        self.displayName = displayName
    }

    /// Password managers, Keychain Access and terminals. Banking apps are added per user.
    public static let defaultDeniedBundleIDs: Set<String> = [
        "com.apple.keychainaccess",
        "com.apple.Passwords",
        "com.1password.1password",
        "com.agilebits.onepassword7",
        "com.bitwarden.desktop",
        "com.lastpass.LastPass",
        "com.dashlane.dashlanephonefinal",
        "com.apple.Terminal",
        "com.googlecode.iterm2",
        "com.mitchellh.ghostty",
        "dev.warp.Warp-Stable",
    ]
}
