// Slice C. The public signatures are frozen (docs/guides/contracts.md); the bodies are yours.

import ForetypeCore

/// Runs the request's ladder: `.axSelectedText`, or Unicode key events in chunks of at most 20 UTF-16
/// units (never splitting a Character), then reads the field back about 120 ms later to confirm.
/// Never the clipboard.
/// Placeholder: types nothing.
@AXActor
public final class AXInserter: TextInserting {
    public nonisolated init() {}

    public func insert(_ request: InsertRequest) async -> InsertResult {
        InsertResult(request: request, outcome: .failed, attempts: [])
    }
}
