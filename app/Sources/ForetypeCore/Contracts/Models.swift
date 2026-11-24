// FROZEN CONTRACT. Owned by the orchestrator. See docs/guides/contracts.md before changing anything here.

import Foundation

/// A model file pinned by Hugging Face revision, byte size and SHA-256.
public struct ModelSpec: Sendable, Hashable, Codable, Identifiable {
    public var id: String
    public var displayName: String
    public var downloadURL: URL
    public var repository: String
    public var revision: String
    public var fileName: String
    public var byteCount: Int64
    /// Lowercase hex.
    public var sha256: String
    public var license: String

    public init(
        id: String, displayName: String, downloadURL: URL, repository: String, revision: String, fileName: String,
        byteCount: Int64, sha256: String, license: String
    ) {
        self.id = id
        self.displayName = displayName
        self.downloadURL = downloadURL
        self.repository = repository
        self.revision = revision
        self.fileName = fileName
        self.byteCount = byteCount
        self.sha256 = sha256
        self.license = license
    }
}

public enum ModelStoreError: Error, Sendable, Hashable {
    case consentMissing
    case network(String)
    case checksumMismatch(expected: String, actual: String)
    case sizeMismatch(expected: Int64, actual: Int64)
    case fileSystem(String)
    case cancelled
    case unknownModel(String)
}

public enum ModelInstallState: Sendable, Hashable {
    case notInstalled
    case downloading(receivedBytes: Int64, totalBytes: Int64)
    case verifying
    case installed(URL)
    case failed(ModelStoreError)
}

/// Proof that the user pressed the download button for this exact model. Only onboarding and
/// settings create one; `ModelProviding.download` refuses to touch the network without it.
public struct DownloadConsent: Sendable, Hashable {
    public var modelID: String
    public var grantedAt: Date

    public init(modelID: String, grantedAt: Date) {
        self.modelID = modelID
        self.grantedAt = grantedAt
    }
}

/// The model download and on-disk store. Its implementation holds the only network call in Foretype.
public protocol ModelProviding: Sendable {
    var catalog: [ModelSpec] { get }
    func state(of modelID: String) async -> ModelInstallState
    /// Downloads with resume (Hugging Face drops long HTTP/2 transfers), checks size and SHA-256, then
    /// moves the file into place. The stream ends after `.installed` or `.failed`.
    func download(_ modelID: String, consent: DownloadConsent) -> AsyncStream<ModelInstallState>
    func cancelDownload(_ modelID: String) async
    func remove(_ modelID: String) async throws(ModelStoreError)
}
