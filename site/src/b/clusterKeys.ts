type ClusterKey = { label: string; position: [number, number, number]; tilt: [number, number, number]; wide?: boolean }

export const CLUSTER_KEYS: ClusterKey[] = [
  { label: 'Y', position: [-1.6, 1.3, 0.4], tilt: [0.5, 0.3, -0.2] },
  { label: 'N', position: [0.4, 1.9, -0.6], tilt: [0.7, -0.4, 0.2] },
  { label: '⇥', position: [1.7, 0.6, 0.6], tilt: [0.4, -0.6, 0.3], wide: true },
  { label: 'A', position: [-0.6, 0.2, 1.4], tilt: [0.9, 0.2, 0.1] },
  { label: 'F', position: [-2.2, -0.4, -0.4], tilt: [0.3, 0.7, -0.3] },
  { label: 'T', position: [0.9, -0.5, -1.2], tilt: [0.6, 0.1, 0.5] },
  { label: '⌘', position: [2.3, -1.4, -0.2], tilt: [0.8, -0.3, -0.4] },
  { label: '?', position: [-1.1, -1.6, 0.5], tilt: [0.5, 0.5, 0.2] },
  { label: '8', position: [0.1, -2.1, -0.4], tilt: [0.7, -0.2, -0.1] },
  { label: '⏎', position: [-0.2, 0.9, -1.7], tilt: [0.2, 0.4, 0.6] },
  { label: '.', position: [1.4, 2.0, 1.1], tilt: [0.9, 0.3, -0.5] },
]

// Maps a pressed key to the keycap that should light up.
export function keyLabelFor(key: string) {
  if (key === 'Tab') return '⇥'
  if (key === 'Enter') return '⏎'
  const upper = key.toUpperCase()
  if (CLUSTER_KEYS.some((item) => item.label === upper)) return upper
  // Unknown keys still light something, so every keystroke gets feedback.
  return CLUSTER_KEYS[(upper.charCodeAt(0) || 0) % CLUSTER_KEYS.length].label
}

