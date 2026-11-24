// Slice D. On/off, pause for one hour, the active engine, Settings, Quit.

import AppKit
import SwiftUI

struct MenuBarContent: View {
    var body: some View {
        Button("Quit Foretype") {
            NSApp.terminate(nil)
        }
        .keyboardShortcut("q")
    }
}
