// Renderer: draws whole lines of text with per-line transforms.
// Each line gets position (y from leader), skew, and color from noise.
// ~50-60 fillText calls per frame = plenty fast.

import { theme } from './theme.js'

const FONT = '13px "Courier New",monospace'
const COLOR_SCALE = 0.004
const COLOR_SPEED = 0.06

// Pre-bake color palette as CSS strings
const PALETTE = theme.palette
const PALETTE_CSS = PALETTE.map((c, i) => {
  return { color: c, alpha: 0.3 + (i / (PALETTE.length - 1)) * 0.7 }
})

export function render(ctx, W, H, flowData, text, noiseColor, time) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, W, H)
  ctx.font = FONT
  ctx.textBaseline = 'top'

  const { lineYs, lineAngles, lineSkews, count } = flowData
  const maxCI = PALETTE_CSS.length - 1
  const tc = time * COLOR_SPEED

  // Measure char width once
  const cw = ctx.measureText('M').width
  const charsPerLine = Math.ceil(W / cw) + 5
  const textLen = text.length

  for (let i = 0; i < count; i++) {
    const y = lineYs[i]
    if (y < -20 || y > H + 20) continue

    const skew = lineSkews[i]

    // Color from noise at line center
    const cn = noiseColor.noise(W * 0.5 * COLOR_SCALE + tc, y * COLOR_SCALE + tc * 0.6)
    const ci = Math.max(0, Math.min(maxCI, ((cn + 1) * 0.5 * maxCI + 0.5) | 0))

    // Extract line of text
    const startIdx = (i * charsPerLine) % textLen
    let lineText
    if (startIdx + charsPerLine <= textLen) {
      lineText = text.slice(startIdx, startIdx + charsPerLine)
    } else {
      lineText = text.slice(startIdx) + text.slice(0, charsPerLine - (textLen - startIdx))
    }

    ctx.setTransform(1, 0, skew, 1, 4, y)
    ctx.globalAlpha = PALETTE_CSS[ci].alpha
    ctx.fillStyle = PALETTE_CSS[ci].color
    ctx.fillText(lineText, 0, 0)
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
}
