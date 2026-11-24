// FROZEN CONTRACT. Owned by the orchestrator. See app/CONTRACTS.md before changing anything here.
//
// The suggestion session is a pure reducer: `SuggestionSession.handle(_:now:)` takes one
// `SessionEvent` and returns the `SessionEffect`s to run. It performs no I/O and never awaits, so
// every transition is unit-testable. `SessionRunner` (main actor) feeds it events from the seams
// and executes its effects.
//
//   inactive ⇄ idle → blocked
//               ↓
//            focused ⇄ suggesting → inserting → focused
//               ↑          ↓
//               └──── dismissed
//
// Any state goes to `idle` on blur and to `inactive` when a global deny reason appears.

import Foundation

/// The session's view of the allowed, focused field.
public struct ActiveField: Sendable, Hashable {
    public var field: FocusedField
    /// nil until the context is captured and classified.
    public var kind: FieldKind?
    /// nil until `.contextCaptured`.
    public var context: CapturedContext?
    /// The latest typing truth.
    public var snapshot: FieldSnapshot?
    public var isEnginePrepared: Bool
    /// The newest completion request; results for any other ID are stale and dropped.
    public var pendingRequest: RequestID?

    public init(field: FocusedField, kind: FieldKind? = nil, context: CapturedContext? = nil, snapshot: FieldSnapshot? = nil, isEnginePrepared: Bool = false, pendingRequest: RequestID? = nil) {
        self.field = field
        self.kind = kind
        self.context = context
        self.snapshot = snapshot
        self.isEnginePrepared = isEnginePrepared
        self.pendingRequest = pendingRequest
    }
}

public enum SessionState: Sendable, Hashable {
    /// A global reason stops everything: disabled, paused, no Accessibility, or secure input held.
    case inactive(DenyReason)
    /// Running, but no editable field is focused.
    case idle
    /// A field is focused but policy denied it. Nothing was read; no taps observe keys.
    case blocked(FocusedField, DenyReason)
    /// An allowed field, no suggestion visible.
    case focused(ActiveField)
    /// Ghost text is visible and the consuming tap is on.
    case suggesting(ActiveField, Suggestion)
    /// The user pressed Esc. No suggestion until the next edit changes the text.
    case dismissed(ActiveField)
    /// An accept is being typed into the field.
    case inserting(ActiveField, Suggestion, InsertRequest)
}

public enum SessionEvent: Sendable, Hashable {
    // Lifecycle
    case settingsChanged(ForetypeSettings)
    case permissionsChanged(PermissionState)
    case engineStatusChanged(EngineStatus)
    case snippetsLoaded([Snippet])

    // Focus and text (from FocusMonitoring and ContextReading)
    case focused(FocusedField)
    case blurred
    case contextCaptured(CapturedContext)
    /// The reader returned nil: the element went away before it could be read.
    case contextUnavailable(FieldID)
    case fieldChanged(FieldSnapshot)

    // Keys (from KeyTapping)
    case keystroke(Keystroke)
    case suggestionKey(SuggestionKey)
    case tapInterrupted(TapInterruption)

    // Engine (from the runner's engine tasks)
    case enginePrepared(FieldID)
    case enginePrepareFailed(FieldID, EngineError)
    case completionUpdated(RequestID, text: String)
    case completionFinished(Completion)
    case completionFailed(RequestID, EngineError)

    // Insertion (from TextInserting)
    case insertFinished(InsertResult)
}

public enum SessionEffect: Sendable, Hashable {
    /// Begin (or with nil, stop) reading text for this field. Emitted only after `PolicyDecision.allow`.
    case track(FocusedField?)
    case captureContext(FocusedField)
    case prepareEngine(PreparedPrompt)
    /// Cancel any in-flight completion, wait `debounce`, then run this one.
    case requestCompletion(CompletionRequest, debounce: Duration)
    case cancelCompletion
    case blurEngine
    case showGhost(GhostContent)
    case hideGhost
    case setTapMode(TapMode)
    case replayKey(SuggestionKey)
    case insert(InsertRequest)
    /// Feeds the "Show me what you read" panel: the current field's context, or nil to clear it.
    case publishContext(CapturedContext?)
}

/// Fixed for one run of the session.
public struct SessionConfiguration: Sendable, Hashable {
    /// Foretype's own bundle ID, so its windows are never read.
    public var ownBundleID: String
    /// The name the prompt writes as.
    public var userName: String
    public var budget: ContextBudget
    public var engine: EngineDescriptor

    public init(ownBundleID: String, userName: String, budget: ContextBudget = .standard, engine: EngineDescriptor) {
        self.ownBundleID = ownBundleID
        self.userName = userName
        self.budget = budget
        self.engine = engine
    }
}

/// Everything the runner talks to. Built once by the app's composition root.
@MainActor
public struct SessionDependencies {
    public var focus: any FocusMonitoring
    public var reader: any ContextReading
    public var keys: any KeyTapping
    public var inserter: any TextInserting
    public var ghost: any GhostPresenting
    public var permissions: any PermissionChecking
    public var engine: any Engine
    public var snippets: any SnippetStoring
    public var settings: any SettingsStoring
    public var clock: any MonotonicClock

    public init(
        focus: any FocusMonitoring,
        reader: any ContextReading,
        keys: any KeyTapping,
        inserter: any TextInserting,
        ghost: any GhostPresenting,
        permissions: any PermissionChecking,
        engine: any Engine,
        snippets: any SnippetStoring,
        settings: any SettingsStoring,
        clock: any MonotonicClock
    ) {
        self.focus = focus
        self.reader = reader
        self.keys = keys
        self.inserter = inserter
        self.ghost = ghost
        self.permissions = permissions
        self.engine = engine
        self.snippets = snippets
        self.settings = settings
        self.clock = clock
    }
}

/// What the menu bar and settings show. Published by `SessionRunner.status`.
public struct RunnerStatus: Sendable, Hashable {
    public var isRunning: Bool
    /// Set while a global reason (disabled, paused, no trust, secure input) keeps Foretype silent.
    public var inactiveReason: DenyReason?
    public var engine: EngineDescriptor
    public var engineStatus: EngineStatus
    public var focusedApp: AppIdentity?
    public var fieldDecision: PolicyDecision?
    /// "Show me what you read": the focused field's context only, nil after blur.
    public var inspectedContext: CapturedContext?

    public init(isRunning: Bool, inactiveReason: DenyReason?, engine: EngineDescriptor, engineStatus: EngineStatus, focusedApp: AppIdentity?, fieldDecision: PolicyDecision?, inspectedContext: CapturedContext?) {
        self.isRunning = isRunning
        self.inactiveReason = inactiveReason
        self.engine = engine
        self.engineStatus = engineStatus
        self.focusedApp = focusedApp
        self.fieldDecision = fieldDecision
        self.inspectedContext = inspectedContext
    }

    public static func stopped(engine: EngineDescriptor) -> RunnerStatus {
        RunnerStatus(isRunning: false, inactiveReason: nil, engine: engine, engineStatus: .unloaded, focusedApp: nil, fieldDecision: nil, inspectedContext: nil)
    }
}
