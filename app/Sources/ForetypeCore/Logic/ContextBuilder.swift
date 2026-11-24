// Slice A. The public signatures below are frozen (docs/guides/contracts.md); the bodies are yours.

/// Turns captured screen text into bounded prompt input.
public enum ContextBuilder {
    /// The nearby text for the prompt, at most `budget.maxNearbyCharacters`, nearest first.
    /// Placeholder: empty.
    public static func screenText(from context: CapturedContext, budget: ContextBudget) -> String {
        ""
    }

    /// The reply the user is typing: the text before the caret, cut to the current paragraph and capped.
    /// Placeholder: empty.
    public static func typedReply(from snapshot: FieldSnapshot) -> String {
        ""
    }
}
