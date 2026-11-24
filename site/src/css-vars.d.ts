import 'react'

// Lets components set CSS custom properties (e.g. --marker) through the style prop.
declare module 'react' {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined
  }
}
