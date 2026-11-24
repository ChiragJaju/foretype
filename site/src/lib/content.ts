// Long-form copy kept out of the components.
export const QUESTIONS = [
  {
    q: 'How does it see what is on my screen?',
    a: 'Through the macOS Accessibility API, the same one screen readers use. It reads the text of the focused field and the window around it. Screen capture is only a fallback for apps that draw text on a canvas, and you can leave it off.',
  },
  {
    q: 'Does anything leave my Mac?',
    a: 'Not in local mode: no prompts, no analytics, no crash reports. The core is open source so you can check, and a network monitor will show zero connections. If you turn on the optional cloud model for an app, that app’s context goes to the provider you pick.',
  },
  {
    q: 'Which Macs will it run on?',
    a: 'Apple Silicon (M1 or later). The model is small enough to answer in about a tenth of a second; 16 GB of memory gives the smoothest feel.',
  },
  {
    q: 'Will it read my passwords or bank pages?',
    a: 'No. Secure text fields are invisible to it by design, and banking apps, password managers and authenticator apps are blocked out of the box. You can block any other app in one click.',
  },
  {
    q: 'How is this different from autocomplete I already have?',
    a: 'Built-in prediction looks at the words you have typed. Foretype also looks at what you are answering, so its first guess is the reply, not the next word, and your stored details (addresses, links, sign-offs) come back as you type.',
  },
  {
    q: 'What about iPhone?',
    a: 'iOS does not let any app sit above the system keyboard, so the only route is a keyboard of our own. We are building it for Android first, where a keyboard can run its own model on the device; iPhone follows.',
  },
]
