// Slice B. This file holds the only network call in Foretype (the privacy gate enforces it).
// The public signatures are frozen.

import ForetypeCore
import Foundation

/// Downloads pinned models after consent into `directory`, resuming partial files, and verifies
/// size and SHA-256 before moving them into place.
/// Placeholder: nothing is installed and nothing is downloaded.
public actor ModelStore: ModelProviding {
    public nonisolated let catalog: [ModelSpec]
    private let directory: URL

    public init(directory: URL, catalog: [ModelSpec] = ModelCatalog.all) {
        self.directory = directory
        self.catalog = catalog
    }

    /// `~/Library/Application Support/Foretype/Models`.
    public static func defaultDirectory() -> URL {
        URL.applicationSupportDirectory.appending(components: "Foretype", "Models", directoryHint: .isDirectory)
    }

    public func state(of modelID: String) -> ModelInstallState {
        .notInstalled
    }

    public nonisolated func download(_ modelID: String, consent: DownloadConsent) -> AsyncStream<ModelInstallState> {
        AsyncStream { $0.finish() }
    }

    public func cancelDownload(_ modelID: String) {}

    public func remove(_ modelID: String) throws(ModelStoreError) {}
}
