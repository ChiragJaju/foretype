// Slice A. The public signatures below are frozen (app/CONTRACTS.md); the bodies are yours.

/// The base-style continuation prompt the P0 spike chose: few-shot "Screen ... My reply:" blocks,
/// no chat template. Few-shot examples are fixed so their KV prefix is shared across fields.
public enum PromptTemplate {
    /// The text between the prepared prompt and the typed reply.
    public static let lead = " "

    /// Placeholder: an empty prompt, which the engine treats as nothing to prepare.
    public static func prepare(_ context: CapturedContext, kind: FieldKind, userName: String, budget: ContextBudget) -> PreparedPrompt {
        PreparedPrompt(fieldID: context.field.id, text: "", lead: lead)
    }
}
