// Slice D.

import AppKit
import SwiftUI

/// Menu-bar only (LSUIElement in the bundle; `.accessory` when run unbundled from `swift run`).
@main
struct ForetypeApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        MenuBarExtra {
            MenuBarContent()
        } label: {
            Text("Ft")
        }
        Settings {
            SettingsView()
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
    }
}
