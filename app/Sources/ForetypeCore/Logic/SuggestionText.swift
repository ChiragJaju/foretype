// Slice A. The public signatures below are frozen (app/CONTRACTS.md); the bodies are yours.

/// Prefix-trim and word-accept, the keystroke path that needs no model call.
public enum SuggestionText {
    /// The suggestion left after the user typed more, or nil when the new text diverges from it.
    /// `typedBeforeCaret` is the reply text before the caret from the latest snapshot.
    /// Placeholder: always diverges.
    public static func trimmed(_ suggestion: Suggestion, typedBeforeCaret: String) -> Suggestion? {
        nil
    }

    /// The leading part Option-Right inserts: the next word plus its trailing space or punctuation.
    /// Placeholder: nothing.
    public static func nextWord(of text: String) -> String {
        ""
    }
}
