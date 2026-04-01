// Flow field: traces curved paths through a Perlin noise field.
// Characters placed along paths, following the curve tangent.
//
// All paths start from the left edge, creating a unified flow
// where lines converge into bright dune ridges and spread in valleys.

import { getCharWidth } from './atlas.js'

const NOISE_SCALE = 0.003
const ANGLE_RANGE = Math.PI * 0.45
const SMOOTH = 0.12

const MAX_CHARS = 15000
const _xs = new Float32Array(MAX_CHARS)
const _ys = new Float32Array(MAX_CHARS)
const _angles = new Float32Array(MAX_CHARS)
const _charIdxs = new Uint16Array(MAX_CHARS)

function tracePath(noise, startX, startY, W, H, time, count, textIdx, textLen) {
  const cw = getCharWidth()
  let x = startX
  let y = startY
  let angle = 0

  while (x < W + 40 && x > -40 && y > -30 && y < H + 30 && count < MAX_CHARS) {
    const n = noise.noise(
      x * NOISE_SCALE + time * 0.07,
      y * NOISE_SCALE + time * 0.11
    )
    const target = n * ANGLE_RANGE
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
  const lineSpacing = 13 * 1.1
  let count = 0
  let textIdx = 0

  let startY = -40
  while (startY < H + 60 && count < MAX_CHARS - 300) {
    const result = tracePath(noise, -5, startY, W, H, time, count, textIdx, textLen)
    count = result.count
    textIdx = result.textIdx
    startY += lineSpacing
  }

  return { count, xs: _xs, ys: _ys, angles: _angles, charIdxs: _charIdxs }
}
