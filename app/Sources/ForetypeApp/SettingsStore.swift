// Slice D.

import ForetypeCore

/// `ForetypeSettings` as one JSON value in UserDefaults.
/// Placeholder: defaults only; saves nothing.
final class UserDefaultsSettingsStore: SettingsStoring {
    func load() -> ForetypeSettings {
        ForetypeSettings()
    }

    func save(_ settings: ForetypeSettings) {}

    func updates() -> AsyncStream<ForetypeSettings> {
        AsyncStream { $0.finish() }
    }
}
