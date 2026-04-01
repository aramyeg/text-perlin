// Flow field: traces curved paths through a Perlin noise field.
// Characters placed along paths, following the curve tangent.
//
// Paths start from left edge, top edge, and right edge to create
// diverse flow directions. Starting angle varies per path based on
// noise at the start position.

import { getCharWidth } from './atlas.js'

const NOISE_SCALE = 0.003
const ANGLE_RANGE = Math.PI * 0.45
const SMOOTH = 0.12

const MAX_CHARS = 15000
const _xs = new Float32Array(MAX_CHARS)
const _ys = new Float32Array(MAX_CHARS)
const _angles = new Float32Array(MAX_CHARS)
const _charIdxs = new Uint16Array(MAX_CHARS)

function tracePath(noise, startX, startY, initAngle, W, H, time, count, textIdx, textLen) {
  const cw = getCharWidth()
  let x = startX
  let y = startY
  let angle = initAngle

  while (x < W + 40 && x > -40 && y > -30 && y < H + 30 && count < MAX_CHARS) {
    const n = noise.noise(
      x * NOISE_SCALE + time * 0.03,
      y * NOISE_SCALE + time * 0.04
    )
    const target = n * ANGLE_RANGE + initAngle * 0.3
    angle += (target - angle) * SMOOTH

    _xs[count] = x
    _ys[count] = y
    _angles[count] = angle
    _charIdxs[count] = textIdx % textLen
    textIdx++
    count++

    x += Math.cos(angle) * cw
    y += Math.sin(angle) * cw
  }

  return { count, textIdx }
}

export function traceFlowField(noise, W, H, time, textLen) {
  const spacing = 13 * 1.15
  let count = 0
  let textIdx = 0

  // Left edge paths — primary, flowing rightward with noise-varied angles
  let startY = -40
  while (startY < H + 60 && count < MAX_CHARS - 300) {
    // Vary starting angle per path using noise at the start position
    const initAngle = noise.noise(startY * 0.01 + time * 0.02, time * 0.015) * 0.3
    const result = tracePath(noise, -5, startY, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += spacing
  }

  // Top edge paths — flowing downward-ish, creates crossing patterns
  let startX = 50
  while (startX < W - 50 && count < MAX_CHARS - 300) {
    const initAngle = Math.PI * 0.3 + noise.noise(startX * 0.008 + time * 0.02, time * 0.018) * 0.4
    const result = tracePath(noise, startX, -10, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startX += spacing * 6
  }

  // Right edge paths — flowing leftward, counter-current
  startY = 100
  while (startY < H - 100 && count < MAX_CHARS - 300) {
    const initAngle = Math.PI + noise.noise(startY * 0.01 + time * 0.02, 50 + time * 0.015) * 0.4
    const result = tracePath(noise, W + 5, startY, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += spacing * 5
  }

  return { count, xs: _xs, ys: _ys, angles: _angles, charIdxs: _charIdxs }
}
