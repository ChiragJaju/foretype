import Foundation
import ForetypeCore
import ForetypeTestSupport
import Testing

@Suite("Core smoke")
struct SessionSmokeTests {
    @Test("A new session starts idle")
    func newSessionIsIdle() {
        let session = SuggestionSession(configuration: SessionConfiguration(
            ownBundleID: "dev.foretype.app",
            userName: "Alex Rivera",
            engine: EngineDescriptor(kind: .snippetsOnly, modelID: nil, displayName: "Snippets")
        ))
        #expect(session.state == .idle)
    }
}
