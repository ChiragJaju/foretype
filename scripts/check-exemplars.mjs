#!/usr/bin/env node
// AGENTS-14: every file a `## Copy from` table names exists and carries no lint or type-check disable, since agents
// copy it. The Lint job holds it to zero SwiftLint and oxlint findings with every other file.
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

function main() {
  const exists = (file) => existsSync(path.join(ROOT, file))
  const read = (file) => (exists(file) ? readFileSync(path.join(ROOT, file), 'utf8') : null)
  const tables = listFiles(ROOT, ['*AGENTS.md']).filter((file) => path.posix.basename(file) === 'AGENTS.md')
  const named = tables.flatMap((agentsFile) => listExemplars(agentsFile, read(agentsFile), exists).map((it) => ({ agentsFile, ...it })))
  const fileProblems = named.flatMap(({ agentsFile, ...it }) => findExemplarProblems(agentsFile, it, read))
  const present = new Set(named.map(({ file }) => file).filter(exists))
  return report('check-exemplars', fileProblems, `${present.size} exemplars exist and carry no disable`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
