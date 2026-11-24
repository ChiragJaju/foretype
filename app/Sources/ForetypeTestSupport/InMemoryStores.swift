import ForetypeCore
import Synchronization

public actor InMemorySnippetStore: SnippetStoring {
    public private(set) var snippets: [Snippet]
    public private(set) var saveCount = 0
    private var loadError: SnippetStoreError?

    public init(_ snippets: [Snippet] = []) {
        self.snippets = snippets
    }

    public func failLoad(with error: SnippetStoreError?) {
        loadError = error
    }

    public func load() throws(SnippetStoreError) -> [Snippet] {
        if let loadError { throw loadError }
        return snippets
    }

    public func save(_ snippets: [Snippet]) throws(SnippetStoreError) {
        self.snippets = snippets
        saveCount += 1
    }
}

public final class InMemorySettingsStore: SettingsStoring {
    private let settings: Mutex<ForetypeSettings>
    private let stream: AsyncStream<ForetypeSettings>
    private let continuation: AsyncStream<ForetypeSettings>.Continuation

    public init(_ initial: ForetypeSettings = ForetypeSettings()) {
        settings = Mutex(initial)
        (stream, continuation) = AsyncStream.makeStream(of: ForetypeSettings.self)
    }

    public func load() -> ForetypeSettings {
        settings.withLock { $0 }
    }

    public func save(_ newSettings: ForetypeSettings) {
        settings.withLock { $0 = newSettings }
        continuation.yield(newSettings)
    }

    public func updates() -> AsyncStream<ForetypeSettings> {
        stream
    }
}
