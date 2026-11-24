import * as THREE from 'three'

const GLYPH_CANVAS_PX = 128
const GLYPH_FONT_PX = 64

// Draws one label onto a transparent texture for keycap tops.
export function glyphTexture(label: string, color: string, fontFamily: string) {
  const canvas = document.createElement('canvas')
  canvas.width = GLYPH_CANVAS_PX
  canvas.height = GLYPH_CANVAS_PX
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = color
    context.font = `500 ${GLYPH_FONT_PX}px ${fontFamily}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, GLYPH_CANVAS_PX / 2, GLYPH_CANVAS_PX / 2 + 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}
