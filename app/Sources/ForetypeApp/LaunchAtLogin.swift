// Slice D.

import ServiceManagement

/// Launch at login through `SMAppService.mainApp`, which needs the signed bundle in /Applications.
enum LaunchAtLogin {
    static var isEnabled: Bool {
        SMAppService.mainApp.status == .enabled
    }
}
