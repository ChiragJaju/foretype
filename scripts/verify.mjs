#!/usr/bin/env node
// The one local runner of the CI checks: `node scripts/verify.mjs [--tier repo|fast|full] [--changed] [--list]`.
// Tiers nest: repo (scripts/check-*.mjs, node tests, repo linters) < fast (+ Swift and site lint) < full (+ type-check,
// build, tests).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { changedFiles, resolveBase } from './lib/changed-lines.mjs'
import { listFiles } from './lib/guidelines.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TIERS = ['repo', 'fast', 'full']
const SWIFT_PATHS = ['app/Sources', 'app/Tests', 'app/E2E', 'app/Package.swift']
const SWIFT_FILE = /^app\/.*\.swift$/
const FORMATTED_SITE_FILE = /^site\/src\/.*\.(js|mjs|ts|tsx|css|json)$/
const FORMATTED_SCRIPT_FILE = /^scripts\/.*\.(js|mjs|json)$/
const LINTED_SITE_FILE = /^site\/src\/.*\.(ts|tsx)$/
const SITE_FILE = /^site\//
const SHELL_FILE = /\.sh$|^\.githooks\//
const WORKFLOW_FILE = /^\.github\/workflows\/[^/]+\.ya?ml$/
const AGENT_FILE = /(?:^|\/)(?:AGENTS|CLAUDE|SKILL)\.md$|^\.claude\//
const ANY_FILE = /./
const USAGE = 'usage: node scripts/verify.mjs [--tier repo|fast|full] [--changed] [--list]'
const USAGE_EXIT_CODE = 2

/** The parsed flags, or null when the tier is not one of TIERS. */
function parseArgs(argv) {
  const tierIndex = argv.indexOf('--tier')
  const tier = tierIndex === -1 ? 'full' : argv[tierIndex + 1]
  if (!TIERS.includes(tier)) return null
  return { tier, changed: argv.includes('--changed'), list: argv.includes('--list') }
}

function repoChecks(files) {
  const scriptsDir = resolve(ROOT, 'scripts')
  const names = readdirSync(scriptsDir).filter((name) => /^check-.+\.mjs$/.test(name) && !name.endsWith('.test.mjs'))
  const checks = names.map((name) => {
    const rulesPath = resolve(scriptsDir, name.replace(/\.mjs$/, '.rules.json'))
    const rules = existsSync(rulesPath) ? JSON.parse(readFileSync(rulesPath, 'utf8')) : null
    const label = rules ? `${name} (${rules.join(', ')})` : `${name} (no rules.json beside it)`
    return { label, argv: ['node', `scripts/${name}`], missingRules: !rules }
  })
  const tests = readdirSync(scriptsDir).filter((name) => name.endsWith('.test.mjs'))
  if (tests.length > 0) checks.push({ label: 'node tests', argv: ['node', '--test', ...tests.map((name) => `scripts/${name}`)] })
  return [...checks, ...repoLintSteps(files)]
}

/** One lint step over the changed files of a kind, or over all of them when not --changed. */
function scoped(label, argvForAll, argvForFiles, files, pattern) {
  if (!files) return { label, argv: argvForAll }
  const matching = files.filter((file) => pattern.test(file))
  if (matching.length === 0) return { label, skip: 'no changed files' }
  return { label, argv: argvForFiles(matching) }
}

/** Fast linters over repo files; each runs only when a file of its kind changed. */
function repoLintSteps(files) {
  const shellFiles = listFiles(ROOT, ['*.sh', '.githooks/*']).filter((file) => SHELL_FILE.test(file))
  return [
    scoped('shellcheck', ['shellcheck', ...shellFiles], (paths) => ['shellcheck', ...paths], files, SHELL_FILE),
    scoped('typos', ['typos'], (paths) => ['typos', '--force-exclude', '--', ...paths], files, ANY_FILE),
    scoped('actionlint', ['actionlint'], (paths) => ['actionlint', ...paths], files, WORKFLOW_FILE),
    scoped(
      'zizmor',
      ['zizmor', '--offline', '--quiet', '.github/workflows'],
      (paths) => ['zizmor', '--offline', '--quiet', ...paths],
      files,
      WORKFLOW_FILE,
    ),
    scoped(
      'agnix',
      ['npx', '--no-install', 'agnix', '--strict', '.'],
      (paths) => ['npx', '--no-install', 'agnix', '--strict', ...paths],
      files,
      AGENT_FILE,
    ),
    scoped(
      'oxfmt scripts',
      ['npx', '--no-install', 'oxfmt', '--check', 'scripts'],
      (paths) => ['npx', '--no-install', 'oxfmt', '--check', ...paths],
      files,
      FORMATTED_SCRIPT_FILE,
    ),
  ]
}

function lintSteps(files) {
  const siteRelative = (paths) => paths.map((file) => file.replace(/^site\//, ''))
  return [
    scoped(
      'swiftlint',
      ['swiftlint', 'lint', '--strict', '--quiet'],
      (paths) => ['swiftlint', 'lint', '--strict', '--quiet', ...paths],
      files,
      SWIFT_FILE,
    ),
    scoped(
      'swift-format',
      ['swift', 'format', 'lint', '--strict', '--recursive', ...SWIFT_PATHS],
      (paths) => ['swift', 'format', 'lint', '--strict', ...paths],
      files,
      SWIFT_FILE,
    ),
    scoped(
      'oxfmt site',
      ['npx', '--no-install', 'oxfmt', '--check', 'site/src'],
      (paths) => ['npx', '--no-install', 'oxfmt', '--check', ...paths],
      files,
      FORMATTED_SITE_FILE,
    ),
    {
      ...scoped(
        'oxlint',
        ['npx', '--no-install', 'oxlint', '--type-aware', '--deny-warnings'],
        (paths) => ['npx', '--no-install', 'oxlint', '--type-aware', '--deny-warnings', ...siteRelative(paths)],
        files,
        LINTED_SITE_FILE,
      ),
      cwd: 'site',
    },
    // knip reads the whole site graph, so any site change runs it on all of it.
    { ...scoped('knip', ['npx', '--no-install', 'knip'], () => ['npx', '--no-install', 'knip'], files, SITE_FILE), cwd: 'site' },
  ]
}

function fullSteps() {
  return [
    { label: 'site type-check', argv: ['npx', '--no-install', 'tsc', '-b'], cwd: 'site' },
    { label: 'swift build', argv: ['swift', 'build'], cwd: 'app' },
    { label: 'app unit tests', argv: ['app/scripts/test.sh'] },
    { label: 'site unit tests', argv: ['npm', 'test'], cwd: 'site' },
  ]
}

function runStep(step, env) {
  if (step.skip) return 'skipped'
  if (step.missingRules) {
    console.log(`\n▸ ${step.label}: every scripts/check-<name>.mjs needs scripts/check-<name>.rules.json listing its rule ids`)
    return 'FAIL'
  }
  console.log(`\n▸ ${step.label}: ${step.argv.join(' ')}`)
  const run = spawnSync(step.argv[0], step.argv.slice(1), { cwd: resolve(ROOT, step.cwd ?? '.'), env, stdio: 'inherit' })
  if (run.error) console.log(`  could not start ${step.argv[0]}: ${run.error.message}; run make doctor`)
  return run.status === 0 ? 'pass' : 'FAIL'
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args) {
    console.log(USAGE)
    return USAGE_EXIT_CODE
  }
  const base = args.changed ? resolveBase(ROOT) : null
  if (args.changed && !base) {
    console.log('verify: no base to compare with; set VERIFY_BASE or fetch origin/main, or run without --changed')
    return 1
  }
  const scope = base ? { base, files: changedFiles(ROOT, base) } : null
  const env = scope ? { ...process.env, VERIFY_BASE: scope.base } : process.env
  const depth = TIERS.indexOf(args.tier)
  const steps = [...repoChecks(scope?.files), ...(depth >= 1 ? lintSteps(scope?.files) : []), ...(depth >= 2 ? fullSteps() : [])]
  const where = scope ? `${scope.files.length} changed files vs ${scope.base.slice(0, 7)}` : 'whole repo'
  console.log(`verify · tier ${args.tier} · ${where}`)
  if (args.list) {
    for (const step of steps) console.log(`  ${step.label}: ${step.skip ?? step.argv.join(' ')}${step.cwd ? ` (in ${step.cwd}/)` : ''}`)
    return 0
  }
  const results = steps.map((step) => ({ label: step.label, status: runStep(step, env) }))
  console.log('\nverify summary')
  for (const { label, status } of results) console.log(`  ${status.padEnd(7)} ${label}`)
  const failed = results.filter(({ status }) => status === 'FAIL')
  console.log(failed.length === 0 ? 'verify: PASS' : `verify: FAIL (${failed.length} of ${results.length})`)
  return failed.length === 0 ? 0 : 1
}

process.exitCode = main()
