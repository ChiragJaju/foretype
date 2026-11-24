#!/usr/bin/env node
// AGENTS-16: no tracked file over 1 MB except the npm lockfiles. The pre-commit hook blocks staged ones; this covers CI.
import { statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { finding, isEntry, report } from './lib/findings.mjs'
import { listFiles } from './lib/guidelines.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const MAX_FILE_BYTES = 1024 * 1024
const LOCKFILE = /^(?:site\/)?package-lock\.json$/

/** Files over the limit; `sizeOf` returns a file's bytes. */
export function findLargeFiles(files, sizeOf) {
  return files
    .filter((file) => !LOCKFILE.test(file))
    .map((file) => ({ file, bytes: sizeOf(file) }))
    .filter(({ bytes }) => bytes > MAX_FILE_BYTES)
    .map(({ file, bytes }) => finding(file, 1, 'AGENTS-16', `is ${bytes} bytes, over the ${MAX_FILE_BYTES}-byte limit; keep it out of git`))
}

function main() {
  const files = listFiles(ROOT, ['.'])
  const problems = findLargeFiles(files, (file) => statSync(path.join(ROOT, file)).size)
  return report('check-large-files', problems, `${files.length} files, none over ${MAX_FILE_BYTES} bytes`)
}

if (isEntry(import.meta.url)) process.exitCode = main()
