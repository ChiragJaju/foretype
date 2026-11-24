import ForetypeCore
import ForetypeTestSupport
import Testing

@Suite("Test support")
struct ManualClockTests {
    @Test("A sleeper wakes only once its deadline has passed")
    func sleeperWakesAtDeadline() async throws {
        let clock = ManualClock()
        let sleeper = Task { try await clock.sleep(for: .milliseconds(60)) }
        while clock.pendingSleeperCount == 0 { await Task.yield() }

        clock.advance(by: .milliseconds(59))
        #expect(clock.pendingSleeperCount == 1)

        clock.advance(by: .milliseconds(1))
        try await sleeper.value
        #expect(clock.now() == MonotonicInstant(sinceOrigin: .milliseconds(60)))
    }

    @Test("Cancelling a sleeper throws instead of waiting for time to move")
    func cancelledSleeperThrows() async {
        let clock = ManualClock()
        let sleeper = Task { try await clock.sleep(for: .seconds(10)) }
        while clock.pendingSleeperCount == 0 { await Task.yield() }

        sleeper.cancel()
        await #expect(throws: CancellationError.self) { try await sleeper.value }
        #expect(clock.pendingSleeperCount == 0)
    }

    @Test("The fake engine continues the reply that matches the typed prefix")
    func fakeEngineContinuesMatchingReply() async throws {
        let engine = FakeEngine(replies: ["Yes, that works.", "No, sorry, I can't."])
        let field = Fixtures.field()
        try await engine.load()
        try await engine.prepare(PreparedPrompt(fieldID: field.id, text: "prompt", lead: " "))

        let completion = try await engine.complete(CompletionRequest(id: RequestID(rawValue: 1), fieldID: field.id, typed: "N")) { _ in }
        #expect(completion.text == "o, sorry, I can't.")
    }
}
