import * as THREE from 'three'

const GLYPH_CANVAS_PX = 128

// Draws one label onto a transparent texture for keycap tops.
export function glyphTexture(label: string, color: string, fontFamily: string, fontPx = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = GLYPH_CANVAS_PX
  canvas.height = GLYPH_CANVAS_PX
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = color
    context.font = `500 ${fontPx}px ${fontFamily}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, GLYPH_CANVAS_PX / 2, GLYPH_CANVAS_PX / 2 + 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}
