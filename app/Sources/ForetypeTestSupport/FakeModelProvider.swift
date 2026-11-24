import ForetypeCore
import Synchronization

/// Scripted downloads. Records every consent it was handed; makes no network calls.
public final class FakeModelProvider: ModelProviding {
    private struct State {
        var states: [String: ModelInstallState] = [:]
        var scriptedDownloads: [String: [ModelInstallState]] = [:]
        var consents: [DownloadConsent] = []
        var cancelled: [String] = []
    }

    public let catalog: [ModelSpec]
    private let state = Mutex(State())

    public init(catalog: [ModelSpec]) {
        self.catalog = catalog
    }

    public var consents: [DownloadConsent] { state.withLock { $0.consents } }
    public var cancelled: [String] { state.withLock { $0.cancelled } }

    public func setState(_ installState: ModelInstallState, for modelID: String) {
        state.withLock { $0.states[modelID] = installState }
    }

    /// The states `download` will yield for this model; the last one becomes its state.
    public func scriptDownload(_ modelID: String, states: [ModelInstallState]) {
        state.withLock { $0.scriptedDownloads[modelID] = states }
    }

    public func state(of modelID: String) async -> ModelInstallState {
        state.withLock { $0.states[modelID] ?? .notInstalled }
    }

    public func download(_ modelID: String, consent: DownloadConsent) -> AsyncStream<ModelInstallState> {
        let script = state.withLock { state -> [ModelInstallState] in
            state.consents.append(consent)
            guard consent.modelID == modelID else { return [.failed(.consentMissing)] }
            let script = state.scriptedDownloads[modelID] ?? []
            if let last = script.last { state.states[modelID] = last }
            return script
        }
        return AsyncStream { continuation in
            for installState in script { continuation.yield(installState) }
            continuation.finish()
        }
    }

    public func cancelDownload(_ modelID: String) async {
        state.withLock { $0.cancelled.append(modelID) }
    }

    public func remove(_ modelID: String) async throws(ModelStoreError) {
        state.withLock { $0.states[modelID] = .notInstalled }
    }
}
