// Seeded 2D Perlin noise with pre-computed gradient vectors.
// Single octave only — no FBM. Fast enough for ~800 samples/frame.

export class Perlin {
  constructor(seed) {
    const p = this.p = new Uint8Array(512)
    const gx = this.gx = new Float32Array(512)
    const gy = this.gy = new Float32Array(512)

    // Build permutation table via Fisher-Yates with deterministic seed
    const perm = new Uint8Array(256)
    for (let i = 0; i < 256; i++) perm[i] = i

    let s = seed
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647
      const j = s % (i + 1)
      const tmp = perm[i]
      perm[i] = perm[j]
      perm[j] = tmp
    }

    // Double table + pre-compute gradient unit vectors
    for (let i = 0; i < 512; i++) {
      p[i] = perm[i & 255]
      const angle = (p[i] / 256) * 6.283185307
      gx[i] = Math.cos(angle)
      gy[i] = Math.sin(angle)
    }
  }

  // Returns approximately [-1, 1]
  noise(x, y) {
    const { p, gx, gy } = this
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    // Fade curves
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)

    // Hash corners
    const aa = p[p[xi] + yi]
    const ba = p[p[xi + 1] + yi]
    const ab = p[p[xi] + yi + 1]
    const bb = p[p[xi + 1] + yi + 1]

    // Dot products with distance vectors
    const x1 = xf - 1
    const y1 = yf - 1
    const n00 = gx[aa] * xf + gy[aa] * yf
    const n10 = gx[ba] * x1 + gy[ba] * yf
    const n01 = gx[ab] * xf + gy[ab] * y1
    const n11 = gx[bb] * x1 + gy[bb] * y1

    // Bilinear interpolation
    const nx0 = n00 + u * (n10 - n00)
    const nx1 = n01 + u * (n11 - n01)
    return nx0 + v * (nx1 - nx0)
  }
}
