import Foundation
@testable import ForetypeMac
import Testing

@AXActor
private func currentThreadName() -> String? {
    Thread.current.name
}

@Suite("Mac smoke")
struct ThreadingTests {
    @Test("AXActor work runs on the dedicated AX run-loop thread, never the main thread")
    func axActorRunsOnItsThread() async {
        let name = await currentThreadName()
        #expect(name == "dev.foretype.ax")
    }

    @Test("RunLoopThread runs blocks in the order they were sent")
    func runLoopThreadKeepsOrder() async {
        let thread = RunLoopThread(name: "dev.foretype.test")
        let order = await withCheckedContinuation { (continuation: CheckedContinuation<[Int], Never>) in
            let box = OrderBox()
            for index in 0..<3 {
                thread.perform {
                    box.values.append(index)
                    if index == 2 { continuation.resume(returning: box.values) }
                }
            }
        }
        #expect(order == [0, 1, 2])
    }
}

/// Touched only from one RunLoopThread.
private final class OrderBox: @unchecked Sendable {
    var values: [Int] = []
}
