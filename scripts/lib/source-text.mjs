// Source text with comments blanked and string literals masked, so brackets match and code lines count without
// parsing. Used by check-budgets (lengths) and check-imports (identifiers outside comments and strings).
const CLOSERS = { '{': '}', '(': ')' }
const STRING_FILL = '_'

/**
 * `text` with comments replaced by spaces and string contents by `_`, newlines and UTF-16 offsets kept. A `'` or
 * `"` string ends at its line's end at the latest; `swift` treats `'` as code and reads `"""` blocks.
 */
export function maskSource(text, { swift = false } = {}) {
  const out = text.split('')
  const fill = (from, to, char) => {
    for (let k = from; k < Math.min(to, out.length); k++) if (out[k] !== '\n') out[k] = char
  }
  const endOf = (needle, from) => {
    const at = text.indexOf(needle, from)
    return at === -1 ? text.length : at + needle.length
  }
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (text.startsWith('//', i) || text.startsWith('/*', i)) {
      const end = text[i + 1] === '/' ? endOf('\n', i) - 1 : endOf('*/', i + 2)
      fill(i, end, ' ')
      i = Math.max(end, i + 1)
    } else if (ch === '"' || ch === '`' || (!swift && ch === "'")) {
      const end = swift && text.startsWith('"""', i) ? endOf('"""', i + 3) : endOfQuoted(text, i)
      fill(i, end, STRING_FILL)
      i = end
    } else i++
  }
  return out.join('')
}

/** The index after the quote that closes the one at `start`. */
function endOfQuoted(text, start) {
  const quote = text[start]
  let j = start + 1
  while (j < text.length && text[j] !== quote && (quote === '`' || text[j] !== '\n')) j += text[j] === '\\' ? 2 : 1
  return text[j] === quote ? j + 1 : j
}

/** The index of the bracket closing the `{` or `(` at `open` in masked text, or -1. */
export function matchingBracket(masked, open) {
  const opener = masked[open]
  const closer = CLOSERS[opener]
  let depth = 0
  for (let i = open; i < masked.length; i++) {
    if (masked[i] === opener) depth++
    else if (masked[i] === closer && --depth === 0) return i
  }
  return -1
}

/** The 1-based line holding offset `index`. */
export const lineAt = (text, index) => text.slice(0, index).split('\n').length

/** Lines from `first` to `last` (1-based, inclusive) that hold code once comments are blanked. */
export function countCodeLines(maskedLines, first, last) {
  return maskedLines.slice(first - 1, last).filter((line) => line.trim() !== '').length
}
