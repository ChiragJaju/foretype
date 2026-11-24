// Written waivers (CONTRIBUTING.md § Waivers): `TAG(<id>): <reason>`, or `CONTRACT-CHANGE(<reason>)`, on a line
// of their own in the PR body and a commit message. In a PR run (PR_BODY set) a waiver counts only when both carry it.
import { branchCommitMessages } from './changed-lines.mjs'

// Fenced blocks, blockquotes and inline code only show the syntax, so they waive nothing.
const stripExamples = (text) =>
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*>.*$/gm, '')
    .replace(/`[^`\n]*`/g, '')

/** Each `TAG(<inner>)` line in `text`, with what follows `:` on the same line as `reason` (may be empty). */
function readTagLines(tag, text) {
  // `[^\S\n]` is a space that stays on the line: `\s` would take the next line as the reason.
  const line = new RegExp(`^[^\\S\\n]*[-*]?[^\\S\\n]*${tag}\\(([^)\\n]*)\\)(?:[^\\S\\n]*:[^\\S\\n]*([^\\n]*))?`, 'gm')
  return [...stripExamples(text).matchAll(line)].map((match) => ({ inner: match[1].trim(), reason: (match[2] ?? '').trim() }))
}

/** `TAG(<id>): <reason>` waivers in `text`: Map of id → reason. A line without an id or a reason waives nothing. */
export function readWaivers(tag, text) {
  const waived = new Map()
  for (const { inner, reason } of readTagLines(tag, text)) if (inner && reason && !waived.has(inner)) waived.set(inner, reason)
  return waived
}

/** The reasons of `TAG(<reason>)` lines in `text`, such as CONTRACT-CHANGE. */
export function readReasonTags(tag, text) {
  return readTagLines(tag, text)
    .map(({ inner }) => inner)
    .filter(Boolean)
}

/** The PR body (only in a pull_request run) and the branch's commit messages since `base`. */
export function readWaiverSources(root, base, env = process.env) {
  const prBody = env.GITHUB_EVENT_NAME === 'pull_request' ? (env.PR_BODY ?? '') : null
  return { prBody, commits: base ? branchCommitMessages(root, base) : '' }
}

/**
 * The waivers for `tag` that count, and a notice for each one that is only on one side. `read` is
 * readWaivers or readReasonTags; keys are ids (or reasons, for reason-only tags).
 */
export function selectWaivers(tag, { prBody, commits }, read = readWaivers) {
  const asMap = (found) => (found instanceof Map ? found : new Map(found.map((reason) => [reason, reason])))
  const inCommits = asMap(read(tag, commits))
  if (prBody === null) return { waived: inCommits, notices: [] }
  const inBody = asMap(read(tag, prBody))
  const waived = new Map([...inCommits].filter(([key]) => inBody.has(key)))
  const oneSided = [...new Set([...inCommits.keys(), ...inBody.keys()])].filter((key) => !waived.has(key))
  const notices = oneSided.map((key) => `${tag}(${key}) is in ${inBody.has(key) ? 'the PR body' : 'a commit message'} only; put it in both`)
  return { waived, notices }
}
