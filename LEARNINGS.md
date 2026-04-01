# Text-Perlin: Project Learnings & Knowledge Base

## What This Project Is

Generative art piece: 16K characters of Frank Herbert's Dune text flowing through animated Perlin noise ridge patterns. Per-character rotation, skew, and atlas-based color mapping create a "sea of letters" that resembles sand dunes. Uses `@chenglou/pretext` for word-wrapped text layout.

**Best version: `v3-skew-chars` branch** (merged to `main`) — runs beautifully on Mac at 60fps.
**Live demo**: https://aramyeg.github.io/text-perlin/

---

## The Cross-Platform Problem

### Canvas 2D Performance Gap: Mac vs Windows

The project renders 16K characters per frame, each with `setTransform()` + `drawImage()` from an atlas.

| Platform | Rendering Pipeline | Per-call cost | 16K chars | FPS |
|----------|-------------------|---------------|-----------|-----|
| **Mac** | Skia Graphite → Metal → GPU | ~0.3µs | ~5ms | **60** |
| **Windows** | Skia Ganesh → OpenGL ES → ANGLE → D3D11 → GPU | ~7µs | ~112ms | **9** |

### Why 20x, Not 20-50%?

The commonly cited 20-50% Metal vs ANGLE difference is for general workloads. Our 20x gap compounds from multiple factors:

| Factor | Multiplier |
|--------|-----------|
| DPR particle count (Mac Retina creates ~10K particles vs Windows DPR=1 ~16K) | 1.6x |
| Per-call ANGLE translation overhead | ~3-5x |
| Batch flushing on each setTransform (Metal batches, ANGLE flushes) | ~2-3x |
| **Combined** | **~10-24x** |

---

## What We Tried & Results

### 1. WebGL2 Instanced Rendering ❌ (Performance win, quality loss)

Replaced Canvas 2D with WebGL2. Pre-rendered character atlas as texture, instanced rendering for all 16K quads in a single `drawArraysInstanced` call.

- FPS: 9 → ~37-40fps (4x improvement)
- Lost native text rendering quality (ClearType, subpixel AA)
- Characters blurry/pixelated compared to Canvas 2D
- Tried 2x/4x supersampled atlas — LINEAR filtering too slow, NEAREST too blocky
- Moved noise to GPU (GLSL simplex in vertex shader) — freed CPU, GPU was already bottleneck

### 2. Cursor Wind Interaction ❌ (Didn't work on Windows)

Mouse velocity creates local wind force bending flow field angles toward cursor direction. The base animation was too slow on Windows to notice. Removed.

### 3. v1-left-flow with Ridge Noise ⚠️ (Beautiful but slow)

Kept v1's line-tracing approach with v3's ridge noise. Paths from left + top edges for coverage.

- Visually the best — readable text flowing through dramatic golden ridge convergence lines
- ~12fps on Windows (ridge noise = 4 noise calls per character per frame)
- Grid caching helped noise but Canvas 2D draw calls still dominated

### 4. Line-Based Vertical Warping ❌ (60fps but visually weak)

Drew whole lines with `fillText` (~60-80 calls instead of 16K). Noise field warps vertical spacing.

- 42-61 FPS on Windows
- Visual effect too subtle — looked like text with uneven spacing
- Increasing warp made it look broken, not beautiful
- The magic IS the per-character particle movement; removing it removes the soul

### 5. Chrome Flags Research

- `--enable-skia-graphite`: Experimental on Windows, could fix Canvas 2D perf but not viable for public deployment
- `--use-angle=vulkan`: Doesn't integrate with Windows compositor
- Proposed `drawImageBatch` API: Would help 3-5x but not shipped in any browser
- `OffscreenCanvas`, `createImageBitmap`, `willReadFrequently`: No meaningful improvement

---

## Architecture Notes

### Key Files (v3-skew-chars / main)

- **`perlin.js`** — Seeded 2D Perlin noise, single octave, pre-computed gradients (Float32Array)
- **`flowfield.js`** — Ridge noise (domain-warped dual-octave), grid-cached at 48px cells, amplitude breathing cycle (60s triangle wave), per-particle offsets to prevent convergence
- **`atlas.js`** — Pre-rendered character atlas: 97 ASCII chars × 8 color variants, `drawImage` from atlas 3-8x faster than `fillText`
- **`renderer.js`** — Per-character `setTransform(cos, sin, -sin+skew, cos, x, y)` + `drawImage` from atlas
- **`layout.js`** — Pretext `prepareWithSegments` + `layoutNextLine` for word-wrapped text
- **`theme.js`** — Dark/Light/Sky color themes via URL param `?theme=`

### Branches

- **`main`** — deployed version (merged from v3-skew-chars)
- **`v1-left-flow`** — Line-tracing from left edge, simpler flow, uses pretext more directly
- **`v2-refined`** — Intermediate refinement
- **`v3-skew-chars`** — Per-character particles with ridge noise, skew, breathing amplitude

---

## Ideas for Future Exploration

### Variable Typographic ASCII (from chenglou.me/pretext/variable-typographic-ascii/)

Chenglou's demo maps a particle brightness field to ASCII characters selected by both **brightness AND proportional width**. Key technique:

**Palette construction**: Render each ASCII char at 3 font weights (300/500/800) × normal/italic. Measure each variant's brightness (pixel alpha sum from canvas `getImageData`) and width (via `prepareWithSegments(ch, font).widths[0]`). Produces ~300+ palette entries.

**Character selection**: For each cell in the brightness field, find the character that minimizes a combined score:
```
score = |brightness_error| * 2.5 + |width_error / target_width|
```
Width penalty keeps proportional text coherent — you can't just pick "M" for bright and "." for dark because their widths differ.

**How it could apply to text-perlin**:
- Map noise ridge intensity to character density/weight — ridge zones get heavy chars (M, W, #, @), valleys get light chars (., :, `)
- Use pretext to ensure proportional spacing stays correct
- Dune text readable in mid-intensity zones, fades to dots in valleys, becomes dense blocks in ridges
- This would be a genuine showcase of pretext's measurement capabilities

**Challenges**:
- The demo uses DOM rendering (spans with CSS weight classes), ~1,500 cells — much lighter than our 16K
- Would need a different rendering strategy — possibly hybrid: DOM for text, canvas for the brightness field
- Or: reduce grid to ~2000 cells at larger font size, use DOM rendering for 60fps everywhere (no Canvas 2D bottleneck at all)

### Other Unexplored Ideas

1. **Hybrid renderer**: Render text lines to offscreen Canvas 2D strips, composite via WebGL transforms. ~60 WebGL calls, keeping Canvas 2D text quality.

2. **Reduced count + larger font**: 4K chars at larger size could hit ~35fps on Windows while still looking expressive.

3. **Video recording**: Record Mac version at 60fps, embed as looping video for cross-platform display.

4. **Mouse interaction**: Cursor wind, glow, repulsion field, wake trail — all implemented then removed due to Windows perf.

5. **DOM-based approach**: Fewer cells at larger size, CSS transforms for animation. Chrome compositor handles transformed layers efficiently. Could bypass Canvas 2D entirely.

---

## Key Takeaway

The 20x Canvas 2D performance gap between Mac and Windows is architectural (Skia Graphite + Metal vs Skia Ganesh + ANGLE + D3D11), compounded by DPR differences and batch flushing. No JavaScript optimization fixes per-call driver overhead. The fix is either wait for Skia Graphite on Windows, use WebGL (losing text quality), or reduce draw call count (losing per-character animation).

For this project, the per-character particle animation IS the visual identity. Deploy as-is, accept it's a Mac-first experience until Chrome's Windows rendering catches up.
