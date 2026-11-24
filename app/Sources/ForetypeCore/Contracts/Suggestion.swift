// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.

import Foundation

public enum SuggestionLimits {
    /// The engine never drafts more than this many tokens. Also bounds what an insert can type.
    public static let maxTokens = 24
    /// Wait after a mismatching keystroke before asking the engine again.
    public static let requeryDebounce: Duration = .milliseconds(60)
}

/// Where a suggestion came from. The menu bar and the ghost hint show it.
public enum SuggestionSource: Sendable, Hashable {
    case model(EngineKind)
    case snippet(SnippetID, label: String)
}

/// Ghost text to insert at the caret. `text` is only the part not yet typed.
public struct Suggestion: Sendable, Hashable {
    public var text: String
    public var source: SuggestionSource
    /// The text before the caret that `text` continues. Prefix-trim compares new typing against it.
    public var typedPrefix: String

    public init(text: String, source: SuggestionSource, typedPrefix: String) {
        self.text = text
        self.source = source
        self.typedPrefix = typedPrefix
    }
}

public struct SnippetID: Sendable, Hashable, Codable {
    public var rawValue: UUID

    public init(rawValue: UUID = UUID()) {
        self.rawValue = rawValue
    }
}

public enum SnippetKind: String, Sendable, Hashable, Codable, CaseIterable {
    case address
    case email
    case phone
    case name
    case url
    case signOff
    case other
}

/// Saved text the user owns, such as an address labelled Home or Office. Encrypted at rest.
public struct Snippet: Sendable, Hashable, Codable, Identifiable {
    public var id: SnippetID
    /// What the user calls it, e.g. "Home". Typing its first letter can switch to it.
    public var label: String
    public var kind: SnippetKind
    /// The full value, inserted when no part fits the field.
    public var text: String
    /// Optional split values, e.g. `.streetAddress` and `.postalCode` for an address, so a street
    /// field gets only the street.
    public var parts: [FieldKind: String]

    public init(
        id: SnippetID = SnippetID(), label: String, kind: SnippetKind, text: String, parts: [FieldKind: String] = [:]
    ) {
        self.id = id
        self.label = label
        self.kind = kind
        self.text = text
        self.parts = parts
    }
}
