import { Perlin } from './perlin.js'
import { initAtlas } from './atlas.js'
import { init as initLayout, getWrappedText } from './layout.js'
import { traceFlowField } from './flowfield.js'
import { render } from './renderer.js'

const noiseFlow = new Perlin(42)
const noiseSkew = new Perlin(7)
const noiseColor = new Perlin(137)

const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')

let W = 0
let H = 0

function resize() {
  W = innerWidth
  H = innerHeight
  canvas.width = W
  canvas.height = H
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
}

addEventListener('resize', resize)
resize()

initAtlas()
initLayout(ctx)

function frame(ts) {
  requestAnimationFrame(frame)
  const t = ts * 0.001
  const text = getWrappedText(W, H)
  const flowData = traceFlowField(noiseFlow, noiseSkew, W, H, t, text.length)
  render(ctx, W, H, flowData, text, noiseColor, t)
}

requestAnimationFrame(frame)
