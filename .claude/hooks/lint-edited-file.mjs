#!/usr/bin/env node
// PostToolUse hook for Edit and Write: formats the edited file, lints it, and feeds findings back to the
// agent. Swift: swift-format, then `swiftlint --strict`. Site and script JS/TS: oxfmt, then oxlint on site
// files. A missing tool never blocks; it is named once per session.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

// Claude Code shows a PostToolUse hook's stderr to the agent when the hook exits 2.
const FEEDBACK_EXIT_CODE = 2
const SWIFT_FILE = /\.swift$/
const SCRIPT_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/
const SITE_FILE = /^site\//
const NOTICE_DIR = path.join(tmpdir(), 'foretype-lint-hook')

const run = (command, args, cwd) => spawnSync(command, args, { cwd, encoding: 'utf8' })
const succeeds = (command, args, cwd) => run(command, args, cwd).status === 0

/** The formatter and linter for one file, each `{ name, available, command, args, cwd? }`; null when none applies. */
function toolsFor(file, root) {
  if (SWIFT_FILE.test(file))
    return {
      format: { name: 'swift-format', available: succeeds('swift', ['format', '--version'], root), command: 'swift', args: ['format', '--in-place', file] },
      lint: { name: 'swiftlint', available: succeeds('swiftlint', ['version'], root), command: 'swiftlint', args: ['lint', '--strict', '--quiet', file] },
    }
  if (!SCRIPT_FILE.test(file)) return null
  const oxfmt = path.join(root, 'node_modules/.bin/oxfmt')
  const oxlint = path.join(root, 'site/node_modules/.bin/oxlint')
  return {
    format: { name: 'oxfmt', available: existsSync(oxfmt), command: oxfmt, args: [file] },
    lint: SITE_FILE.test(file)
      ? { name: 'oxlint', available: existsSync(oxlint), command: oxlint, args: [path.relative('site', file)], cwd: path.join(root, 'site') }
      : null,
  }
}

/** True the first time `session` asks to name a missing tool. */
function firstNotice(session) {
  const marker = path.join(NOTICE_DIR, session.replace(/[^\w-]/g, '_'))
  if (existsSync(marker)) return false
  mkdirSync(NOTICE_DIR, { recursive: true })
  writeFileSync(marker, '')
  return true
}

function main() {
  const event = JSON.parse(readFileSync(0, 'utf8'))
  const root = process.env.CLAUDE_PROJECT_DIR ?? event.cwd
  const absolute = event.tool_input?.file_path
  if (!root || !absolute || !existsSync(absolute)) return 0
  const file = path.relative(root, absolute)
  if (file.startsWith('..')) return 0
  const tools = toolsFor(file, root)
  if (!tools) return 0

  const missing = [tools.format, tools.lint].filter((tool) => tool && !tool.available).map((tool) => tool.name)
  if (tools.format.available) run(tools.format.command, tools.format.args, root)
  const lint = tools.lint?.available ? run(tools.lint.command, tools.lint.args, tools.lint.cwd ?? root) : null
  const findings = lint && lint.status !== 0 ? `${lint.stdout}${lint.stderr}`.trim() : ''

  if (findings) {
    console.error(`${tools.lint.name} findings in ${file} (fix them; CI runs the same lint):\n${findings}`)
    return FEEDBACK_EXIT_CODE
  }
  if (missing.length > 0 && firstNotice(event.session_id ?? 'session')) {
    const note = `lint-edited-file: ${missing.join(', ')} not installed, so edited files are not checked by it here (run make bootstrap). CI still runs it.`
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: note } }))
  }
  return 0
}

process.exitCode = main()
