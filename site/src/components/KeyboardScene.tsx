import { Line, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Line2 } from 'three-stdlib'
import { glyphTexture } from '../lib/glyph'
import { useTheme } from '../lib/theme'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const ROW_INDENT = [0, 0.55, 1.15]
const KEY_PITCH = 1.08
const KEY_SIZE = 0.9
const KEY_HEIGHT = 0.32
const WORDS = ['thanks', 'sounds', 'good', 'tomorrow', 'perfect']
const SWIPE_SECONDS = 1.7
const HOLD_SECONDS = 0.9
const PATH_SAMPLES = 96
const TRAIL_HEIGHT = 0.42
const MAX_TILT_RAD = 0.22

type Palette = { deck: string; key: string; ink: string; accent: string }

function readPalette(_theme: string): Palette {
  const css = getComputedStyle(document.documentElement)
  const value = (name: string) => css.getPropertyValue(name).trim()
  return { deck: value('--bg-3'), key: value('--key-top'), ink: value('--ink'), accent: value('--accent') }
}

const KEY_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const positions: Record<string, THREE.Vector3> = {}
  const width = ROWS[0].length * KEY_PITCH
  ROWS.forEach((row, rowIndex) => {
    row.split('').forEach((letter, column) => {
      positions[letter] = new THREE.Vector3(
        column * KEY_PITCH + ROW_INDENT[rowIndex] - width / 2 + KEY_PITCH / 2,
        0,
        (rowIndex - 1) * KEY_PITCH,
      )
    })
  })
  return positions
})()

const LETTERS = Object.keys(KEY_POSITIONS)

function wordCurve(word: string) {
  const points = word.split('').map((letter) => KEY_POSITIONS[letter].clone().setY(TRAIL_HEIGHT))
  // Repeated letters ("good") need a small wiggle so the curve stays well-defined.
  const spaced = points.map((point, index) =>
    index > 0 && point.equals(points[index - 1]) ? point.clone().add(new THREE.Vector3(0.18, 0, 0.12)) : point,
  )
  return new THREE.CatmullRomCurve3(spaced, false, 'centripetal', 0.5)
}

function Keyboard({ palette, onWord }: { palette: Palette; onWord: (word: string, progress: number) => void }) {
  const group = useRef<THREE.Group>(null)
  const keys = useRef<Record<string, THREE.Group | null>>({})
  const halos = useRef<Record<string, THREE.Mesh | null>>({})
  const trail = useRef<Line2>(null)
  const clock = useRef({ word: 0, elapsed: 0, lastReported: -1 })
  const curves = useMemo(() => WORDS.map(wordCurve), [])
  const samples = useMemo(() => curves.map((curve) => curve.getSpacedPoints(PATH_SAMPLES)), [curves])
  const textures = useMemo(
    () =>
      Object.fromEntries(LETTERS.map((letter) => [letter, glyphTexture(letter, palette.ink, '"Instrument Sans", system-ui, sans-serif')])),
    [palette.ink],
  )
  useEffect(() => () => Object.values(textures).forEach((texture) => texture.dispose()), [textures])

  useFrame((state, delta) => {
    const timer = clock.current
    timer.elapsed += Math.min(delta, 0.05)
    if (timer.elapsed > SWIPE_SECONDS + HOLD_SECONDS) {
      timer.elapsed = 0
      timer.word = (timer.word + 1) % WORDS.length
    }
    const word = WORDS[timer.word]
    const progress = Math.min(timer.elapsed / SWIPE_SECONDS, 1)
    const eased = 1 - Math.pow(1 - progress, 2)

    const shown = Math.max(2, Math.round(eased * PATH_SAMPLES))
    const flat = samples[timer.word].slice(0, shown).flatMap((point) => [point.x, point.y, point.z])
    trail.current?.geometry.setPositions(flat)
    if (trail.current) {
      const fade = timer.elapsed > SWIPE_SECONDS ? 1 - (timer.elapsed - SWIPE_SECONDS) / HOLD_SECONDS : 1
      trail.current.material.opacity = Math.max(0, fade)
    }

    // The letter the finger is heading to gets the largest invisible landing zone.
    const letterProgress = eased * (word.length - 1)
    const nextIndex = Math.min(word.length - 1, Math.ceil(letterProgress))
    const typedCount = Math.floor(letterProgress) + 1
    if (typedCount !== timer.lastReported) {
      timer.lastReported = typedCount
      onWord(word, typedCount)
    }

    for (const letter of LETTERS) {
      const upcoming = word.indexOf(letter, Math.max(0, nextIndex)) - nextIndex
      const isNext = word[nextIndex] === letter && progress < 1
      const boost = isNext ? 1 : upcoming > 0 && upcoming < 3 && progress < 1 ? 0.35 : 0
      const key = keys.current[letter]
      const halo = halos.current[letter]
      if (key) key.position.y = THREE.MathUtils.lerp(key.position.y, boost * 0.14, 0.18)
      if (halo) {
        const scale = THREE.MathUtils.lerp(halo.scale.x, 1 + boost * 0.85, 0.16)
        halo.scale.set(scale, scale, 1)
        const material = halo.material as THREE.MeshBasicMaterial
        material.opacity = THREE.MathUtils.lerp(material.opacity, boost * 0.55, 0.16)
      }
    }

    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * MAX_TILT_RAD, 0.06)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -state.pointer.x * MAX_TILT_RAD * 0.6, 0.06)
    }
  })

  return (
    <group ref={group}>
      <RoundedBox args={[ROWS[0].length * KEY_PITCH + 0.6, 0.2, 3 * KEY_PITCH + 0.6]} radius={0.1} position={[0, -0.26, 0]}>
        <meshStandardMaterial color={palette.deck} roughness={0.9} />
      </RoundedBox>
      {LETTERS.map((letter) => {
        const position = KEY_POSITIONS[letter]
        return (
          <group key={letter} position={[position.x, 0, position.z]}>
            <mesh ref={(mesh) => void (halos.current[letter] = mesh)} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.155, 0]}>
              <planeGeometry args={[KEY_SIZE * 1.05, KEY_SIZE * 1.05]} />
              <meshBasicMaterial color={palette.accent} transparent opacity={0} depthWrite={false} />
            </mesh>
            <group ref={(node) => void (keys.current[letter] = node)}>
              <RoundedBox args={[KEY_SIZE, KEY_HEIGHT, KEY_SIZE]} radius={0.1} smoothness={3}>
                <meshStandardMaterial color={palette.key} roughness={0.55} />
              </RoundedBox>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, KEY_HEIGHT / 2 + 0.002, 0]}>
                <planeGeometry args={[0.6, 0.6]} />
                <meshBasicMaterial map={textures[letter]} transparent depthWrite={false} />
              </mesh>
            </group>
          </group>
        )
      })}
      <Line
        ref={trail}
        points={[
          [0, 0, 0],
          [0, 0, 0],
        ]}
        color={palette.accent}
        lineWidth={5}
        transparent
        opacity={1}
      />
    </group>
  )
}

export default function KeyboardScene({ active }: { active: boolean }) {
  const { theme } = useTheme()
  // Re-read colours whenever the theme flips; the data-theme attribute is already updated by then.
  const palette = useMemo(() => readPalette(theme), [theme])
  const [decoded, setDecoded] = useState({ word: WORDS[0], typed: 1 })

  return (
    <div className="relative h-full w-full">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ position: [0, 10, 9.6], fov: 40 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0.6)}
      >
        <ambientLight intensity={theme === 'dark' ? 0.55 : 0.9} />
        <directionalLight position={[4, 8, 5]} intensity={theme === 'dark' ? 1.1 : 1.6} />
        <pointLight position={[0, 2, 0]} intensity={theme === 'dark' ? 6 : 0} color={palette.accent} distance={9} />
        <Keyboard palette={palette} onWord={(word, typed) => setDecoded({ word, typed })} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <div className="rounded-full bg-bg-2/90 px-4 py-2 font-mono text-[12px] shadow-ring backdrop-blur">
          <span className="text-ink-3">decoded → </span>
          <span className="text-ink">{decoded.word.slice(0, decoded.typed)}</span>
          <span className="text-ghost">{decoded.word.slice(decoded.typed)}</span>
        </div>
      </div>
    </div>
  )
}
