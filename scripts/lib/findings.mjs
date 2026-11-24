// The shape every repo check prints: `path:line: RULE-ID message`, exit 1 when there is any.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const finding = (file, line, rule, message) => ({ file, line, rule, message })

/** Prints the findings (or the pass summary) and returns the exit code. */
export function report(check, findings, passSummary) {
  for (const { file, line, rule, message } of findings) console.error(`${file}:${line}: ${rule} ${message}`)
  if (findings.length > 0) {
    console.error(`${check}: ${findings.length} problem(s)`)
    return 1
  }
  console.log(`${check}: ${passSummary}`)
  return 0
}

/** True when the module at `moduleUrl` is the script node was started with. */
export const isEntry = (moduleUrl) => Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl)
