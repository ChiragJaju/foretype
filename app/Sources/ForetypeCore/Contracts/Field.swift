// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

/// A rectangle in Accessibility coordinates: global, top-left origin, measured from the top-left
/// of the menu-bar screen (`NSScreen.screens[0]`), in points. AppKit converts it with
/// `y = screens[0].frame.height - (rect.y + rect.height)`; only ForetypeMac does that conversion.
public struct AXRect: Sendable, Hashable, Codable {
    public var x: Double
    public var y: Double
    public var width: Double
    public var height: Double

    public init(x: Double, y: Double, width: Double, height: Double) {
        self.x = x
        self.y = y
        self.width = width
        self.height = height
    }
}

/// A range in UTF-16 code units, the unit AX uses for `kAXSelectedTextRangeAttribute`.
public struct TextRange: Sendable, Hashable, Codable {
    public var location: Int
    public var length: Int

    public init(location: Int, length: Int) {
        self.location = location
        self.length = length
    }

    /// The caret sits at the end of any selection.
    public var end: Int { location + length }
}

/// The process that owns the focused field.
public struct AppIdentity: Sendable, Hashable, Codable {
    /// nil for processes without a bundle (command-line tools).
    public var bundleID: String?
    public var name: String?
    public var pid: Int32

    public init(bundleID: String?, name: String?, pid: Int32) {
        self.bundleID = bundleID
        self.name = name
        self.pid = pid
    }
}

/// Opaque handle for one focused AX element. ForetypeMac keeps the only map from a `FieldID` to its
/// `AXUIElement`; every other module treats it as a token. A refocus of the same element gets a
/// new `FieldID`, so stale async results can be dropped by comparing IDs.
public struct FieldID: Sendable, Hashable, Codable {
    public var rawValue: UInt64
    public var pid: Int32

    public init(rawValue: UInt64, pid: Int32) {
        self.rawValue = rawValue
        self.pid = pid
    }
}

/// The AX role of the focused element.
public enum FieldRole: String, Sendable, Hashable, Codable {
    case textField
    case textArea
    case searchField
    case comboBox
    case secureTextField
    case other
}

/// The text engine behind the field. It picks the insertion ladder: AppKit takes the AX selected-text
/// write; WebKit and Chromium report success for that write and do nothing, so they go to Unicode events.
public enum TextHost: String, Sendable, Hashable, Codable {
    case appKit
    case webKit
    case chromium
    case electron
    case unknown
}

/// What the field is for, inferred from its labels by Core after the context is captured.
public enum FieldKind: String, Sendable, Hashable, Codable, CaseIterable, CodingKeyRepresentable {
    /// A message, comment or reply: the model answers the on-screen question.
    case prose
    /// A form value Core could not classify further.
    case formValue
    case email
    case personName
    case phone
    case streetAddress
    case city
    case region
    case postalCode
    case country
    case url
    case search
}

/// The focused field as reported on focus, before policy runs. By construction it holds no text
/// from the field or the window: only identity, role, flags and geometry. Text is read only after
/// `PolicyDecision.allow`.
public struct FocusedField: Sendable, Hashable {
    public var id: FieldID
    public var app: AppIdentity
    public var role: FieldRole
    /// True for `AXSecureTextField` as role or subrole. Policy denies these before any read.
    public var isSecure: Bool
    public var isEditable: Bool
    public var host: TextHost
    public var frame: AXRect?

    public init(id: FieldID, app: AppIdentity, role: FieldRole, isSecure: Bool, isEditable: Bool, host: TextHost, frame: AXRect?) {
        self.id = id
        self.app = app
        self.role = role
        self.isSecure = isSecure
        self.isEditable = isEditable
        self.host = host
        self.frame = frame
    }
}

/// Where the caret is on screen, and how much to trust it. Rects are zero-width at the caret x,
/// one line tall. Each candidate is checked to lie inside the field frame; tiny or zero rects are rejected.
public enum CaretGeometry: Sendable, Hashable {
    /// Read directly: `AXBoundsForRange(loc, 0)` agreeing with the previous character's line, or a text marker.
    case exact(AXRect, CaretSource)
    /// Computed from a neighbouring character's bounds.
    case derived(AXRect, CaretSource)
    /// Only the field frame is known. The presenter shows the inline card attached to the field.
    case estimated(fieldFrame: AXRect)
    /// Nothing usable. The presenter shows nothing.
    case none
}

/// The rung of the caret ladder that produced a position.
public enum CaretSource: String, Sendable, Hashable, Codable {
    case rangeBounds
    case textMarker
    case previousCharacter
    case nextCharacter
}

/// The field's text and caret, read back from AX after every change ("typing truth").
/// Never rebuilt from keystrokes, so it stays correct with input methods, dead keys and autocorrect.
public struct FieldSnapshot: Sendable, Hashable {
    public var fieldID: FieldID
    /// Up to `ContextBudget.maxTextBeforeCaretUTF16` units ending at the caret.
    public var textBeforeCaret: String
    /// Up to `ContextBudget.maxTextAfterCaretUTF16` units starting at the selection end.
    public var textAfterCaret: String
    /// The selection in the full field value.
    public var selection: TextRange
    public var valueLengthUTF16: Int
    public var caret: CaretGeometry

    public init(fieldID: FieldID, textBeforeCaret: String, textAfterCaret: String, selection: TextRange, valueLengthUTF16: Int, caret: CaretGeometry) {
        self.fieldID = fieldID
        self.textBeforeCaret = textBeforeCaret
        self.textAfterCaret = textAfterCaret
        self.selection = selection
        self.valueLengthUTF16 = valueLengthUTF16
        self.caret = caret
    }
}
