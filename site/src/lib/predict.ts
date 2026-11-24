// A scripted stand-in for the on-device model: each field has candidate answers
// ranked by a prior, and every keystroke keeps only the ones the typed text still fits.

export type Candidate = { text: string; prior: number; tag?: string }

export type Ranked = Candidate & { score: number; matches: boolean }

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ')

export function rank(typed: string, candidates: Candidate[]): Ranked[] {
  const prefix = normalize(typed)
  const scored = candidates.map((candidate) => {
    const matches = normalize(candidate.text).startsWith(prefix)
    return { ...candidate, matches, score: matches ? candidate.prior : 0 }
  })
  const total = scored.reduce((sum, item) => sum + item.score, 0) || 1
  return scored.map((item) => ({ ...item, score: item.score / total })).sort((a, b) => b.score - a.score || b.prior - a.prior)
}

// The ghost text is the unseen remainder of the best match, kept in the user's casing.
export function ghostFor(typed: string, candidates: Candidate[]): string {
  const best = rank(typed, candidates).find((item) => item.matches)
  if (!best) return ''
  return best.text.slice(typed.length)
}

const EMAIL_DOMAINS = ['gmail.com', 'icloud.com', 'outlook.com', 'proton.me', 'hey.com']

// After "@", offer the likeliest domain the typed letters still fit.
export function emailGhost(value: string) {
  const at = value.indexOf('@')
  if (at < 1) return ''
  const typedDomain = value.slice(at + 1).toLowerCase()
  const match = EMAIL_DOMAINS.find((domain) => domain.startsWith(typedDomain))
  return match ? match.slice(typedDomain.length) : ''
}
