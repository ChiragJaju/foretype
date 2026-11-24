// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

/// One rung of the insertion ladder. There is no clipboard rung, ever.
public enum InsertionMethod: String, Sendable, Hashable, Codable {
    /// Write `kAXSelectedTextAttribute`. Native, one undo step in most AppKit hosts.
    case axSelectedText
    /// Post Unicode key events in chunks of at most 20 UTF-16 units, tagged so our own taps ignore them.
    case unicodeEvents
}

/// What to type and where. `methods` is the ordered ladder chosen by `InsertionPlanner`; the inserter
/// tries each in turn and reads the field back after each to confirm the text landed.
public struct InsertRequest: Sendable, Hashable {
    public var fieldID: FieldID
    public var text: String
    /// The caret location (UTF-16, full value) the text must land at.
    public var caretLocation: Int
    public var methods: [InsertionMethod]

    public init(fieldID: FieldID, text: String, caretLocation: Int, methods: [InsertionMethod]) {
        self.fieldID = fieldID
        self.text = text
        self.caretLocation = caretLocation
        self.methods = methods
    }
}

public struct InsertAttempt: Sendable, Hashable {
    public var method: InsertionMethod
    /// nil when the field value could not be read back.
    public var landed: Bool?
    /// The raw `AXError` for `.axSelectedText`. WebKit and Chromium return 0 and do nothing, so never trust it alone.
    public var axErrorCode: Int32?
    public var elapsed: Duration

    public init(method: InsertionMethod, landed: Bool?, axErrorCode: Int32?, elapsed: Duration) {
        self.method = method
        self.landed = landed
        self.axErrorCode = axErrorCode
        self.elapsed = elapsed
    }
}

public enum InsertOutcome: Sendable, Hashable {
    /// Read-back found the text at the caret.
    case landed(InsertionMethod)
    /// The text was sent but the field cannot be read back (e.g. a nil value). Not retried, to avoid a double insert.
    case unverified(InsertionMethod)
    /// Every rung failed. The field is unchanged as far as read-back can tell.
    case failed
    /// The field lost focus or changed identity before the insert ran.
    case fieldGone
}

public struct InsertResult: Sendable, Hashable {
    public var request: InsertRequest
    public var outcome: InsertOutcome
    public var attempts: [InsertAttempt]

    public init(request: InsertRequest, outcome: InsertOutcome, attempts: [InsertAttempt]) {
        self.request = request
        self.outcome = outcome
        self.attempts = attempts
    }
}
