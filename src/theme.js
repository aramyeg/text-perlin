// Theme configuration: dark (default) and light (inverted sand).

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

const params = new URLSearchParams(location.search)
const themeName = params.get('theme') || 'dark'

export const theme = themeName === 'light' ? LIGHT : DARK
