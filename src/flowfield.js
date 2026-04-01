// Flow field: traces curved paths through a Perlin noise field.
// Characters placed along paths, following the curve tangent.
//
// Paths primarily from left edge with some top/right variety.
// Angle heavily smoothed to prevent sudden direction jumps.
// Reduced angle range keeps paths closer to horizontal,
// minimizing negative space while still showing organic curves.

import { getCharWidth } from './atlas.js'

const NOISE_SCALE = 0.003
const ANGLE_RANGE = Math.PI * 0.3 // ±27° — gentler curves, less negative space
const SMOOTH = 0.06 // very heavy smoothing — no sudden jumps

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
    // Blend toward initAngle to keep paths from straying too far
    const target = n * ANGLE_RANGE + initAngle * 0.2
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
  const spacing = 13 * 1.25
  let count = 0
  let textIdx = 0

  // Left edge paths — primary, tightly packed
  let startY = -50
  while (startY < H + 70 && count < MAX_CHARS - 300) {
    const initAngle = noise.noise(startY * 0.01 + time * 0.02, time * 0.015) * 0.15
    const result = tracePath(noise, -5, startY, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += spacing
  }

  // Top edge paths — sparse, gentle downward angle
  let startX = 80
  while (startX < W - 80 && count < MAX_CHARS - 300) {
    const initAngle = Math.PI * 0.15 + noise.noise(startX * 0.006 + time * 0.02, time * 0.018) * 0.2
    const result = tracePath(noise, startX, -10, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startX += spacing * 8
  }

  // Right edge paths — very sparse counter-flow
  startY = 150
  while (startY < H - 150 && count < MAX_CHARS - 300) {
    const initAngle = Math.PI - noise.noise(startY * 0.008 + time * 0.02, 50 + time * 0.015) * 0.2
    const result = tracePath(noise, W + 5, startY, initAngle, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += spacing * 7
  }

  return { count, xs: _xs, ys: _ys, angles: _angles, charIdxs: _charIdxs }
}
