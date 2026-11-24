@testable import ForetypeEngine
import Testing

@Suite("Engine smoke")
struct EngineSmokeTests {
    @Test("llama.framework links and loads from the test bundle")
    func llamaLoads() {
        #expect(LlamaEngine.backendSupportsMemoryMapping())
    }

    @Test("Every catalog model is pinned by a full SHA-256 and a size")
    func catalogIsPinned() {
        for model in ModelCatalog.all {
            #expect(model.sha256.count == 64)
            #expect(model.byteCount > 0)
            #expect(model.downloadURL.absoluteString.contains(model.revision))
        }
    }
}
