// Per-character particle flow field with ridge noise.
// Each particle has a small POSITION OFFSET based on its index,
// so nearby particles sample slightly different noise positions.
// This prevents all particles converging onto identical ridges.

import { getCharWidth } from './atlas.js'

// Ridge noise
const RIDGE_PERP_SCALE = 0.016
const RIDGE_PARA_SCALE = 0.004
const WIND_ANGLE = Math.PI * 0.12
const WIND_COS = Math.cos(WIND_ANGLE)
const WIND_SIN = Math.sin(WIND_ANGLE)
const WARP_SCALE = 0.003
const WARP_STRENGTH = 280

// Skew
const SKEW_SCALE = 0.003
const SKEW_STRENGTH = 1.5

// Particle motion
const PARTICLE_SPEED = 0.4
const ANGLE_SMOOTH = 0.07

// Per-particle noise offset to decorrelate neighbors
const OFFSET_STRENGTH = 60 // pixels of virtual offset per particle

// Grid-cached noise
const GRID_CELL = 48
let gridW = 0, gridH = 0
let angleGrid = null
let skewGrid = null

function ridgeAngle(noise, x, y, t) {
  const wx = noise.noise(x * WARP_SCALE + 3.1, y * WARP_SCALE + 7.4) * WARP_STRENGTH
  const wy = noise.noise(x * WARP_SCALE + 1.7, y * WARP_SCALE + 4.9) * WARP_STRENGTH
  const px = ((x + wx) * WIND_COS - (y + wy) * WIND_SIN) * RIDGE_PERP_SCALE
  const py = ((x + wx) * WIND_SIN + (y + wy) * WIND_COS) * RIDGE_PARA_SCALE
  const n1 = noise.noise(px + t * 0.02, py + t * 0.03)
  const n2 = noise.noise(px * 2.2 + 10 + t * 0.025, py * 2.2 + 10 + t * 0.04) * 0.4
  const ridge = 1.0 - Math.abs(n1 + n2)
  return WIND_ANGLE + (ridge - 0.5) * 1.4
}

function updateGrid(noiseFlow, noiseSkew, W, H, time) {
  gridW = Math.ceil(W / GRID_CELL) + 2
  gridH = Math.ceil(H / GRID_CELL) + 2
  const total = gridW * gridH
  if (!angleGrid || angleGrid.length < total) {
    angleGrid = new Float32Array(total)
    skewGrid = new Float32Array(total)
  }
  const tsk_x = time * 0.04
  const tsk_y = time * 0.06
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const idx = gy * gridW + gx
      const px = (gx - 1) * GRID_CELL
      const py = (gy - 1) * GRID_CELL
      angleGrid[idx] = ridgeAngle(noiseFlow, px, py, time)
      skewGrid[idx] = noiseSkew.noise(px * SKEW_SCALE + tsk_x, py * SKEW_SCALE + tsk_y) * SKEW_STRENGTH
    }
  }
}

function sampleGrid(grid, x, y) {
  const gx = (x / GRID_CELL) + 1
  const gy = (y / GRID_CELL) + 1
  const gx0 = Math.max(0, Math.min(gridW - 2, gx | 0))
  const gy0 = Math.max(0, Math.min(gridH - 2, gy | 0))
  const fx = gx - gx0
  const fy = gy - gy0
  const i00 = gy0 * gridW + gx0
  const top = grid[i00] + (grid[i00 + 1] - grid[i00]) * fx
  const bot = grid[i00 + gridW] + (grid[i00 + gridW + 1] - grid[i00 + gridW]) * fx
  return top + (bot - top) * fy
}

// Particle state
const MAX_CHARS = 10000
let particles = null
let offsets = null // per-particle noise lookup offset
let charIdxs = null
let totalChars = 0
let initialized = false

function initParticles(W, H, textLen) {
  const cw = getCharWidth()
  const spacing = 13 * 1.6
  const lineCount = Math.ceil((H + 100) / spacing)
  const colCount = Math.ceil((W + 80) / cw)
  totalChars = Math.min(lineCount * colCount, MAX_CHARS)

  particles = new Float32Array(totalChars * 4)
  offsets = new Float32Array(totalChars * 2)
  charIdxs = new Uint16Array(totalChars)

  // Simple hash for deterministic per-particle offsets
  let hash = 7
  let idx = 0
  let textIdx = 0
  for (let li = 0; li < lineCount && idx < totalChars; li++) {
    const baseY = -50 + li * spacing
    for (let ci = 0; ci < colCount && idx < totalChars; ci++) {
      const i4 = idx * 4
      particles[i4] = -20 + ci * cw
      particles[i4 + 1] = baseY
      particles[i4 + 2] = 0
      particles[i4 + 3] = 0

      // Deterministic pseudo-random offset per particle
      hash = (hash * 16807 + 1) & 0x7fffffff
      offsets[idx * 2] = ((hash & 0xffff) / 65536 - 0.5) * OFFSET_STRENGTH
      hash = (hash * 16807 + 1) & 0x7fffffff
      offsets[idx * 2 + 1] = ((hash & 0xffff) / 65536 - 0.5) * OFFSET_STRENGTH

      charIdxs[idx] = textIdx % textLen
      textIdx++
      idx++
    }
  }
  totalChars = idx
  initialized = true
}

export function updateFlowField(noiseFlow, noiseSkew, W, H, time, textLen) {
  if (!initialized) initParticles(W, H, textLen)

  updateGrid(noiseFlow, noiseSkew, W, H, time)

  for (let i = 0; i < totalChars; i++) {
    const i4 = i * 4
    let x = particles[i4]
    let y = particles[i4 + 1]
    let angle = particles[i4 + 2]

    // Sample grid at offset position — each particle sees a slightly different field
    const ox = x + offsets[i * 2]
    const oy = y + offsets[i * 2 + 1]
    const targetAngle = sampleGrid(angleGrid, ox, oy)
    angle += (targetAngle - angle) * ANGLE_SMOOTH
    particles[i4 + 2] = angle

    x += Math.cos(angle) * PARTICLE_SPEED
    y += Math.sin(angle) * PARTICLE_SPEED

    if (x > W + 40) x = -20
    if (x < -40) x = W + 20
    if (y > H + 40) y = -20
    if (y < -40) y = H + 20

    particles[i4] = x
    particles[i4 + 1] = y
    particles[i4 + 3] = sampleGrid(skewGrid, x, y)
  }

  return { particles, charIdxs, count: totalChars }
}

export function resetParticles() {
  initialized = false
}
