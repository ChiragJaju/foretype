// Slice D. The composition root: the only place concrete adapters are constructed and wired.

import ForetypeCore
import ForetypeEngine
import ForetypeMac
import Foundation

@MainActor
enum AppComposition {
    static let bundleIdentifier = "dev.foretype.app"

    /// Debug builds honour `FORETYPE_ENGINE=stub` for deterministic end-to-end tests.
    static func makeRunner(environment: [String: String] = ProcessInfo.processInfo.environment) -> SessionRunner {
        let engine = makeEngine(environment: environment)
        let dependencies = SessionDependencies(
            focus: FocusMonitor(),
            reader: AXContextReader(),
            keys: KeyTap(),
            inserter: AXInserter(),
            ghost: GhostPanel(),
            permissions: SystemPermissions(),
            engine: engine,
            snippets: EncryptedSnippetStore(
                fileURL: URL.applicationSupportDirectory.appending(components: "Foretype", "snippets.sealed"),
                keychainService: "\(bundleIdentifier).snippets"
            ),
            settings: UserDefaultsSettingsStore(),
            clock: SystemClock()
        )
        let configuration = SessionConfiguration(
            ownBundleID: bundleIdentifier,
            userName: NSFullUserName(),
            engine: engine.descriptor
        )
        return SessionRunner(dependencies: dependencies, configuration: configuration)
    }

    private static func makeEngine(environment: [String: String]) -> any Engine {
        #if DEBUG
        if environment["FORETYPE_ENGINE"] == "stub" {
            return StubEngine(replies: [])
        }
        #endif
        return LlamaEngine(model: ModelCatalog.qwen25Instruct1_5B, modelFileURL: nil)
    }
}
