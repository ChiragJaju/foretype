// Slice A. The public signatures below are frozen (docs/guides/contracts.md); the bodies are yours.

import Foundation

/// Snippets in one AES-GCM sealed file; the 256-bit key lives in the Keychain under `keychainService`.
/// Placeholder: holds nothing and writes nothing.
public actor EncryptedSnippetStore: SnippetStoring {
    private let fileURL: URL
    private let keychainService: String

    public init(fileURL: URL, keychainService: String) {
        self.fileURL = fileURL
        self.keychainService = keychainService
    }

    public func load() async throws(SnippetStoreError) -> [Snippet] {
        []
    }

    public func save(_ snippets: [Snippet]) async throws(SnippetStoreError) {}
}
