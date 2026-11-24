// Reads the rule sources, the declarations of what enforces each rule, and the review notes
// (docs/guides/guidelines.md). Shared by generate-guidelines.mjs and check-guidelines.mjs.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const GENERATED_FILES = ['docs/guidelines/enforcement.md', 'docs/guidelines/rules-index.md']
export const INTRO_FILE = 'docs/guidelines/enforcement.intro.md'
export const NOTES_FILE = 'docs/guidelines/enforcement-notes.json'
export const TOOLS_FILE = 'docs/guidelines/tool-enforcement.json'

// `CODE-4`, or a module-scoped `MOD-core-1`.
export const ID_PATTERN = '[A-Z]+(?:-[a-z][a-z0-9]*)?-\\d+'
const DEFINITION = new RegExp(`^\\*\\*(${ID_PATTERN})\\.\\s`)
const FENCE = /^\s*(?:```|~~~)/

/** Tracked and untracked (not ignored) files matching the git pathspecs that exist on disk, sorted. */
export function listFiles(root, pathspecs) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...pathspecs], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  })
  const files = new Set(out.split('\n').filter(Boolean))
  return [...files].filter((file) => existsSync(path.join(root, file))).sort()
}

/** The files that may define rules: every guideline, then every AGENTS.md. */
export function listSources(root) {
  const generated = new Set([...GENERATED_FILES, INTRO_FILE])
  const guidelines = listFiles(root, ['docs/guidelines/*.md']).filter((file) => !generated.has(file))
  const agents = listFiles(root, ['*AGENTS.md']).filter((file) => path.posix.basename(file) === 'AGENTS.md')
  return [...guidelines, ...agents]
}

/** Lines outside code fences, each with its 1-based number. */
export function proseLines(text) {
  const lines = []
  let fenced = false
  text.split('\n').forEach((line, index) => {
    if (FENCE.test(line)) fenced = !fenced
    else if (!fenced) lines.push({ text: line, number: index + 1 })
  })
  return lines
}

/** Rule definitions in one file: `{ id, line, paragraph }`, where paragraph runs to the next blank line. */
export function parseDefinitions(text) {
  const lines = proseLines(text)
  return lines.flatMap(({ text: line, number }, index) => {
    const match = DEFINITION.exec(line)
    if (!match) return []
    const paragraph = [line]
    for (let next = index + 1; next < lines.length && lines[next].number === number + paragraph.length; next++) {
      if (lines[next].text.trim() === '') break
      paragraph.push(lines[next].text)
    }
    return [{ id: match[1], line: number, paragraph: paragraph.join(' ') }]
  })
}

/** The first `# ` heading. */
export function readTitle(text) {
  return /^# (.+)$/m.exec(text)?.[1].trim() ?? ''
}

/** Every rule source with its text, title and definitions. */
export function readSources(root) {
  return listSources(root).map((file) => {
    const text = readFileSync(path.join(root, file), 'utf8')
    return { file, text, title: readTitle(text), definitions: parseDefinitions(text) }
  })
}

/** The 1-based line of the first `"needle"` in a JSON text, or 1. */
export function lineOfString(text, needle) {
  const at = text.indexOf(`"${needle}"`)
  return at < 0 ? 1 : text.slice(0, at).split('\n').length
}

/**
 * What enforces which rule: each `scripts/check-<name>.rules.json` (a JSON array of ids) and each tool
 * rule in tool-enforcement.json. One `{ id, check, file, line }` per declared id.
 */
export function readDeclarations(root) {
  const fromChecks = listFiles(root, ['scripts/check-*.rules.json']).flatMap((file) => {
    const text = readFileSync(path.join(root, file), 'utf8')
    const check = path.posix.basename(file, '.rules.json')
    return JSON.parse(text).map((id) => ({ id, check: `\`${check}\``, file, line: lineOfString(text, id) }))
  })
  return [...fromChecks, ...readToolDeclarations(root)]
}

function readToolDeclarations(root) {
  const text = readFileSync(path.join(root, TOOLS_FILE), 'utf8')
  return Object.entries(readTools(root)).flatMap(([tool, { rules }]) =>
    Object.entries(rules).flatMap(([rule, ids]) =>
      ids.map((id) => ({ id, check: `${tool} \`${rule}\``, file: TOOLS_FILE, line: lineOfString(text, id) })),
    ),
  )
}

/** tool-enforcement.json without its comment: `{ <tool>: { runsIn, rules: { <tool rule>: [ids] } } }`. */
export function readTools(root) {
  const tools = JSON.parse(readFileSync(path.join(root, TOOLS_FILE), 'utf8'))
  delete tools.$comment
  return tools
}

/** enforcement-notes.json as a Map of id → `{ note, line }`. */
export function readNotes(root) {
  const text = readFileSync(path.join(root, NOTES_FILE), 'utf8')
  const { notes } = JSON.parse(text)
  return new Map(Object.entries(notes).map(([id, note]) => [id, { note, line: lineOfString(text, id) }]))
}
