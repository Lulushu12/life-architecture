// Evaluate the final position of every named opening with the shipped
// Stockfish, so the explorer can say what a line is actually worth rather than
// just naming it. Fixed depth keeps verdicts comparable across positions.
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'
import { Chess } from '/home/user/life-architecture/apps/chess/node_modules/chess.js/dist/esm/chess.js'

const DEPTH = 12
const OUT = '/tmp/claude-0/-home-user-life-architecture/fd832efc-bfdb-5ecd-959d-86c9ec6191d6/scratchpad/opening_evals.json'
const dir = '/home/user/life-architecture/apps/chess/dist'
const BASE = '/life-architecture/chess/'
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wasm': 'application/wasm', '.nnue': 'application/octet-stream' }

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1)
  if (p === '/' || p === '') p = '/index.html'
  const f = join(dir, normalize(p).replace(/^(\.\.[/\\])+/, ''))
  try {
    const b = await readFile(f)
    res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' })
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(4190, r))

const { OPENINGS } = await import('/home/user/life-architecture/apps/chess/src/openings.js')
console.log('openings to evaluate:', OPENINGS.length)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.goto(`http://localhost:4190${BASE}`, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  window.__e = new Worker('/life-architecture/chess/engine/stockfish-nnue-16-single.js')
  window.__l = []
  window.__e.onmessage = (e) => window.__l.push(String(e.data))
  const s = (c) => window.__e.postMessage(c)
  s('uci'); s('setoption name Use NNUE value true')
  s('setoption name EvalFile value nn-5af11540bbfe.nnue'); s('isready')
  await new Promise((r) => { const t = setInterval(() => { if (window.__l.includes('readyok')) { clearInterval(t); r() } }, 80) })
})

const evalFen = (fen, depth) => page.evaluate(async ([f, d]) => {
  window.__l = []
  window.__e.postMessage('position fen ' + f)
  window.__e.postMessage('go depth ' + d)
  return await new Promise((r) => {
    const t = setInterval(() => {
      if (window.__l.some((l) => l.startsWith('bestmove'))) {
        clearInterval(t)
        const info = [...window.__l].reverse().find((l) => l.startsWith('info') && l.includes(' score '))
        r(info || null)
      }
    }, 30)
    setTimeout(() => { clearInterval(t); r(null) }, 20000)
  })
}, [fen, depth])

const out = {}
let done = 0, skipped = 0
for (const [eco, name, sans] of OPENINGS) {
  const c = new Chess()
  let ok = true
  for (const san of sans.split(' ')) { try { if (!c.move(san)) ok = false } catch { ok = false } if (!ok) break }
  if (!ok) { skipped++; continue }
  const info = await evalFen(c.fen(), DEPTH)
  const m = info && info.match(/score (cp|mate) (-?\d+)/)
  if (m) {
    // Engine reports from the side to move; store from White's perspective.
    const sign = c.turn() === 'w' ? 1 : -1
    out[`${eco}|${name}`] = m[1] === 'mate'
      ? { mate: sign * Number(m[2]) }
      : { cp: sign * Number(m[2]) }
  }
  if (++done % 250 === 0) {
    console.log(`  ${done}/${OPENINGS.length}…`)
    await writeFile(OUT, JSON.stringify(out))
  }
}
await writeFile(OUT, JSON.stringify(out))
console.log(`evaluated ${done}, skipped ${skipped} (illegal), wrote ${Object.keys(out).length} entries`)
await browser.close(); server.close()
