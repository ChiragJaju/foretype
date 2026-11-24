// FROZEN CONTRACT. Owned by the orchestrator. See docs/guides/contracts.md before changing anything here.
//
// Threads in Foretype:
//   main actor        SessionRunner, GhostPanel, SwiftUI
//   AXActor           every AX call, the AXObserver and the 150 ms poll (thread "dev.foretype.ax")
//   key-tap thread    both CGEvent taps; callbacks never await (thread "dev.foretype.keytap")
//   engine executor   LlamaEngine's serial queue ("dev.foretype.engine")
// AX observers and event taps deliver callbacks on the run loop they were added to, so the AX actor
// and the key taps each get a `RunLoopThread`.

import Foundation

/// A thread that services its own run loop for the life of the process.
public final class RunLoopThread: Sendable {
    public let name: String
    /// CFRunLoop's perform-block, wake-up and add-source calls are thread-safe.
    nonisolated(unsafe) public let runLoop: CFRunLoop

    public init(name: String, qualityOfService: QualityOfService = .userInteractive) {
        let started = RunLoopHandoff()
        let thread = Thread {
            started.runLoop = CFRunLoopGetCurrent()
            // A run loop with no sources returns at once; this port keeps it alive.
            RunLoop.current.add(NSMachPort(), forMode: .default)
            started.ready.signal()
            CFRunLoopRun()
        }
        thread.name = name
        thread.qualityOfService = qualityOfService
        thread.start()
        started.ready.wait()
        guard let runLoop = started.runLoop else {
            preconditionFailure("RunLoopThread \(name) did not publish its run loop")
        }
        self.name = name
        self.runLoop = runLoop
    }

    /// Runs `block` on this thread, in order with run-loop sources (AX callbacks, tap callbacks).
    public func perform(_ block: @escaping @Sendable () -> Void) {
        CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue, block)
        CFRunLoopWakeUp(runLoop)
    }

    public var isCurrent: Bool {
        CFRunLoopGetCurrent() === runLoop
    }
}

/// Written once on the new thread before `ready` is signalled, read once after.
private final class RunLoopHandoff: @unchecked Sendable {
    var runLoop: CFRunLoop?
    let ready = DispatchSemaphore(value: 0)
}

/// Runs actor jobs as run-loop blocks on one `RunLoopThread`.
public final class RunLoopExecutor: SerialExecutor {
    public let thread: RunLoopThread

    public init(thread: RunLoopThread) {
        self.thread = thread
    }

    public func enqueue(_ job: consuming ExecutorJob) {
        let job = UnownedJob(job)
        let executor = asUnownedSerialExecutor()
        thread.perform { job.runSynchronously(on: executor) }
    }

    public func asUnownedSerialExecutor() -> UnownedSerialExecutor {
        UnownedSerialExecutor(ordinary: self)
    }

    /// Lets AX observer callbacks, which arrive on this thread, enter the actor with `assumeIsolated`.
    public func checkIsolated() {
        precondition(thread.isCurrent, "expected to run on \(thread.name)")
    }
}

/// Owns every Accessibility call. AX calls block on the target app, so they never run on the main
/// actor; set `AXUIElementSetMessagingTimeout` to 0.25 s so a hung app stalls this actor, not typing.
@globalActor
public actor AXActor {
    public static let shared = AXActor()
    public static let thread = RunLoopThread(name: "dev.foretype.ax")
    private static let executor = RunLoopExecutor(thread: thread)

    public nonisolated var unownedExecutor: UnownedSerialExecutor {
        Self.executor.asUnownedSerialExecutor()
    }
}
