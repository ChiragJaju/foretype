#!/usr/bin/env node
// AGENTS-14: every file a `## Copy from` table names exists, carries no lint or type-check disable, and passes
// SwiftLint or oxlint with zero findings, since agents copy it. A missing linter is skipped with a notice.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { finding, isEntry, report } from './lib/findings.mjs'
import { listFiles } from './lib/guidelines.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COPY_FROM = /^## Copy from\n([\s\S]*?)(?=^## |(?![\s\S]))/m
const SOURCE_PATH = /`([^`\s]+\.(?:swift|ts|tsx))`/g
const DISABLE = /swiftlint:disable|(?:oxlint|eslint)-disable|@ts-(?:ignore|expect-error|nocheck)/

/** The files a table names, `{ file, line }`: a path is relative to the AGENTS.md folder, else to the repo root. */
export function listExemplars(agentsFile, markdown, exists) {
  const section = COPY_FROM.exec(markdown)
  if (!section) return []
  const sectionLine = markdown.slice(0, section.index).split('\n').length
  const dir = path.posix.dirname(agentsFile)
  return section[1].split('\n').flatMap((row, offset) => {
    if (!row.startsWith('|')) return []
    const cell = row.split('|')[2] ?? ''
    return [...cell.matchAll(SOURCE_PATH)].map((match) => {
      const nearby = path.posix.normalize(path.posix.join(dir, match[1]))
      return { named: match[1], file: exists(nearby) ? nearby : match[1], line: sectionLine + 1 + offset }
    })
  })
}

/** Existence and disable-comment problems for one exemplar. */
export function findExemplarProblems(agentsFile, { named, file, line }, read) {
  const text = read(file)
  if (text === null) return [finding(agentsFile, line, 'AGENTS-14', `names ${named}, which does not exist`)]
  return DISABLE.test(text) ? [finding(file, 1, 'AGENTS-14', `an exemplar carries a lint or type-check disable`)] : []
}

/** Lint findings for the exemplars, or a notice when the linter is missing. */
function lintExemplars(files) {
  const swift = files.filter((file) => file.endsWith('.swift'))
  const site = files.filter((file) => file.startsWith('site/'))
  const problems = []
  const notices = []
  if (swift.length > 0) {
    const run = spawnSync('swiftlint', ['lint', '--quiet', '--reporter', 'json', ...swift], { cwd: ROOT, encoding: 'utf8' })
    if (run.error) notices.push('swiftlint not installed; Swift exemplars were not linted')
    else
      for (const it of JSON.parse(run.stdout || '[]'))
        problems.push(finding(path.relative(ROOT, it.file), it.line, 'AGENTS-14', `swiftlint ${it.rule_id}: ${it.reason}`))
  }
  const oxlint = path.join(ROOT, 'site/node_modules/.bin/oxlint')
  if (site.length > 0 && !existsSync(oxlint)) notices.push('site/node_modules missing; site exemplars were not linted')
  else if (site.length > 0) {
    const run = spawnSync(oxlint, ['--format', 'json', ...site.map((file) => path.relative('site', file))], {
      cwd: path.join(ROOT, 'site'),
      encoding: 'utf8',
    })
    for (const it of JSON.parse(run.stdout).diagnostics)
      problems.push(finding(`site/${it.filename}`, it.labels[0]?.span.line ?? 1, 'AGENTS-14', `oxlint ${it.code}: ${it.message}`))
  }
  return { problems, notices }
}

function main() {
  const exists = (file) => existsSync(path.join(ROOT, file))
  const read = (file) => (exists(file) ? readFileSync(path.join(ROOT, file), 'utf8') : null)
  const tables = listFiles(ROOT, ['*AGENTS.md']).filter((file) => path.posix.basename(file) === 'AGENTS.md')
  const named = tables.flatMap((agentsFile) => listExemplars(agentsFile, read(agentsFile), exists).map((it) => ({ agentsFile, ...it })))
  const fileProblems = named.flatMap(({ agentsFile, ...it }) => findExemplarProblems(agentsFile, it, read))
  const present = [...new Set(named.map(({ file }) => file).filter(exists))]
  const { problems, notices } = lintExemplars(present)
  for (const notice of notices) console.log(`check-exemplars: ${notice}`)
  return report('check-exemplars', [...fileProblems, ...problems], `${present.length} exemplars exist and are clean`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
