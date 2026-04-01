// Pre-rendered character atlas with multiple color variants.
// Each row is a different color from the active theme palette.
// drawImage from atlas is 3-8x faster than fillText.

import { theme } from './theme.js'

const FONT_SIZE = 13
const FONT = `${FONT_SIZE}px "Courier New",monospace`
const CELL_W = 10
const CELL_H = 16

let atlasCanvas = null
let charWidth = 0
let charIndexMap = null

export function getCharWidth() { return charWidth }
export function getCellW() { return CELL_W }
export function getCellH() { return CELL_H }
export function getAtlas() { return atlasCanvas }
export function getCharIndex() { return charIndexMap }
export function getColorCount() { return theme.palette.length }
export function getFont() { return FONT }

export function initAtlas() {
  const chars = []
  for (let i = 32; i < 127; i++) chars.push(String.fromCharCode(i))
  chars.push('\u2019', '\u2018')

  const cols = chars.length
  const rows = theme.palette.length

  atlasCanvas = document.createElement('canvas')
  atlasCanvas.width = cols * CELL_W
  atlasCanvas.height = rows * CELL_H

  const actx = atlasCanvas.getContext('2d')
  actx.font = FONT
  actx.textBaseline = 'top'

  charIndexMap = new Map()
  for (let ci = 0; ci < cols; ci++) {
    charIndexMap.set(chars[ci], ci)
  }

  for (let ri = 0; ri < rows; ri++) {
    actx.fillStyle = theme.palette[ri]
    for (let ci = 0; ci < cols; ci++) {
      actx.fillText(chars[ci], ci * CELL_W, ri * CELL_H + 1)
    }
  }

  charWidth = actx.measureText('M').width
}
