// Generates the built-in "designer" piece sets: 8 shape families × a few
// color treatments each = 30 sets, written as src/pieces/<id>/{w,b}{KQRBNP}.svg
// (the same folder convention Board.jsx globs at build time).
//
//   node scripts/gen-piece-sets.mjs [--preview out.html]
//
// Rerun after editing a family's geometry; the files are committed so the
// build stays plain. --preview also writes a contact sheet for eyeballing.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pieces')

// ---- palettes: [pieceFill, pieceStroke] for white and black, + accent ----
export const PALETTES = {
  classic: { w: ['#f9f9f9', '#3a3a3a'], b: ['#3b3b3b', '#111111'], acc: '#b58863' },
  walnut: { w: ['#f3e7cf', '#8a6a3e'], b: ['#5a3a26', '#2e1c12'], acc: '#c98a4b' },
  obsidian: { w: ['#ecd9a0', '#a8862e'], b: ['#1b1815', '#000000'], acc: '#e0ae4e' },
  midnight: { w: ['#dbe7f7', '#5b79a8'], b: ['#1d3356', '#0d1a30'], acc: '#6f9bd8' },
  ink: { w: ['#f5f2ec', '#171512'], b: ['#171512', '#f5f2ec'], acc: '#8a8478' },
  copper: { w: ['#f4dfc6', '#b07a42'], b: ['#6e3f1e', '#3c1f0c'], acc: '#d08a4e' },
  frost: { w: ['#eff7fb', '#7fb2c9'], b: ['#2f5d75', '#16303e'], acc: '#79c0dd' },
  forest: { w: ['#e9efdb', '#77925d'], b: ['#2c452a', '#152414'], acc: '#7fae62' },
  rose: { w: ['#fbeaf1', '#c77f9f'], b: ['#7c2f52', '#45152c'], acc: '#d76f9e' },
  mint: { w: ['#e2f5e8', '#6fae8c'], b: ['#2f6d4c', '#153826'], acc: '#6fbf8f' },
  honey: { w: ['#f9ecc4', '#c09a3e'], b: ['#7a5a1e', '#453006'], acc: '#d9a441' },
  marble: { w: ['#f2f0ea', '#9aa0a6'], b: ['#4a5058', '#23262b'], acc: '#7f8790' },
  slate: { w: ['#e8eaee', '#8b93a1'], b: ['#3b414c', '#1c2027'], acc: '#98a2b3' },
  crimson: { w: ['#f7e3e3', '#b06a6a'], b: ['#611c22', '#37080c'], acc: '#c04a52' },
  lime: { w: ['#f2fbe6', '#8fb84e'], b: ['#24310f', '#101704'], acc: '#a4e04a' },
  storm: { w: ['#d9dee6', '#7387a0'], b: ['#2e3947', '#161c24'], acc: '#8fa1b8' },
  plum: { w: ['#ead9f2', '#9a6fc0'], b: ['#4a2f66', '#291540'], acc: '#b58fd8' },
  teal: { w: ['#d8efec', '#4f9c93'], b: ['#1f5c55', '#0c2f2b'], acc: '#5fa89f' },
}

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">${inner}</svg>`
const g = (fill, stroke, sw, inner) =>
  `<g fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`

// Shared staunton geometry (used solid by `staunton`, hollow by `outline`).
const BASE = '<rect x="12.5" y="33.5" width="20" height="5" rx="2"/>'
const ST = {
  P: `<circle cx="22.5" cy="13.5" r="4.6"/><path d="M22.5 18 C18.6 19.6 16.9 23.5 18.3 27.5 C16 29 14.8 31.3 14.6 34 L30.4 34 C30.2 31.3 29 29 26.7 27.5 C28.1 23.5 26.4 19.6 22.5 18 Z"/>${BASE}`,
  R: `<path d="M14 34 L14 19 L12.5 19 L12.5 11.5 L17 11.5 L17 14.5 L20.5 14.5 L20.5 11.5 L24.5 11.5 L24.5 14.5 L28 14.5 L28 11.5 L32.5 11.5 L32.5 19 L31 19 L31 34 Z"/>${BASE}`,
  B: `<circle cx="22.5" cy="8.2" r="2.1"/><path d="M22.5 11.5 C27.5 15 30 19.6 30 24 C30 28.6 27 31.6 22.5 32.3 C18 31.6 15 28.6 15 24 C15 19.6 17.5 15 22.5 11.5 Z"/>${BASE}<path d="M22.5 16.5 L22.5 24.5 M19.3 20.5 L25.7 20.5" fill="none" stroke="ACC" stroke-width="1.5"/>`,
  N: `<path d="M13.5 34 L13.5 31 C13.5 29 14.5 27.5 16.5 26.5 C14 26 12 24 11.5 21.5 L11 18.6 L14.6 19.8 C15.2 16.8 17.1 14.4 20 13.3 L19.6 9.2 L22.4 12.5 C22.9 12.4 23.4 12.4 24 12.5 L26.8 9.6 L26.6 13.7 C30.8 15.7 33.3 20.3 33.6 26.5 L33.9 34 Z"/>${BASE}<circle cx="20.7" cy="16.8" r="1.1" fill="ACC" stroke="none"/>`,
  Q: `<path d="M13.6 34 L10.8 14.5 L16.9 20.5 L19.9 11.5 L22.5 18.5 L25.1 11.5 L28.1 20.5 L34.2 14.5 L31.4 34 Z"/><circle cx="10.8" cy="12.2" r="1.7"/><circle cx="19.9" cy="9.2" r="1.7"/><circle cx="25.1" cy="9.2" r="1.7"/><circle cx="34.2" cy="12.2" r="1.7"/>${BASE}`,
  K: `<path d="M21.3 4.5 L23.7 4.5 L23.7 7.8 L27 7.8 L27 10.2 L23.7 10.2 L23.7 13.5 L21.3 13.5 L21.3 10.2 L18 10.2 L18 7.8 L21.3 7.8 Z"/><path d="M22.5 14.5 C16 14.5 12.3 19 12.9 24.3 C13.4 28.8 16.6 32.3 21 33.2 L14.5 34 L30.5 34 L24 33.2 C28.4 32.3 31.6 28.8 32.1 24.3 C32.7 19 29 14.5 22.5 14.5 Z"/>${BASE}<circle cx="22.5" cy="24" r="1.6" fill="ACC" stroke="none"/>`,
}

const PR = {
  P: `<circle cx="22.5" cy="16" r="4.8"/><path d="M13.5 34 L22.5 21.5 L31.5 34 Z"/>`,
  R: `<path d="M13.5 34 L13.5 12.5 L18.3 12.5 L18.3 16.5 L20.9 16.5 L20.9 12.5 L24.1 12.5 L24.1 16.5 L26.7 16.5 L26.7 12.5 L31.5 12.5 L31.5 34 Z"/>`,
  B: `<circle cx="22.5" cy="8" r="2.2"/><path d="M22.5 12.5 L31.5 34 L13.5 34 Z"/>`,
  N: `<path d="M13.5 34 L13.5 21 L26 10.5 L31.5 16 L24.5 22 L31.5 22 L31.5 34 Z"/><circle cx="25.8" cy="15.6" r="1.2" fill="ACC" stroke="none"/>`,
  Q: `<path d="M13.5 34 L12 13.5 L18.5 21 L22.5 11 L26.5 21 L33 13.5 L31.5 34 Z"/>`,
  K: `<path d="M22.5 8.5 L31.8 15.3 L28.6 34 L16.4 34 L13.2 15.3 Z"/><path d="M21.4 16 h2.2 v3.4 h3.4 v2.2 h-3.4 v3.4 h-2.2 v-3.4 h-3.4 v-2.2 h3.4 z" fill="ACC" stroke="none"/>`,
}

const PB = {
  P: `<circle cx="22.5" cy="16.5" r="6"/><rect x="14.5" y="24" width="16" height="10" rx="5"/><rect x="13" y="32" width="19" height="6" rx="3"/>`,
  R: `<circle cx="16.5" cy="11.5" r="2.6"/><circle cx="22.5" cy="10" r="2.6"/><circle cx="28.5" cy="11.5" r="2.6"/><rect x="15" y="13" width="15" height="21" rx="4"/><rect x="13" y="32" width="19" height="6" rx="3"/>`,
  B: `<circle cx="22.5" cy="8.5" r="2.6"/><ellipse cx="22.5" cy="22.5" rx="8" ry="11"/><rect x="13" y="32" width="19" height="6" rx="3"/><path d="M22.5 15 L22.5 23" fill="none" stroke="ACC" stroke-width="1.8"/>`,
  N: `<circle cx="24.8" cy="9.9" r="2.2"/><path d="M14.5 34 C14.5 27.5 15.6 22.8 18.6 20.2 C15.9 20.4 13.9 19.2 13 17 C15 15.4 17.4 15 19.7 15.9 C20.2 13.9 21.4 12.3 23.3 11.4 C24.6 12.9 25.2 14.7 25 16.6 C30 18.6 32.7 22.8 32.6 28 L32.4 34 Z"/><rect x="13" y="32" width="19" height="6" rx="3"/><circle cx="21.7" cy="18.6" r="1.2" fill="ACC" stroke="none"/>`,
  Q: `<circle cx="16" cy="11.5" r="2.7"/><circle cx="22.5" cy="9" r="2.7"/><circle cx="29" cy="11.5" r="2.7"/><path d="M15 34 C14 22 17.5 15.5 22.5 15.5 C27.5 15.5 31 22 30 34 Z"/><rect x="13" y="32" width="19" height="6" rx="3"/>`,
  K: `<path d="M22.5 4.5 V13 M18.4 8.75 H26.6" fill="none" stroke-width="2.6"/><path d="M15 34 C14 22 17.5 14.5 22.5 14.5 C27.5 14.5 31 22 30 34 Z"/><rect x="13" y="32" width="19" height="6" rx="3"/><circle cx="22.5" cy="23" r="1.6" fill="ACC" stroke="none"/>`,
}

const SL = {
  P: `<circle cx="22.5" cy="14.5" r="3.6"/><path d="M19.8 34 L21.2 19.5 L23.8 19.5 L25.2 34 Z"/><rect x="16.5" y="33" width="12" height="4" rx="1.5"/>`,
  R: `<path d="M17.5 34 L17.5 12 L16 12 L16 8 L19.5 8 L19.5 10.5 L21.5 10.5 L21.5 8 L23.5 8 L23.5 10.5 L25.5 10.5 L25.5 8 L29 8 L29 12 L27.5 12 L27.5 34 Z"/><rect x="14.5" y="33" width="16" height="4" rx="1.5"/>`,
  B: `<path d="M22.5 8.5 C26 13.5 27.6 19 27.1 25 C26.7 30 25 33 22.5 34 C20 33 18.3 30 17.9 25 C17.4 19 19 13.5 22.5 8.5 Z"/><rect x="15.5" y="33" width="14" height="4" rx="1.5"/><path d="M22.5 14 L22.5 21" fill="none" stroke="ACC" stroke-width="1.4"/>`,
  N: `<path d="M17 34 L17 24 C17 16.5 20 12.5 25 11.7 L24.2 7.5 L27.4 10.8 C30.4 13 31.8 17.5 31.8 23 L31.8 34 L28 34 L28 24.5 C26.4 26.3 24 27.3 21.2 27.6 L21.2 34 Z"/><rect x="14.5" y="33" width="16" height="4" rx="1.5"/><circle cx="26.7" cy="15.2" r="1" fill="ACC" stroke="none"/>`,
  Q: `<path d="M17.4 34 L15.6 11.5 L19.7 18 L22.5 8 L25.3 18 L29.4 11.5 L27.6 34 Z"/><rect x="14.5" y="33" width="16" height="4" rx="1.5"/>`,
  K: `<path d="M22.5 4 V11 M19.2 7.5 H25.8" fill="none" stroke-width="2.2"/><path d="M19.5 34 L20 13 L25 13 L25.5 34 Z"/><rect x="14.5" y="33" width="16" height="4" rx="1.5"/>`,
}

const BL = {
  P: `<path d="M22.5 9.5 L27.2 18 L25.2 34 L19.8 34 L17.8 18 Z"/>`,
  R: `<path d="M15 34 L15 10.5 L19.5 14.5 L22.5 13 L25.5 14.5 L30 10.5 L30 34 Z"/>`,
  B: `<path d="M22.5 7.5 L29.3 22 L24.2 34 L20.8 34 L15.7 22 Z"/><path d="M22.5 13 L22.5 21" fill="none" stroke="ACC" stroke-width="1.5"/>`,
  N: `<path d="M15 34 L15 21 L28.5 8.5 L26.3 16.4 L33 14.8 L24 23.5 L30.5 23.5 L30.5 34 Z"/><circle cx="26.9" cy="12.9" r="1.1" fill="ACC" stroke="none"/>`,
  Q: `<path d="M14 34 L11.5 11.5 L17.2 19 L22.5 8.5 L27.8 19 L33.5 11.5 L31 34 Z"/>`,
  K: `<path d="M22.5 4.5 L30.3 14.5 L27.8 34 L17.2 34 L14.7 14.5 Z"/><path d="M21.4 15 h2.2 v3.2 h3.2 v2.2 h-3.2 v3.2 h-2.2 v-3.2 h-3.2 v-2.2 h3.2 z" fill="ACC" stroke="none"/>`,
}

const OR = {
  P: `<circle cx="22.5" cy="26" r="7.5"/>`,
  R: `<rect x="14.5" y="8.5" width="16" height="7" rx="2"/><rect x="14.5" y="17.5" width="16" height="7" rx="2"/><rect x="14.5" y="26.5" width="16" height="7" rx="2"/>`,
  B: `<circle cx="22.5" cy="12.5" r="4.6"/><circle cx="22.5" cy="26.5" r="8"/>`,
  N: `<circle cx="18.5" cy="27" r="7.2"/><circle cx="27.5" cy="14" r="5.4"/><circle cx="32" cy="6.8" r="2" fill="ACC" stroke="none"/>`,
  Q: `<circle cx="22.5" cy="11.5" r="4.6" fill="none"/><circle cx="22.5" cy="25.5" r="8.6"/>`,
  K: `<path d="M22.5 4.5 V12.5 M18.6 8.5 H26.4" fill="none" stroke-width="2.4"/><circle cx="22.5" cy="25.5" r="8.6"/>`,
}

const LETTERS = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P' }

// family renderers: (pieceKey, colors {fill, stroke}, acc) -> inner svg
const FAMILIES = {
  staunton: {
    label: 'Staunton',
    render: (p, c, acc) => g(c[0], c[1], 1.4, ST[p].replaceAll('ACC', acc)),
  },
  outline: {
    label: 'Outline',
    // hollow line art for the light side only; the dark side stays solid with
    // a light stroke, or it turns ghostly on light squares
    render: (p, c, acc, isWhite) => {
      const body = g(c[0], c[1], 2.1, ST[p].replaceAll('ACC', acc))
      return isWhite ? body.replace('<g ', '<g fill-opacity="0.25" ') : body
    },
  },
  pebble: {
    label: 'Pebble',
    render: (p, c, acc) => g(c[0], c[1], 1.5, PB[p].replaceAll('ACC', acc)),
  },
  slim: {
    label: 'Slim',
    render: (p, c, acc) => g(c[0], c[1], 1.3, SL[p].replaceAll('ACC', acc)),
  },
  blade: {
    label: 'Blade',
    render: (p, c, acc) => g(c[0], c[1], 1.3, BL[p].replaceAll('ACC', acc)),
  },
  prism: {
    label: 'Prism',
    render: (p, c, acc) => g(c[0], c[1], 1.2, PR[p].replaceAll('ACC', acc)),
  },
  letter: {
    label: 'Letter',
    render: (p, c, acc) =>
      `<circle cx="22.5" cy="23" r="13.5" fill="${c[0]}" stroke="${acc}" stroke-width="1.8"/>` +
      `<text x="22.5" y="23" dy=".36em" text-anchor="middle" font-family="system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" font-size="16" font-weight="800" fill="${c[1]}">${LETTERS[p]}</text>`,
  },
  orbit: {
    label: 'Orbit',
    render: (p, c, acc) => g(c[0], c[1], 1.6, OR[p].replaceAll('ACC', acc)),
  },
}

// 30 sets: 8 shape families, a few treatments each
export const SETS = [
  ['staunton', 'classic'], ['staunton', 'walnut'], ['staunton', 'obsidian'], ['staunton', 'midnight'],
  ['outline', 'ink'], ['outline', 'copper'], ['outline', 'frost'], ['outline', 'forest'],
  ['pebble', 'classic'], ['pebble', 'rose'], ['pebble', 'mint'], ['pebble', 'honey'],
  ['slim', 'marble'], ['slim', 'slate'], ['slim', 'crimson'], ['slim', 'lime'],
  ['blade', 'obsidian'], ['blade', 'midnight'], ['blade', 'crimson'], ['blade', 'storm'],
  ['prism', 'classic'], ['prism', 'forest'], ['prism', 'frost'], ['prism', 'plum'],
  ['letter', 'classic'], ['letter', 'walnut'], ['letter', 'slate'],
  ['orbit', 'classic'], ['orbit', 'teal'], ['orbit', 'rose'],
]

export const cap = (s) => s[0].toUpperCase() + s.slice(1)

const names = {}
for (const [fam, palName] of SETS) {
  const id = `${fam}-${palName}`
  const pal = PALETTES[palName]
  const dir = join(SRC, id)
  mkdirSync(dir, { recursive: true })
  for (const piece of Object.keys(LETTERS)) {
    // outline black pieces invert: dark fill with LIGHT stroke so they read on dark squares
    const wc = pal.w
    const bc = fam === 'outline' ? [pal.b[0], pal.w[0]] : pal.b
    writeFileSync(join(dir, `w${piece}.svg`), svg(FAMILIES[fam].render(piece, wc, pal.acc, true)))
    writeFileSync(join(dir, `b${piece}.svg`), svg(FAMILIES[fam].render(piece, bc, pal.acc, false)))
  }
  names[id] = `${FAMILIES[fam].label} ${cap(palName)}`
}
console.log(`wrote ${SETS.length} sets (${SETS.length * 12} SVGs)`)
console.log('PIECE_SET_NAMES additions:\n' + JSON.stringify(names, null, 2))

// ---- optional contact sheet ----
const pi = process.argv.indexOf('--preview')
if (pi > 0) {
  const { readFileSync } = await import('node:fs')
  let html = `<meta charset=utf8><style>body{background:#161512;color:#eee;font:13px system-ui;padding:12px}
  .set{margin-bottom:14px}.row{display:flex;flex-wrap:wrap}.cell{width:44px;height:44px;display:flex}
  .cell svg{width:100%;height:100%}.l{background:#f0d9b5}.d{background:#b58863}h3{margin:6px 0 4px;font-size:13px}</style>`
  for (const [fam, palName] of SETS) {
    const id = `${fam}-${palName}`
    html += `<div class=set><h3>${names[id]}</h3><div class=row>`
    let i = 0
    for (const color of ['w', 'b'])
      for (const piece of ['K', 'Q', 'R', 'B', 'N', 'P']) {
        const s = readFileSync(join(SRC, id, `${color}${piece}.svg`), 'utf8')
        html += `<div class="cell ${i++ % 2 ? 'd' : 'l'}">${s}</div>`
      }
    html += `</div></div>`
  }
  writeFileSync(process.argv[pi + 1], html)
  console.log('preview written to', process.argv[pi + 1])
}
