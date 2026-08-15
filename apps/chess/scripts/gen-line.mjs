// Play out a position with Stockfish and print the SAN line, so lesson content
// is built from moves that are provably legal and provably the engine's choice
// rather than from memory.
//
//   node genline.mjs "<fen>" <plies> [movetimeMs]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'
import { Chess } from '/home/user/life-architecture/apps/chess/node_modules/chess.js/dist/esm/chess.js'

const [fen, pliesArg, mtArg] = process.argv.slice(2)
const plies = Number(pliesArg || 20)
const movetime = Number(mtArg || 600)

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
await new Promise((r) => server.listen(4187, r))

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.goto(`http://localhost:4187${BASE}`, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  window.__e = new Worker('/life-architecture/chess/engine/stockfish-nnue-16-single.js')
  window.__lines = []
  window.__e.onmessage = (ev) => window.__lines.push(String(ev.data))
  const send = (c) => window.__e.postMessage(c)
  send('uci'); send('setoption name Use NNUE value true')
  send('setoption name EvalFile value nn-5af11540bbfe.nnue'); send('isready')
  await new Promise((r) => { const t = setInterval(() => { if (window.__lines.includes('readyok')) { clearInterval(t); r() } }, 100) })
})

const bestMove = (f, ms) => page.evaluate(async ([fen, mt]) => {
  window.__lines = []
  window.__e.postMessage('position fen ' + fen)
  window.__e.postMessage('go movetime ' + mt)
  return await new Promise((r) => {
    const t = setInterval(() => {
      const bm = window.__lines.find((l) => l.startsWith('bestmove'))
      if (bm) { clearInterval(t); r(bm.split(' ')[1]) }
    }, 50)
    setTimeout(() => { clearInterval(t); r(null) }, mt + 8000)
  })
}, [f, ms])

const chess = new Chess(fen)
const san = []
for (let i = 0; i < plies; i++) {
  if (chess.isGameOver()) break
  const uci = await bestMove(chess.fen(), movetime)
  if (!uci || uci === '(none)') break
  const mv = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length === 5 ? uci[4] : undefined })
  if (!mv) break
  san.push(mv.san)
}

console.log('start :', fen)
console.log('line  :', JSON.stringify(san))
console.log('final :', chess.fen())
console.log('over  :', chess.isGameOver(), chess.isCheckmate() ? '(checkmate)' : chess.isStalemate() ? '(stalemate)' : '')

// FEN before each ply, so a quiz can be anchored anywhere in the line.
const walk = new Chess(fen)
san.forEach((s, i) => {
  console.log(`  ${String(i).padStart(2)}  ${walk.fen()}   -> ${s}`)
  walk.move(s)
})

await browser.close(); server.close()
