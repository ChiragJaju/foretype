import XCTest

/// Launches Foretype with the deterministic stub engine, and the TestHost app. End-to-end cases
/// (P3) subclass this. The test runner must hold Accessibility, so these run locally only.
class E2EHarness: XCTestCase {
    static let foretypeBundleID = "dev.foretype.app"
    static let testHostBundleID = "dev.foretype.testhost"

    @MainActor
    func launchForetype() -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: Self.foretypeBundleID)
        app.launchEnvironment["FORETYPE_ENGINE"] = "stub"
        app.launch()
        return app
    }

    @MainActor
    func launchTestHost() -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: Self.testHostBundleID)
        app.launch()
        return app
    }
}
