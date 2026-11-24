import ForetypeCore

/// Small builders for the value types, so tests state only what matters to them.
public enum Fixtures {
    public static let textEdit = AppIdentity(bundleID: "com.apple.TextEdit", name: "TextEdit", pid: 4_242)

    public static func field(
        id: UInt64 = 1,
        app: AppIdentity = textEdit,
        role: FieldRole = .textArea,
        isSecure: Bool = false,
        host: TextHost = .appKit,
        frame: AXRect? = AXRect(x: 100, y: 100, width: 400, height: 200)
    ) -> FocusedField {
        FocusedField(id: FieldID(rawValue: id, pid: app.pid), app: app, role: role, isSecure: isSecure, isEditable: true, host: host, frame: frame)
    }

    /// A snapshot with the caret at the end of `textBeforeCaret` and an exact caret rect.
    public static func snapshot(of field: FocusedField, textBeforeCaret: String, textAfterCaret: String = "") -> FieldSnapshot {
        let caretLocation = textBeforeCaret.utf16.count
        return FieldSnapshot(
            fieldID: field.id,
            textBeforeCaret: textBeforeCaret,
            textAfterCaret: textAfterCaret,
            selection: TextRange(location: caretLocation, length: 0),
            valueLengthUTF16: caretLocation + textAfterCaret.utf16.count,
            caret: .exact(AXRect(x: 120, y: 110, width: 0, height: 16), .rangeBounds)
        )
    }

    public static func context(
        of field: FocusedField,
        nearby: [String] = [],
        labels: FieldLabels = FieldLabels(),
        windowTitle: String? = nil,
        textBeforeCaret: String = ""
    ) -> CapturedContext {
        CapturedContext(
            field: field,
            labels: labels,
            windowTitle: windowTitle,
            nearby: nearby.map { ContextPiece(kind: .staticText, text: $0) },
            snapshot: snapshot(of: field, textBeforeCaret: textBeforeCaret)
        )
    }
}
