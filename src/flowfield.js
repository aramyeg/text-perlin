// Flow field with PERSISTENT LINE LEADERS and ridge noise for dune patterns.
// Each line has a "leader" particle that moves through the flow field.
// The line is drawn starting at the leader's position, following the
// local flow field angle. Leader positions persist across frames = smooth.
//
// Ridge noise (1 - abs(noise)) creates dense parallel dune ridges.
// Domain warping adds organic irregularity.

import { getCharWidth } from './atlas.js'

// Ridge noise parameters
const RIDGE_PERP_SCALE = 0.016
const RIDGE_PARA_SCALE = 0.004
const WIND_ANGLE = Math.PI * 0.12
const WIND_COS = Math.cos(WIND_ANGLE)
const WIND_SIN = Math.sin(WIND_ANGLE)
const WARP_SCALE = 0.0025
const WARP_STRENGTH = 180

// Leader motion
const LEADER_SPEED = 0.3
const ANGLE_SMOOTH = 0.06

// Skew per line
const SKEW_STRENGTH = 1.6

// Line layout
const LINE_SPACING = 13 * 1.2
const MARGIN = 4

let leaders = null // Float32Array: [x, y, angle] per line
let lineCount = 0
let initialized = false

function ridgeAngle(noise, x, y, t) {
  const wx = noise.noise(x * WARP_SCALE + 3.1, y * WARP_SCALE + 7.4) * WARP_STRENGTH
  const wy = noise.noise(x * WARP_SCALE + 1.7, y * WARP_SCALE + 4.9) * WARP_STRENGTH
  const px = ((x + wx) * WIND_COS - (y + wy) * WIND_SIN) * RIDGE_PERP_SCALE
  const py = ((x + wx) * WIND_SIN + (y + wy) * WIND_COS) * RIDGE_PARA_SCALE
  const n = noise.noise(px + t * 0.006, py + t * 0.01)
  const ridge = 1.0 - Math.abs(n)
  return WIND_ANGLE + (ridge - 0.5) * 1.0
}

function initLeaders(H) {
  lineCount = Math.ceil((H + 100) / LINE_SPACING)
  leaders = new Float32Array(lineCount * 3)
  for (let i = 0; i < lineCount; i++) {
    const i3 = i * 3
    leaders[i3] = MARGIN       // x: start at left edge
    leaders[i3 + 1] = -50 + i * LINE_SPACING // y
    leaders[i3 + 2] = 0        // angle
  }
  initialized = true
}

// Output: per-line data for renderer
const MAX_LINES = 100
const lineYs = new Float32Array(MAX_LINES)
const lineAngles = new Float32Array(MAX_LINES)
const lineSkews = new Float32Array(MAX_LINES)

export function updateFlowField(noiseFlow, noiseSkew, W, H, time) {
  if (!initialized) initLeaders(H)

  const tsk = time * 0.05

  for (let i = 0; i < lineCount; i++) {
    const i3 = i * 3
    let x = leaders[i3]
    let y = leaders[i3 + 1]
    let angle = leaders[i3 + 2]

    // Update leader angle from ridge flow field
    const targetAngle = ridgeAngle(noiseFlow, x, y, time)
    angle += (targetAngle - angle) * ANGLE_SMOOTH
    leaders[i3 + 2] = angle

    // Nudge leader position
    x += Math.cos(angle) * LEADER_SPEED
    y += Math.sin(angle) * LEADER_SPEED

    // Wrap vertically
    if (y > H + 50) y -= H + 100
    if (y < -50) y += H + 100

    leaders[i3] = MARGIN // x stays at left margin (lines always start left)
    leaders[i3 + 1] = y

    // Output for renderer
    lineYs[i] = y
    lineAngles[i] = angle

    // Skew from separate noise
    const sk = noiseSkew.noise(y * 0.005 + tsk, time * 0.04)
    lineSkews[i] = sk * SKEW_STRENGTH
  }

  return { lineYs, lineAngles, lineSkews, count: lineCount }
}

export function resetLeaders() {
  initialized = false
}
