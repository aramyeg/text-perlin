// Renderer: draws characters using atlas drawImage (not fillText).
// Per-character setTransform for position + rotation.
// Color selected from atlas row based on noise.

import { getAtlas, getCharIndex, getCellW, getCellH, getColorCount } from './atlas.js'

const COLOR_SCALE = 0.004
const COLOR_SPEED = 0.06

export function render(ctx, W, H, flowData, text, noiseColor, time) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#0d0906'
  ctx.fillRect(0, 0, W, H)

  const atlas = getAtlas()
  const charIndex = getCharIndex()
  const cw = getCellW()
  const ch = getCellH()
  const colorCount = getColorCount()
  const maxColorIdx = colorCount - 1
  const tc = time * COLOR_SPEED

  const { count, xs, ys, angles, charIdxs } = flowData

  for (let i = 0; i < count; i++) {
    const x = xs[i]
    const y = ys[i]

    // Skip off-screen
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue

    const a = angles[i]
    const char = text[charIdxs[i]]
    const col = charIndex.get(char)
    if (col === undefined) continue

    // Color from noise
    const cn = noiseColor.noise(x * COLOR_SCALE + tc, y * COLOR_SCALE + tc * 0.5)
    const ci = Math.max(0, Math.min(maxColorIdx, ((cn + 1) * 0.5 * maxColorIdx + 0.5) | 0))

    // setTransform: rotation + translation
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    ctx.setTransform(cos, sin, -sin, cos, x, y)
    ctx.drawImage(atlas, col * cw, ci * ch, cw, ch, 0, 0, cw, ch)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
