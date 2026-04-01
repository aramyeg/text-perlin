// Renderer: draws persistent character particles using atlas drawImage.
// Per-character position, rotation (from flow), and skew (from noise).

import { getAtlas, getCharIndex, getCellW, getCellH, getColorCount } from './atlas.js'
import { theme } from './theme.js'

const COLOR_SCALE = 0.004
const COLOR_SPEED = 0.06

export function render(ctx, W, H, flowData, text, noiseColor, time) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, W, H)

  const atlas = getAtlas()
  const charIndex = getCharIndex()
  const cw = getCellW()
  const ch = getCellH()
  const maxCI = getColorCount() - 1
  const tc = time * COLOR_SPEED

  const { particles, charIdxs, count } = flowData

  for (let i = 0; i < count; i++) {
    const i4 = i * 4
    const x = particles[i4]
    const y = particles[i4 + 1]
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue

    const char = text[charIdxs[i]]
    const col = charIndex.get(char)
    if (col === undefined) continue

    const angle = particles[i4 + 2]
    const skew = particles[i4 + 3]

    const cn = noiseColor.noise(x * COLOR_SCALE + tc, y * COLOR_SCALE + tc * 0.6)
    const ci = Math.max(0, Math.min(maxCI, ((cn + 1) * 0.5 * maxCI + 0.5) | 0))

    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    ctx.setTransform(cos, sin, -sin + skew, cos, x, y)
    ctx.drawImage(atlas, col * cw, ci * ch, cw, ch, 0, 0, cw, ch)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
