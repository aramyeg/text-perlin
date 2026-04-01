// Theme configuration: dark (default), light (sand), sky (clouds).

const DARK = {
  background: '#0d0906',
  palette: [
    '#1a120a', '#3d2810', '#6b4420', '#a07030',
    '#c89848', '#e0c070', '#f0dda0', '#fffae0'
  ]
}

const LIGHT = {
  background: '#f0e6d0',
  palette: [
    '#0a0806', '#1c1610', '#2e251a', '#4a3d2a',
    '#6b5a3e', '#8a7554', '#a8926e', '#c4ad8a'
  ]
}

const SKY = {
  background: '#1a3a5c',
  palette: [
    '#1e3f63', '#24486e', '#2d5a82', '#3a7099',
    '#5a9ab8', '#8ec0d8', '#c4dfe9', '#f0f6fa'
  ]
}

const THEMES = { dark: DARK, light: LIGHT, sky: SKY }

const params = new URLSearchParams(location.search)
const themeName = params.get('theme') || 'dark'

export const theme = THEMES[themeName] || DARK
