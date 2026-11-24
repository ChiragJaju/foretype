#!/usr/bin/env node
// Checks the rule system (docs/guides/guidelines.md): rule ids and their form, what enforces each rule,
// the CLAUDE.md beside every AGENTS.md, the skill mirrors, the docs allowlist, and the generated indexes.
// Prints `path:line: RULE-ID message` per problem and exits 1 when there is any.
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { findStaleFiles } from './generate-guidelines.mjs'
import { ID_PATTERN, listFiles, NOTES_FILE, proseLines, readDeclarations, readNotes, readSources } from './lib/guidelines.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POINTER = '@AGENTS.md'
const MAX_RULE_WORDS = 60
const MAX_SKILL_LINES = 200
const SKILLS_DIR = '.agents/skills'
const SKILL_MIRRORS_DIR = '.claude/skills'

// Each shared prefix and the one guideline file that defines it.
const FAMILIES = {
  CODE: 'code.md',
  SWIFT: 'swift.md',
  CONC: 'concurrency.md',
  PRIV: 'privacy.md',
  MOD: 'modules.md',
  OBS: 'observability.md',
  TEST: 'testing.md',
  SEC: 'security.md',
  UI: 'ui.md',
  SITE: 'site.md',
  AGENTS: 'agents.md',
  DOC: 'docs.md',
}

// DOC-1: the closed list of what docs/ may hold, history docs included, and the root's Markdown files.
const DOCS_ALLOWED = [
  /^docs\/guidelines\/[^/]+\.(?:md|json)$/,
  /^docs\/guides\/[^/]+\.md$/,
  /^docs\/assets\//,
  /^docs\/architecture\.md$/,
  /^docs\/(?:DEVLOG|PLAN|RESEARCH)\.md$/,
]
const ROOT_MARKDOWN = ['README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md', 'AGENTS.md', 'CLAUDE.md']
// AGENTS-11: Markdown outside docs/ and the root lives only in these homes.
const MARKDOWN_HOMES = [/(?:^|\/)(?:AGENTS|CLAUDE)\.md$/, /^\.agents\/skills\//, /^\.claude\/rules\/[^/]+\.md$/, /^\.github\//, /^design\//]
// DOC-2: the only docs that may carry dates.
const HISTORY_DOCS = ['docs/DEVLOG.md', 'docs/PLAN.md', 'docs/RESEARCH.md', 'CHANGELOG.md']
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/

// A line that opens with something shaped like a rule id followed by `.` or `:` is meant as a definition.
const DEFINITION_LIKE = new RegExp(`^\\s*(?:[-*+]\\s+|#{1,6}\\s+)?(?:\\*\\*)?(${ID_PATTERN})\\*{0,2}[.:]`)
const DEFINITION_FORM = new RegExp(`^\\*\\*${ID_PATTERN}\\. .*?[.?!]\\*\\*`)

const problem = (file, line, rule, message) => ({ file, line, rule, message })

/** AGENTS-2: every definition-like line is `**PREFIX-n. Sentence.**`, and its paragraph is at most 60 words. */
export function findFormProblems(sources) {
  return sources.flatMap(({ file, text, definitions }) => {
    const defined = new Set(definitions.map((it) => it.line))
    const lines = proseLines(text)
    const opensParagraph = (index) =>
      index === 0 || lines[index - 1].text.trim() === '' || lines[index - 1].number !== lines[index].number - 1
    const malformed = lines
      .filter(({ text: line, number }, index) => opensParagraph(index) && DEFINITION_LIKE.test(line) && !defined.has(number))
      .map(({ number }) => problem(file, number, 'AGENTS-2', 'a rule definition opens its line as **PREFIX-n. Sentence.**'))
    const badlyClosed = definitions
      .filter(({ paragraph }) => !DEFINITION_FORM.test(paragraph))
      .map(({ id, line }) => problem(file, line, 'AGENTS-2', `${id}: the bold sentence ends with its own period, as **${id}. Sentence.**`))
    const long = definitions
      .map(({ id, line, paragraph }) => ({ id, line, words: paragraph.split(/\s+/).filter(Boolean).length }))
      .filter(({ words }) => words > MAX_RULE_WORDS)
      .map(({ id, line, words }) => problem(file, line, 'AGENTS-2', `${id} is ${words} words; a rule is at most ${MAX_RULE_WORDS}`))
    return [...malformed, ...badlyClosed, ...long]
  })
}

/** AGENTS-2, AGENTS-3: ids are unique; a shared id lives in its family's guideline, a scoped id in one AGENTS.md. */
export function findIdProblems(sources) {
  const problems = []
  const firstSeen = new Map()
  const scopeOwners = new Map()
  for (const { file, definitions } of sources) {
    const isAgentsFile = path.posix.basename(file) === 'AGENTS.md'
    for (const { id, line } of definitions) {
      const at = `${file}:${line}`
      if (firstSeen.has(id)) problems.push(problem(file, line, 'AGENTS-2', `${id} is also defined at ${firstSeen.get(id)}`))
      else firstSeen.set(id, at)
      const [, prefix, scope] = /^([A-Z]+)(?:-([a-z][a-z0-9]*))?-\d+$/.exec(id)
      if (!(prefix in FAMILIES)) {
        problems.push(
          problem(file, line, 'AGENTS-2', `${id}: unknown prefix ${prefix}; the families are ${Object.keys(FAMILIES).join(', ')}`),
        )
        continue
      }
      if (scope && !isAgentsFile)
        problems.push(problem(file, line, 'AGENTS-3', `${id} is module-scoped; it belongs in that module's AGENTS.md`))
      if (!scope && isAgentsFile)
        problems.push(problem(file, line, 'AGENTS-3', `${id}: an AGENTS.md defines scoped ids only (${prefix}-<module>-1)`))
      if (!scope && !isAgentsFile && path.posix.basename(file) !== FAMILIES[prefix])
        problems.push(problem(file, line, 'AGENTS-3', `${id} belongs in docs/guidelines/${FAMILIES[prefix]}`))
      const scopeKey = scope && `${prefix}-${scope}`
      if (scopeKey && scopeOwners.has(scopeKey) && scopeOwners.get(scopeKey) !== file)
        problems.push(problem(file, line, 'AGENTS-3', `${scopeKey}-n ids are owned by ${scopeOwners.get(scopeKey)}`))
      else if (scopeKey) scopeOwners.set(scopeKey, file)
    }
  }
  return problems
}

/** AGENTS-4: declarations and notes name defined ids, and every defined id is declared or has a note. */
export function findDeclarationProblems(declarations, notes, definedIds, notesFile) {
  const declared = new Set(declarations.map((it) => it.id))
  return [
    ...declarations
      .filter(({ id }) => !definedIds.has(id))
      .map(({ id, file, line }) => problem(file, line, 'AGENTS-4', `names ${id}, which no rule file defines`)),
    ...[...notes]
      .filter(([id]) => !definedIds.has(id))
      .map(([id, { line }]) => problem(notesFile, line, 'AGENTS-4', `has a note for ${id}, which no rule file defines`)),
    ...[...definedIds]
      .filter((id) => !declared.has(id) && !notes.has(id))
      .map((id) => problem(notesFile, 1, 'AGENTS-4', `${id} has no check and no note; declare its check or say why review enforces it`)),
  ]
}

/** AGENTS-1: each AGENTS.md has a CLAUDE.md beside it that is the one line `@AGENTS.md`. */
export function findPointerProblems(agentsFiles, readFile) {
  return agentsFiles.flatMap((file) => {
    const pointer = path.posix.join(path.posix.dirname(file), 'CLAUDE.md')
    const text = readFile(pointer)
    if (text === null) return [problem(pointer, 1, 'AGENTS-1', `missing; add it with the one line ${POINTER}`)]
    if (text.trim() !== POINTER) return [problem(pointer, 1, 'AGENTS-1', `must be the one line ${POINTER}, so Claude Code imports ${file}`)]
    return []
  })
}

/** AGENTS-6, AGENTS-7: each skill has a valid SKILL.md and a relative symlink mirror; no mirror lacks a source. */
export function findSkillProblems(root) {
  const names = (dir) => (existsSync(path.join(root, dir)) ? readdirSync(path.join(root, dir)).filter((it) => !it.startsWith('.')) : [])
  const sources = names(SKILLS_DIR)
  const orphans = names(SKILL_MIRRORS_DIR)
    .filter((name) => !sources.includes(name))
    .map((name) => problem(`${SKILL_MIRRORS_DIR}/${name}`, 1, 'AGENTS-6', `mirrors no skill; remove it or add ${SKILLS_DIR}/${name}`))
  return [...sources.flatMap((name) => [...findSkillFileProblems(root, name), ...findMirrorProblems(root, name)]), ...orphans]
}

function findSkillFileProblems(root, name) {
  const file = `${SKILLS_DIR}/${name}/SKILL.md`
  if (!existsSync(path.join(root, file))) return [problem(file, 1, 'AGENTS-7', 'missing')]
  const text = readFileSync(path.join(root, file), 'utf8')
  const frontMatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontMatter)?.[1].trim()
  const lineCount = text.trimEnd().split('\n').length
  return [
    ...(field('name') === name ? [] : [problem(file, 1, 'AGENTS-7', `front matter needs name: ${name}`)]),
    ...(field('description') ? [] : [problem(file, 1, 'AGENTS-7', 'front matter needs a description')]),
    ...(lineCount <= MAX_SKILL_LINES
      ? []
      : [problem(file, lineCount, 'AGENTS-7', `${lineCount} lines; a skill is at most ${MAX_SKILL_LINES}`)]),
  ]
}

function findMirrorProblems(root, name) {
  const mirror = `${SKILL_MIRRORS_DIR}/${name}`
  const target = `../../${SKILLS_DIR}/${name}`
  const full = path.join(root, mirror)
  const isLink = existsSync(full) && lstatSync(full).isSymbolicLink()
  if (isLink && readlinkSync(full) === target) return []
  return [problem(mirror, 1, 'AGENTS-6', `must be a symlink to ${target}: ln -sfn ${target} ${mirror}`)]
}

/** DOC-1, AGENTS-11: docs/ and the root hold only allowed files, and Markdown elsewhere lives in its homes. */
export function findDocPathProblems(files) {
  return files.flatMap((file) => {
    if (file.startsWith('docs/'))
      return DOCS_ALLOWED.some((it) => it.test(file))
        ? []
        : [problem(file, 1, 'DOC-1', 'docs/ holds only the allowlist in CONTRIBUTING.md § Documentation')]
    if (!file.endsWith('.md')) return []
    if (!file.includes('/'))
      return ROOT_MARKDOWN.includes(file) ? [] : [problem(file, 1, 'DOC-1', `the root's Markdown is ${ROOT_MARKDOWN.join(', ')}`)]
    return MARKDOWN_HOMES.some((it) => it.test(file))
      ? []
      : [problem(file, 1, 'AGENTS-11', 'a stray Markdown file; plans and notes stay out of the repo')]
  })
}

/** DOC-2: no dates in a doc outside the history docs. `docs` is `[{ file, text }]`. */
export function findDateProblems(docs) {
  return docs
    .filter(({ file }) => !HISTORY_DOCS.includes(file) && !file.startsWith('design/'))
    .flatMap(({ file, text }) =>
      proseLines(text)
        .filter(({ text: line }) => ISO_DATE.test(line))
        .map(({ number }) => problem(file, number, 'DOC-2', 'a dated line; only the history docs carry dates')),
    )
}

function readOrNull(file) {
  const full = path.join(ROOT, file)
  return existsSync(full) ? readFileSync(full, 'utf8') : null
}

function main() {
  const sources = readSources(ROOT)
  const definedIds = new Set(sources.flatMap((it) => it.definitions.map((d) => d.id)))
  const agentsFiles = sources.map((it) => it.file).filter((file) => path.posix.basename(file) === 'AGENTS.md')
  const files = listFiles(ROOT, ['.'])
  const markdown = files.filter((file) => file.endsWith('.md')).map((file) => ({ file, text: readOrNull(file) }))
  const problems = [
    ...findFormProblems(sources),
    ...findIdProblems(sources),
    ...findDeclarationProblems(readDeclarations(ROOT), readNotes(ROOT), definedIds, NOTES_FILE),
    ...findPointerProblems(agentsFiles, readOrNull),
    ...findSkillProblems(ROOT),
    ...findDocPathProblems(files),
    ...findDateProblems(markdown),
    ...findStaleFiles(ROOT).map((file) => problem(file, 1, 'AGENTS-5', 'is stale; run node scripts/generate-guidelines.mjs')),
  ]
  for (const { file, line, rule, message } of problems) console.error(`${file}:${line}: ${rule} ${message}`)
  if (problems.length > 0) return 1
  console.log(`check-guidelines: ${definedIds.size} rules in ${sources.length} files, ${agentsFiles.length} AGENTS.md, no problems.`)
  return 0
}

const entry = process.argv[1]
if (entry && path.resolve(entry) === fileURLToPath(import.meta.url)) process.exitCode = main()
