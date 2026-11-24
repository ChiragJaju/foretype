// What a branch changed against its base: the base commit, the changed files and the lines each one adds.
// The base is VERIFY_BASE (set by verify.mjs --changed, and always by CI), else locally the merge base with origin/main.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { report } from './findings.mjs'

const BASE_BRANCH = 'origin/main'
const GIT_MAX_BUFFER_BYTES = 64 << 20

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER_BYTES, stdio: ['ignore', 'pipe', 'pipe'] })
}

const splitLines = (text) => text.split('\n').filter(Boolean)

/**
 * The base commit to compare with, or null when there is none. CI gets no merge-base fallback: on a push to main,
 * origin/main is HEAD, so the fallback would judge an empty diff.
 */
export function resolveBase(root, env = process.env) {
  if (env.VERIFY_BASE) return env.VERIFY_BASE
  if (env.CI) return null
  try {
    return git(root, 'merge-base', BASE_BRANCH, 'HEAD').trim()
  } catch {
    return null
  }
}

/** The exit code for a check with no base: a failure in CI, where judging nothing would pass unseen, else a notice. */
export function reportNoBase(check, env = process.env) {
  if (!env.CI) return report(check, [], `no ${BASE_BRANCH} to compare with; nothing judged`)
  console.error(`${check}: CI must set VERIFY_BASE to the commit to compare with (.github/workflows/ci.yml)`)
  return 1
}

/**
 * Files that differ from `base` in the working tree, plus untracked ones. `deleted` adds removed files,
 * and renames count as a delete plus an add, so a moved file's old path is changed too.
 */
export function changedFiles(root, base, { deleted = false } = {}) {
  const filter = deleted ? 'ACMRD' : 'ACMR'
  const diffed = splitLines(git(root, 'diff', '--name-only', '--no-renames', `--diff-filter=${filter}`, base))
  const untracked = splitLines(git(root, 'ls-files', '--others', '--exclude-standard'))
  return [...new Set([...diffed, ...untracked])].sort()
}

/** Added line numbers per file from a `git diff --unified=0` text: Map of path → Set of 1-based lines. */
export function parseAddedLines(diffText) {
  const added = new Map()
  let file = null
  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line === '+++ /dev/null' ? null : line.slice('+++ b/'.length)
      if (file && !added.has(file)) added.set(file, new Set())
      continue
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (!hunk || !file) continue
    const start = Number(hunk[1])
    const count = hunk[2] === undefined ? 1 : Number(hunk[2])
    for (let offset = 0; offset < count; offset++) added.get(file).add(start + offset)
  }
  return added
}

/** Added lines per file for `files` against `base`; an untracked file counts as all added. */
export function addedLines(root, base, files) {
  if (files.length === 0) return new Map()
  const diff = git(root, 'diff', '--unified=0', '--no-color', '--no-ext-diff', '--no-renames', base, '--', ...files)
  const added = parseAddedLines(diff)
  const untracked = new Set(splitLines(git(root, 'ls-files', '--others', '--exclude-standard', '--', ...files)))
  for (const file of untracked) {
    const lineCount = readFileSync(path.join(root, file), 'utf8').split('\n').length
    added.set(file, new Set(Array.from({ length: lineCount }, (_, index) => index + 1)))
  }
  return added
}

/** Commit messages on the branch since `base`, joined. */
export function branchCommitMessages(root, base) {
  return git(root, 'log', '--format=%B', `${base}..HEAD`)
}
