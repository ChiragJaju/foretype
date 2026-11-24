#!/usr/bin/env node
// Builds site/public/activity.json from local git history (no network).
// Commit subjects and SHAs are written only with --public, so a private repo leaks nothing but counts.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_PATH = resolve(ROOT, 'site/public/activity.json')
const WINDOW_DAYS = 30
const LATEST_COUNT = 8
const DAY_MS = 24 * 60 * 60 * 1000
const AREAS = ['app', 'engine', 'site', 'docs', 'infra']
const COMMIT_MARK = '\u0001'
const FIELD_SEP = '\u0002'

const isPublic = process.argv.includes('--public')

// First match wins, so engine paths are tested before the wider app/ prefix.
function areaOf(path) {
  if (path.startsWith('engine/') || path.includes('/ForetypeEngine/')) return 'engine'
  if (path.startsWith('app/')) return 'app'
  if (path.startsWith('site/')) return 'site'
  if (path.startsWith('docs/') || path.endsWith('.md')) return 'docs'
  return 'infra'
}

function dominantArea(paths) {
  const counts = new Map()
  for (const path of paths) {
    const area = areaOf(path)
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }
  let best = 'infra'
  let bestCount = 0
  for (const area of AREAS) {
    const count = counts.get(area) ?? 0
    if (count > bestCount) [best, bestCount] = [area, count]
  }
  return best
}

function readCommits() {
  const format = `${COMMIT_MARK}%H${FIELD_SEP}%aI${FIELD_SEP}%s`
  const log = execFileSync('git', ['log', '--no-merges', '--name-only', `--format=${format}`], { cwd: ROOT, encoding: 'utf8' })
  return log
    .split(COMMIT_MARK)
    .filter(Boolean)
    .map((chunk) => {
      const [header, ...files] = chunk.split('\n')
      const [sha, date, subject] = header.split(FIELD_SEP)
      return { sha, date, subject, area: dominantArea(files.filter(Boolean)) }
    })
}

// The author's own calendar day, taken from the ISO offset, so the result is the same on any machine.
const dayOf = (isoDate) => isoDate.slice(0, 10)

function emptyAreas() {
  return Object.fromEntries(AREAS.map((area) => [area, 0]))
}

function dailyWindow(commits, now) {
  const days = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const date = new Date(now.getTime() - (WINDOW_DAYS - 1 - index) * DAY_MS).toISOString().slice(0, 10)
    return { date, commits: 0, byArea: emptyAreas() }
  })
  const byDate = new Map(days.map((day) => [day.date, day]))
  for (const commit of commits) {
    const day = byDate.get(dayOf(commit.date))
    if (!day) continue
    day.commits += 1
    day.byArea[commit.area] += 1
  }
  return days
}

function latestEntry(commit) {
  const entry = { date: commit.date, area: commit.area }
  if (!isPublic) return entry
  return { sha: commit.sha.slice(0, 7), ...entry, subject: commit.subject }
}

const now = new Date()
const commits = readCommits()
const activity = {
  generatedAt: now.toISOString(),
  repoPublic: isPublic,
  totals: { commits: commits.length, days: new Set(commits.map((commit) => dayOf(commit.date))).size },
  daily: dailyWindow(commits, now),
  latest: commits.slice(0, LATEST_COUNT).map(latestEntry),
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(activity, null, 2)}\n`)
console.log(`activity.json: ${activity.totals.commits} commits over ${activity.totals.days} days (public: ${isPublic})`)
