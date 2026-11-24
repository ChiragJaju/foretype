// Slice A. The public signatures below are frozen (app/CONTRACTS.md); the bodies are yours.

/// Merges snippet prefix matches with the model's completion. Snippets rank first when the field
/// kind fits them or the typed prefix matches one, by pure prefix match.
public enum Ranker {
    /// Best first. `completion` is the engine's visible continuation, nil while none is ready.
    /// Placeholder: no candidates.
    public static func rank(
        completion: String?, engine: EngineKind, snippets: [Snippet], kind: FieldKind?, typedBeforeCaret: String
    ) -> [Suggestion] {
        []
    }
}
