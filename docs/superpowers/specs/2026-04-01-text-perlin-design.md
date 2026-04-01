# Text-Perlin: Dune Sea of Letters

## Vision

A single full-screen generative art piece. The entire viewport is densely filled with monospace text from Frank Herbert's Dune. Three independent Perlin noise fields animate over the text, creating an organic, breathing desert landscape made entirely of letters.

The primary showcase is **Pretext's per-frame variable-width reflow** — something no DOM-based layout can achieve at 60fps. Each line is re-laid-out every frame with a noise-driven `maxWidth`, making the text body itself reshape like sand dunes reforming in wind.

Deployed as a static site to GitHub Pages.

## Architecture

```
text-perlin/
  package.json
  vite.config.js
  index.html                ← minimal HTML shell (canvas + script)
  src/
    main.js                 ← bootstrap, resize handler, animation loop
    perlin.js               ← seeded 2D Perlin noise class
    palette.js              ← pre-baked 256-entry color LUT
    layout.js               ← Pretext wrapper: per-frame variable-width reflow
    renderer.js             ← canvas segment drawing with color + skew
    text.js                 ← Dune passage text constant
    # cursor.js             ← mouse glow dot (future, not in v1)
```

## Dependencies

- **@chenglou/pretext** — text measurement and line breaking
- **vite** — dev server and production build

No other runtime dependencies.

## Three Noise Fields

Each uses a separate seeded Perlin instance so patterns don't correlate.

### 1. Width Noise (Pretext Showcase)

- Controls `maxWidth` passed to `layoutNextLine` per line, per frame
- `maxWidth = baseWidth + widthNoise(lineY, time) * swingAmount`
- Swing: approximately +/-300px from viewport width
- Creates an undulating right edge — the text body's silhouette is organic
- Left margin also shifts slightly via noise for a flowing left edge
- Speed: slow (~0.05 time multiplier)
- Scale: ~0.006 spatial frequency (large flowing features)

### 2. Color/Brightness Noise

- Sampled at each segment's center (cx, cy)
- Maps to a pre-baked 256-entry LUT: dark brown (#15100a) through ochre to warm gold (#fffae0)
- Also controls opacity (dim regions: ~0.25, bright: 1.0)
- Speed: moderate (~0.08 time multiplier)
- Scale: ~0.012 spatial (medium-sized bands)

### 3. Skew/Lean Noise

- Sampled at each segment's center
- Maps to `skewX` value in `setTransform` call
- Strength: 0.5-0.7 — very visible lean
- Creates flowing bands of italic-leaning text through upright text
- Speed: different from color (~0.06 time multiplier)
- Scale: ~0.009 spatial

## Rendering Pipeline (per frame)

1. **Layout phase** (~0.02ms): Call `layoutNextLine` ~50-60 times with noise-driven `maxWidth` per line. Each line also gets a noise-driven left margin offset.

2. **Segment split**: Each line's text is split into ~8 equal monospace chunks. Segment center coordinates computed from char width.

3. **Noise sampling**: For each segment, sample color noise and skew noise at its center. Two noise lookups per segment, ~400 segments total.

4. **Draw**: `ctx.setTransform(dpr, 0, skewX * dpr, dpr, tx, ty)` positions and skews in one call. `ctx.fillStyle` from LUT, `ctx.globalAlpha` from noise. One `fillText` per segment.

## Performance Budget

```
Clear canvas:           ~0.3ms
Layout (60 lines):      ~0.02ms  (Pretext's arithmetic reflow)
Noise (800 samples):    ~0.5ms   (single octave, inline)
fillText (400 calls):   ~5.0ms
────────────────────────────────
Total:                  ~5.8ms   (well within 16.6ms)
```

## Performance Rules

- `setTransform` instead of save/restore (no stack overhead)
- Pre-baked 256-entry color string array at init (no string concat in loop)
- Single `measureText` call ever (monospace font)
- Perlin: inline implementation, pre-computed gradients as Float32Arrays, single octave (no FBM)
- Noise sampled once per segment center, not per character
- No mouse interaction (cursor effect deferred to v2)

## Visual Style

- Background: #0d0906 (near-black warm brown)
- Font: 13px Courier New, monospace
- Line height: 1.5x font size (~19.5px)
- Palette: dark brown -> ochre -> warm sand -> gold -> cream (#fffae0)
- Animation: slow, organic, breathing — not jittery
- Text fills entire viewport edge to edge, no empty gaps (except where width noise creates organic right-edge contour)

## What NOT To Do

- No vertical displacement of lines (no ocean waves)
- No per-character rendering (too slow)
- No save/restore (use setTransform)
- No FBM (single octave Perlin is enough)
- No mouse/cursor interaction (deferred to v2)
- No external noise library
