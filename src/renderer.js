// Renderer: draws characters using atlas drawImage.
// Each character gets:
//   - Position + gentle rotation from the flow field path
//   - Per-character SKEW from separate noise (the main visual effect)
//   - Color from yet another noise field
//
// setTransform(a, b, c, d, e, f) where:
//   a=cos*scaleX, b=sin, c=skewX + (-sin), d=cos*scaleY, e=tx, f=ty
// We combine rotation and skew in one matrix.

import { getAtlas, getCharIndex, getCellW, getCellH, getColorCount } from './atlas.js'
import { theme } from './theme.js'

const COLOR_SCALE = 0.004
const COLOR_SPEED = 0.05

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

  const { count, xs, ys, angles, skews, charIdxs } = flowData

  for (let i = 0; i < count; i++) {
    const x = xs[i]
    const y = ys[i]
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue

    const char = text[charIdxs[i]]
    const col = charIndex.get(char)
    if (col === undefined) continue

    // Color from noise
    const cn = noiseColor.noise(x * COLOR_SCALE + tc, y * COLOR_SCALE + tc * 0.6)
    const ci = Math.max(0, Math.min(maxCI, ((cn + 1) * 0.5 * maxCI + 0.5) | 0))

    // Combine path rotation + character skew into one transform
    const a = angles[i]
    const skew = skews[i]
    const cos = Math.cos(a)
    const sin = Math.sin(a)

    // Matrix: rotation * skew
    // [cos, sin] * [1, 0]   = [cos,        sin      ]
    // [-sin,cos]   [skew,1]   [-sin+skew*cos, cos+skew*sin] ... wait
    // Actually setTransform(a,b,c,d,e,f):
    //   a = horizontal scaling (cos for rotation)
    //   b = vertical skewing (sin for rotation)
    //   c = horizontal skewing (-sin for rotation, + skew added)
    //   d = vertical scaling (cos for rotation)
    ctx.setTransform(cos, sin, -sin + skew, cos, x, y)
    ctx.drawImage(atlas, col * cw, ci * ch, cw, ch, 0, 0, cw, ch)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
