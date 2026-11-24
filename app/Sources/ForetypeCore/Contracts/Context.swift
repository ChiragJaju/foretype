// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

/// Hard caps on what is read from the screen. The reader stops at these; `ContextBuilder` enforces
/// them again before anything reaches the prompt.
public struct ContextBudget: Sendable, Hashable {
    /// Nearby window text, total characters across all pieces.
    public var maxNearbyCharacters: Int
    /// AX nodes visited by the nearby-text walk.
    public var maxNodesVisited: Int
    /// Wall time for the nearby-text walk. The spike measured 9-15 ms for 11-100 nodes.
    public var maxWalkDuration: Duration
    public var maxTextBeforeCaretUTF16: Int
    public var maxTextAfterCaretUTF16: Int

    public init(maxNearbyCharacters: Int, maxNodesVisited: Int, maxWalkDuration: Duration, maxTextBeforeCaretUTF16: Int, maxTextAfterCaretUTF16: Int) {
        self.maxNearbyCharacters = maxNearbyCharacters
        self.maxNodesVisited = maxNodesVisited
        self.maxWalkDuration = maxWalkDuration
        self.maxTextBeforeCaretUTF16 = maxTextBeforeCaretUTF16
        self.maxTextAfterCaretUTF16 = maxTextAfterCaretUTF16
    }

    public static let standard = ContextBudget(
        maxNearbyCharacters: 1_500,
        maxNodesVisited: 600,
        maxWalkDuration: .milliseconds(80),
        maxTextBeforeCaretUTF16: 2_000,
        maxTextAfterCaretUTF16: 200
    )
}

/// The focused field's own labels. Read only after policy allows the field.
public struct FieldLabels: Sendable, Hashable {
    public var title: String?
    public var placeholder: String?
    /// `AXDescription` or `AXHelp`.
    public var help: String?
    /// The value or title of `AXTitleUIElement`, the label element linked to the field.
    public var linkedLabel: String?
    /// `AXDOMIdentifier` in web content, e.g. `email` or `shipping-street`.
    public var domIdentifier: String?

    public init(title: String? = nil, placeholder: String? = nil, help: String? = nil, linkedLabel: String? = nil, domIdentifier: String? = nil) {
        self.title = title
        self.placeholder = placeholder
        self.help = help
        self.linkedLabel = linkedLabel
        self.domIdentifier = domIdentifier
    }
}

public enum ContextPieceKind: String, Sendable, Hashable, Codable {
    case heading
    case staticText
    case control
    case otherFieldLabel
}

/// One piece of nearby window text, nearest to the field first.
public struct ContextPiece: Sendable, Hashable {
    public var kind: ContextPieceKind
    public var text: String

    public init(kind: ContextPieceKind, text: String) {
        self.kind = kind
        self.text = text
    }
}

/// Everything read for one allowed field on focus. Held in memory only, for the focused field only,
/// and dropped on blur. Never written to disk or logs.
public struct CapturedContext: Sendable, Hashable {
    public var field: FocusedField
    public var labels: FieldLabels
    public var windowTitle: String?
    /// Nearest first. Secure fields inside the window are skipped by the walk.
    public var nearby: [ContextPiece]
    public var snapshot: FieldSnapshot

    public init(field: FocusedField, labels: FieldLabels, windowTitle: String?, nearby: [ContextPiece], snapshot: FieldSnapshot) {
        self.field = field
        self.labels = labels
        self.windowTitle = windowTitle
        self.nearby = nearby
        self.snapshot = snapshot
    }
}
