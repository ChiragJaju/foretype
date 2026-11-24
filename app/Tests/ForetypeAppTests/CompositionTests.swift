import Testing

@testable import ForetypeApp

@Suite("App smoke")
@MainActor
struct CompositionTests {
    @Test("The composition root builds a runner that has not started")
    func runnerStartsStopped() {
        let runner = AppComposition.makeRunner(environment: [:])
        #expect(runner.status.isRunning == false)
        #expect(runner.status.engine.kind == .llama)
    }
}
