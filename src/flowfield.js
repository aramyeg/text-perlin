// Flow field: traces nearly-horizontal paths through a Perlin noise field.
// Paths curve gently. The dramatic visual effect comes from per-character
// SKEW (applied in the renderer), not from path curvature.
//
// Also outputs a skew value per character from a separate noise sample,
// so the renderer can lean characters toward noise hot spots.

import { getCharWidth } from './atlas.js'

const NOISE_SCALE = 0.003
const ANGLE_RANGE = Math.PI * 0.18 // ±16° — very gentle curves, minimal gaps
const SMOOTH = 0.05

// Skew noise: sampled at each character position, controls character lean
const SKEW_NOISE_SCALE = 0.0025
const SKEW_SPEED_X = 0.04
const SKEW_SPEED_Y = 0.06
const SKEW_STRENGTH = 1.2

const MAX_CHARS = 15000
const _xs = new Float32Array(MAX_CHARS)
const _ys = new Float32Array(MAX_CHARS)
const _angles = new Float32Array(MAX_CHARS)
const _skews = new Float32Array(MAX_CHARS)
const _charIdxs = new Uint16Array(MAX_CHARS)

function tracePath(noiseFlow, noiseSkew, startX, startY, initAngle, W, H, time, count, textIdx, textLen) {
  const cw = getCharWidth()
  let x = startX
  let y = startY
  let angle = initAngle
  const tsk_x = time * SKEW_SPEED_X
  const tsk_y = time * SKEW_SPEED_Y

  while (x < W + 40 && x > -40 && y > -30 && y < H + 30 && count < MAX_CHARS) {
    // Flow direction — gentle
    const n = noiseFlow.noise(
      x * NOISE_SCALE + time * 0.03,
      y * NOISE_SCALE + time * 0.04
    )
    const target = n * ANGLE_RANGE + initAngle * 0.15
    angle += (target - angle) * SMOOTH

    // Per-character skew from separate noise field
    const sk = noiseSkew.noise(
      x * SKEW_NOISE_SCALE + tsk_x,
      y * SKEW_NOISE_SCALE + tsk_y
    )

    _xs[count] = x
    _ys[count] = y
    _angles[count] = angle
    _skews[count] = sk * SKEW_STRENGTH
    _charIdxs[count] = textIdx % textLen
    textIdx++
    count++

    x += Math.cos(angle) * cw
    y += Math.sin(angle) * cw
  }

  return { count, textIdx }
}

export function traceFlowField(noiseFlow, noiseSkew, W, H, time, textLen) {
  const spacing = 13 * 1.15
  let count = 0
  let textIdx = 0

  // Left edge — primary flow
  let startY = -50
  while (startY < H + 70 && count < MAX_CHARS - 300) {
    const initAngle = noiseFlow.noise(startY * 0.01 + time * 0.02, time * 0.015) * 0.1
    const result = tracePath(noiseFlow, noiseSkew, -5, startY, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += spacing
  }

  // Top edge — sparse downward
  let startX = 100
  while (startX < W - 100 && count < MAX_CHARS - 300) {
    const initAngle = Math.PI * 0.12 + noiseFlow.noise(startX * 0.005 + time * 0.02, time * 0.018) * 0.15
    const result = tracePath(noiseFlow, noiseSkew, startX, -10, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startX += spacing * 10
  }

  return { count, xs: _xs, ys: _ys, angles: _angles, skews: _skews, charIdxs: _charIdxs }
}
