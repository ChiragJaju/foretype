import AppKit
import WebKit

/// One window with a field of every kind the end-to-end matrix covers. Every field has an
/// accessibility identifier, so UI tests can focus it and read its value back.
@main
@MainActor
final class TestHostApp: NSObject, NSApplicationDelegate {
    private var window: NSWindow?

    static func main() {
        let app = NSApplication.shared
        let delegate = TestHostApp()
        app.delegate = delegate
        app.setActivationPolicy(.regular)
        app.run()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let window = NSWindow(
            contentRect: NSRect(x: 200, y: 200, width: 720, height: 760),
            styleMask: [.titled, .closable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Foretype TestHost"
        window.contentView = Self.makeContent()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate()
        self.window = window
    }

    private static func makeContent() -> NSView {
        let stack = NSStackView(views: [
            label("Can you make the 4pm sync tomorrow?"),
            textField(identifier: "singleLine", placeholder: "Reply"),
            label("Message"),
            textView(identifier: "multiLine"),
            label("Password"),
            secureField(identifier: "secure"),
            webView(),
        ])
        stack.orientation = .vertical
        stack.alignment = .leading
        stack.spacing = 8
        stack.edgeInsets = NSEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        return stack
    }

    private static func label(_ text: String) -> NSTextField {
        NSTextField(labelWithString: text)
    }

    private static func textField(identifier: String, placeholder: String) -> NSTextField {
        let field = NSTextField()
        field.placeholderString = placeholder
        field.setAccessibilityIdentifier(identifier)
        field.widthAnchor.constraint(equalToConstant: 520).isActive = true
        return field
    }

    private static func secureField(identifier: String) -> NSSecureTextField {
        let field = NSSecureTextField()
        field.setAccessibilityIdentifier(identifier)
        field.widthAnchor.constraint(equalToConstant: 520).isActive = true
        return field
    }

    private static func textView(identifier: String) -> NSScrollView {
        let scroll = NSTextView.scrollableTextView()
        if let textView = scroll.documentView as? NSTextView {
            textView.setAccessibilityIdentifier(identifier)
            textView.isRichText = false
        }
        scroll.widthAnchor.constraint(equalToConstant: 520).isActive = true
        scroll.heightAnchor.constraint(equalToConstant: 90).isActive = true
        return scroll
    }

    private static func webView() -> WKWebView {
        let webView = WKWebView()
        webView.setAccessibilityIdentifier("web")
        webView.loadHTMLString(webFormHTML, baseURL: nil)
        webView.widthAnchor.constraint(equalToConstant: 680).isActive = true
        webView.heightAnchor.constraint(equalToConstant: 360).isActive = true
        return webView
    }

    private static let webFormHTML = """
    <!doctype html>
    <html><body style="font: 13px -apple-system">
    <h3>Dinner on Thursday at 8?</h3>
    <label>Reply <textarea id="web-textarea" rows="2" cols="60"></textarea></label>
    <p>Comment</p><div id="web-contenteditable" contenteditable="true" style="border:1px solid #999;min-height:2em"></div>
    <h3>Shipping address</h3>
    <label>Full name <input id="name" autocomplete="name"></label><br>
    <label>Email <input id="email" type="email" autocomplete="email"></label><br>
    <label>Street <input id="street" autocomplete="address-line1"></label><br>
    <label>City <input id="city" autocomplete="address-level2"></label><br>
    <label>Postal code <input id="postal" autocomplete="postal-code"></label><br>
    <label>Password <input id="web-password" type="password"></label>
    </body></html>
    """
}
