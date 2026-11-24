// Slice A. The public signatures below are frozen (docs/guides/contracts.md); the bodies are yours.

/// Infers what a field is for from its role and labels (e.g. "Email", `shipping-street`).
public enum FieldClassifier {
    /// Placeholder: everything is prose.
    public static func classify(_ field: FocusedField, labels: FieldLabels) -> FieldKind {
        .prose
    }
}
