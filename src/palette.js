// Pre-baked 256-entry color LUT and alpha values.
// Built once at init — zero string concatenation in the render loop.

const STOPS = [
  [0.00, 21, 16, 10],   // #15100a deep dark brown
  [0.15, 61, 40, 16],   // #3d2810
  [0.30, 107, 68, 32],  // #6b4420
  [0.45, 160, 112, 48], // #a07030
  [0.60, 200, 152, 72], // #c89848
  [0.75, 224, 192, 112],// #e0c070
  [0.90, 240, 221, 160],// #f0dda0
  [1.00, 255, 250, 224] // #fffae0 warm gold
]

export const COLORS = new Array(256)
export const ALPHAS = new Float32Array(256)

for (let i = 0; i < 256; i++) {
  const t = i / 255
  let s = 0
  while (s < STOPS.length - 1 && STOPS[s + 1][0] < t) s++

  const [ap, ar, ag, ab] = STOPS[s]
  const [bp, br, bg, bb] = STOPS[Math.min(s + 1, STOPS.length - 1)]
  const f = bp > ap ? (t - ap) / (bp - ap) : 0

  const r = ar + (br - ar) * f | 0
  const g = ag + (bg - ag) * f | 0
  const b = ab + (bb - ab) * f | 0

  COLORS[i] = `rgb(${r},${g},${b})`
  ALPHAS[i] = 0.2 + t * 0.8
}
