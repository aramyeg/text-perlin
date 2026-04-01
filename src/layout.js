// Pretext layout: provides word-wrapped text content.
// The flow field renderer decomposes this into individual characters
// placed along curved paths.

import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import { TEXT } from './text.js'

const FONT = '13px "Courier New",monospace'
let prepared = null

export function init(ctx) {
  ctx.font = FONT
  prepared = prepareWithSegments(TEXT, FONT)
}

// Get a flat string of word-wrapped text that fills the viewport.
// Pretext handles proper word-breaking so text reads naturally
// even when curved along flow field paths.
let cachedText = ''
let cachedW = 0
let cachedH = 0

export function getWrappedText(W, H) {
  if (cachedText && W === cachedW && H === cachedH) return cachedText

  cachedW = W
  cachedH = H

  const lines = []
  let cursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = 0
  const lineHeight = 13 * 1.5
  const maxW = W - 8

  // Generate enough text for the flow field to consume
  // (flow paths may use more or fewer chars than simple line layout)
  while (y < H * 3) {
    const line = layoutNextLine(prepared, cursor, maxW)
    if (!line) {
      cursor = { segmentIndex: 0, graphemeIndex: 0 }
      continue
    }
    if (line.text.length > 0) {
      lines.push(line.text)
    }
    cursor = line.end
    y += lineHeight
  }

  cachedText = lines.join(' ')
  return cachedText
}
