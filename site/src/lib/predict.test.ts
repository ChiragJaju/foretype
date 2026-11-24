import { describe, expect, test } from 'vitest'

import { emailGhost, ghostFor, rank, type Candidate } from './predict'

// The hero demo's answers: the prior favours yes and Home until a typed letter rules them out.
const REPLIES: Candidate[] = [
  { text: 'Yes! Thursday at 8 works. See you there.', prior: 0.62, tag: 'yes' },
  { text: "No, Thursday's packed. Could we do Friday?", prior: 0.27, tag: 'no' },
  { text: 'Maybe. Let me check and confirm tonight.', prior: 0.11, tag: 'maybe' },
]
const ADDRESSES: Candidate[] = [
  { text: 'Alder House, 14 Alder Lane, Brooklyn.', prior: 0.7, tag: 'Home' },
  { text: 'Foundry Works, 88 Mission St, SF.', prior: 0.22, tag: 'Office' },
  { text: '27 Fernhill Road, Austin.', prior: 0.08, tag: 'Parents' },
]

describe('rank and ghostFor', () => {
  test('before a keystroke the likeliest answer leads: yes, and the Home address', () => {
    expect(rank('', REPLIES)[0].tag).toBe('yes')
    expect(ghostFor('', ADDRESSES)).toBe('Alder House, 14 Alder Lane, Brooklyn.')
  })

  test('typing "N" turns the yes answer into no', () => {
    expect(rank('N', REPLIES)[0]).toMatchObject({ tag: 'no', matches: true, score: 1 })
    expect(ghostFor('N', REPLIES)).toBe("o, Thursday's packed. Could we do Friday?")
  })

  test('typing "F" turns the Home address into the Office address', () => {
    expect(rank('F', ADDRESSES)[0].tag).toBe('Office')
    expect(ghostFor('F', ADDRESSES)).toBe('oundry Works, 88 Mission St, SF.')
  })

  test('case and repeated spaces do not stop a match, and the ghost continues what was typed', () => {
    expect(rank('no,  THURSDAY', REPLIES)[0].tag).toBe('no')
    expect(ghostFor('no, thursday', REPLIES)).toBe("'s packed. Could we do Friday?")
  })

  test('when nothing fits, every score is 0 and there is no ghost', () => {
    const ranked = rank('Q', REPLIES)
    expect(ranked.every((item) => !item.matches && item.score === 0)).toBe(true)
    expect(ranked.map((item) => item.tag)).toEqual(['yes', 'no', 'maybe'])
    expect(ghostFor('Q', REPLIES)).toBe('')
  })
})

describe('emailGhost', () => {
  test('after "@" it offers the first domain the typed letters fit', () => {
    expect(emailGhost('ada@')).toBe('gmail.com')
    expect(emailGhost('ada@PR')).toBe('oton.me')
  })

  test('no ghost before a local part, without "@", or for an unknown domain', () => {
    expect(emailGhost('@gmail')).toBe('')
    expect(emailGhost('ada')).toBe('')
    expect(emailGhost('ada@example')).toBe('')
  })
})
