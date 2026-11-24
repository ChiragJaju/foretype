import { RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { glyphTexture } from '../lib/glyph'
import { useTheme } from '../lib/theme'
import { CLUSTER_KEYS as KEYS } from './clusterKeys'

const PRESS_DECAY = 0.08
const DRIFT_SPEED = 0.12
const MAX_TILT_RAD = 0.35

function Cluster({ pulse, dark }: { pulse: { label: string; at: number }; dark: boolean }) {
  const group = useRef<THREE.Group>(null)
  const meshes = useRef<(THREE.Group | null)[]>([])
  const materials = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const energy = useRef(KEYS.map(() => 0))
  const css = getComputedStyle(document.documentElement)
  const ink = css.getPropertyValue('--ink').trim()
  const keyTop = css.getPropertyValue('--key-top').trim()
  const lime = css.getPropertyValue('--hl').trim()
  const textures = useMemo(
    () => KEYS.map((key) => glyphTexture(key.label, ink, '"JetBrains Mono", ui-monospace, monospace', 76)),
    [ink],
  )
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures])

  useEffect(() => {
    const index = KEYS.findIndex((key) => key.label === pulse.label)
    if (index >= 0) energy.current[index] = 1
  }, [pulse])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, time * DRIFT_SPEED + state.pointer.x * MAX_TILT_RAD, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * MAX_TILT_RAD * 0.6, 0.05)
    }
    KEYS.forEach((key, index) => {
      const mesh = meshes.current[index]
      const material = materials.current[index]
      energy.current[index] = Math.max(0, energy.current[index] - delta * PRESS_DECAY * 12)
      const lit = energy.current[index]
      if (mesh) {
        mesh.position.y = key.position[1] + Math.sin(time * 0.8 + index) * 0.12 - lit * 0.25
        const scale = 1 + lit * 0.18
        mesh.scale.setScalar(scale)
      }
      if (material) {
        material.emissiveIntensity = lit * (dark ? 1.6 : 0.9)
      }
    })
  })

  return (
    <group ref={group}>
      {KEYS.map((key, index) => (
        <group
          key={key.label}
          ref={(node) => void (meshes.current[index] = node)}
          position={key.position}
          rotation={key.tilt}
        >
          <RoundedBox args={[key.wide ? 1.6 : 1, 0.45, 1]} radius={0.14} smoothness={4}>
            <meshStandardMaterial
              ref={(material) => void (materials.current[index] = material)}
              color={keyTop}
              emissive={lime}
              emissiveIntensity={0}
              roughness={0.45}
            />
          </RoundedBox>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.226, 0]}>
            <planeGeometry args={[0.82, 0.82]} />
            <meshBasicMaterial map={textures[index]} transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function KeyCluster({ pulse, active }: { pulse: { label: string; at: number }; active: boolean }) {
  const { theme } = useTheme()

  return (
    <Canvas key={theme /* remount so colours are re-read from CSS tokens */} frameloop={active ? 'always' : 'never'} dpr={[1, 2]} camera={{ position: [0, 0.6, 8.5], fov: 38 }}>
      <ambientLight intensity={theme === 'dark' ? 0.35 : 0.85} />
      <directionalLight position={[3, 6, 4]} intensity={theme === 'dark' ? 0.9 : 1.5} />
      <directionalLight position={[-4, -2, 2]} intensity={0.35} />
      {theme === 'dark' && <pointLight position={[0, 0, 3]} intensity={8} distance={10} color={getComputedStyle(document.documentElement).getPropertyValue('--hl').trim()} />}
      <Cluster pulse={pulse} dark={theme === 'dark'} />
    </Canvas>
  )
}
