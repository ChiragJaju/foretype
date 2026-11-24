// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

public struct KeyModifiers: OptionSet, Sendable, Hashable {
    public let rawValue: UInt8

    public init(rawValue: UInt8) {
        self.rawValue = rawValue
    }

    public static let shift = KeyModifiers(rawValue: 1 << 0)
    public static let control = KeyModifiers(rawValue: 1 << 1)
    public static let option = KeyModifiers(rawValue: 1 << 2)
    public static let command = KeyModifiers(rawValue: 1 << 3)
    public static let function = KeyModifiers(rawValue: 1 << 4)
}

public enum KeystrokeKind: Sendable, Hashable {
    /// The characters the key produces, as the event reports them. May be empty for dead keys.
    case text(String)
    case backspace
    case forwardDelete
    case returnKey
    case tab
    case escape
    case arrowLeft
    case arrowRight
    case arrowUp
    case arrowDown
    case other(keyCode: UInt16)
}

/// One user key-down seen by the listen-only tap. A hint for instant prefix-trim only: the field's
/// real text comes from the next `FieldSnapshot`. Events Foretype posts itself never appear here.
public struct Keystroke: Sendable, Hashable {
    public var kind: KeystrokeKind
    public var modifiers: KeyModifiers
    public var isAutoRepeat: Bool

    public init(kind: KeystrokeKind, modifiers: KeyModifiers = [], isAutoRepeat: Bool = false) {
        self.kind = kind
        self.modifiers = modifiers
        self.isAutoRepeat = isAutoRepeat
    }
}

/// Keys the consuming tap swallows while a suggestion is visible.
public enum SuggestionKey: String, Sendable, Hashable {
    /// Tab: insert the whole suggestion.
    case acceptAll
    /// Option-Right: insert the next word.
    case acceptWord
    /// Esc: hide the suggestion until the next edit.
    case dismiss
}

/// Which taps are live. The consuming tap exists from `start()` but stays disabled unless
/// the mode is `.listenAndIntercept`.
public enum TapMode: String, Sendable, Hashable {
    /// No allowed field is focused: no keystrokes are observed at all.
    case off
    /// An allowed field is focused and no suggestion is visible.
    case listen
    /// A suggestion is visible: Tab, Option-Right and Esc are swallowed.
    case listenAndIntercept
}

public enum TapInterruption: String, Sendable, Hashable {
    /// The system disabled a tap for being slow. The tap re-enabled itself to the desired state.
    case timeout
    /// Accessibility trust was lost. Both taps are torn down; typing passes through untouched.
    case trustLost
}

public enum TapEvent: Sendable, Hashable {
    case keystroke(Keystroke)
    /// A key the consuming tap swallowed. If the session cannot use it, it must be replayed.
    case suggestionKey(SuggestionKey)
    case interrupted(TapInterruption)
}

public enum KeyTapError: Error, Sendable, Hashable {
    case accessibilityNotTrusted
    case tapCreationFailed
}
