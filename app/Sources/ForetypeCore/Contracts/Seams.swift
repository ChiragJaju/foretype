// FROZEN CONTRACT. Owned by the orchestrator. See docs/guides/contracts.md before changing anything here.
//
// Every boundary between the pure session logic and the outside world. ForetypeMac, ForetypeEngine
// and ForetypeApp implement these; ForetypeTestSupport fakes each one.
//
// Streams: each `events()` / `updates()` returns one stream for one consumer (the `SessionRunner`).
// Call it once. The stream finishes when the producer stops for good.

// MARK: - Focus

public enum FocusEvent: Sendable, Hashable {
    /// A new element took focus. Carries no text (see `FocusedField`).
    case focused(FocusedField)
    /// Focus left any editable element, or the focused app quit.
    case blurred
    /// The tracked field's text, selection or caret changed. Sent only for the field passed to `track`.
    case changed(FieldSnapshot)
}

/// Finds the focused editable element in any app (AX observer plus a 150 ms poll for apps whose
/// notifications are incomplete). Runs on `AXActor`.
public protocol FocusMonitoring: Sendable {
    func events() -> AsyncStream<FocusEvent>
    func start() async
    func stop() async
    /// Starts reading text for this field, which policy has allowed: emits `.changed` on every edit.
    /// nil stops all text reads. Until `track` names a field, the monitor reads no field text at all.
    func track(_ field: FocusedField?) async
}

// MARK: - Context

/// Reads field text and nearby window text. Called only for fields policy has allowed; implementations
/// still refuse secure fields as a second line of defence. Runs on `AXActor`.
public protocol ContextReading: Sendable {
    /// Typing truth: value around the caret, selection and caret geometry. nil if the element is gone.
    func snapshot(of field: FocusedField) async -> FieldSnapshot?
    /// Labels, window title and nearby text, nearest first, within `budget`. nil if the element is gone.
    func capture(_ field: FocusedField, budget: ContextBudget) async -> CapturedContext?
}

// MARK: - Keys

/// The listen-only and consuming event taps. Tap callbacks run on a dedicated run-loop thread and
/// never wait on any actor. Everything fails open: if anything goes wrong, keys pass through.
///
/// Implementations must tear both taps down on their own when `AXIsProcessTrusted()` turns false
/// (checked at least once a second on the tap thread), without waiting for the session: revoking
/// Accessibility under a live tap can freeze input.
public protocol KeyTapping: Sendable {
    func events() -> AsyncStream<TapEvent>
    /// Creates both taps (consuming tap disabled). Needs Accessibility; no Input Monitoring prompt.
    func start() throws(KeyTapError)
    func stop()
    /// Synchronous and safe from any thread: the tap thread reads the mode on every event.
    func setMode(_ mode: TapMode)
    /// Re-posts a swallowed key the session could not use (it raced a hide), tagged so the
    /// consuming tap lets it through. Keeps the user's Tab or Esc from being lost.
    func replay(_ key: SuggestionKey)
}

// MARK: - Insertion

/// Types accepted text into the focused field. Never touches the clipboard.
public protocol TextInserting: Sendable {
    func insert(_ request: InsertRequest) async -> InsertResult
}

// MARK: - Ghost

/// What the presenter draws. Exact and derived carets get ghost text at the caret; an estimated caret
/// gets the inline card attached to the field; `.none` is never sent (the session hides instead).
public struct GhostContent: Sendable, Hashable {
    public var text: String
    public var caret: CaretGeometry
    public var fieldFrame: AXRect?
    public var source: SuggestionSource

    public init(text: String, caret: CaretGeometry, fieldFrame: AXRect?, source: SuggestionSource) {
        self.text = text
        self.caret = caret
        self.fieldFrame = fieldFrame
        self.source = source
    }
}

/// The borderless, non-activating, click-through panel. Main actor only.
/// The panel exposes the shown text as its accessibility label so XCUITest can read it.
@MainActor
public protocol GhostPresenting: AnyObject {
    func show(_ ghost: GhostContent)
    func hide()
}

// MARK: - Permissions

public protocol PermissionChecking: Sendable {
    /// Public preflight APIs only (`AXIsProcessTrusted`, `IsSecureEventInputEnabled`); never the TCC database.
    func current() -> PermissionState
    /// Shows the system Accessibility prompt. Onboarding only.
    func requestAccessibility()
    func openAccessibilitySettings()
    /// Polled about once a second; yields only on change. Trust flips live, with no relaunch.
    func updates() -> AsyncStream<PermissionState>
}

// MARK: - Storage

public enum SnippetStoreError: Error, Sendable, Hashable {
    case keyUnavailable(String)
    case decryptionFailed
    case fileSystem(String)
}

/// Snippets, encrypted at rest with AES-GCM; the key lives in the Keychain.
public protocol SnippetStoring: Sendable {
    func load() async throws(SnippetStoreError) -> [Snippet]
    func save(_ snippets: [Snippet]) async throws(SnippetStoreError)
}

/// Settings persistence (UserDefaults). Synchronous: reads and writes are small.
public protocol SettingsStoring: Sendable {
    func load() -> ForetypeSettings
    func save(_ settings: ForetypeSettings)
    /// Yields after every `save`, from any writer.
    func updates() -> AsyncStream<ForetypeSettings>
}
