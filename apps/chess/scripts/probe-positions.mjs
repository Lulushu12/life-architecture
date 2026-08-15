// Batch position probe: evaluate positions and play lines out, many per browser
// launch. Use it to check that an endgame position really is won or drawn
// before writing a lesson around it — several plausible-looking candidates for
// the endgame lessons turned out to be drawn both ways, or won both ways, or
// simply illegal.
//
//   node scripts/probe-positions.mjs jobs.json
//
// Jobs come from a JSON file:
//   [{ "label": "...", "fen": "...", "depth": 22 },
//    { "label": "...", "fen": "...", "play": 24, "movetime": 800 },
//    { "label": "...", "fen": "...", "both": true, "depth": 24 }]
// "both" evaluates the position with each side to move, which is how you find
// mutual zugzwang.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { Chess } from 'chess.js'

// playwright isn't a dependency of the app — point PLAYWRIGHT_MODULE at an
// installed copy, the same way validate-lessons.mjs does.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const jobs = JSON.parse(await readFile(process.argv[2], 'utf8'))
const dir = new URL('../dist', import.meta.url).pathname
const BASE = '/life-architecture/chess/'
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.wasm': 'application/wasm', '.nnue': 'application/octet-stream' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1)
  if (p === '/' || p === '') p = '/index.html'
  const f = join(dir, normalize(p).replace(/^(\.\.[/\\])+/, ''))
  try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' }); res.end(b) }
  catch { res.writeHead(404); res.end('nf') }
})
// Ephemeral port: several probes may be in flight at once.
await new Promise((r) => server.listen(0, r))
const PORT = server.address().port

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()
await page.goto(`http://localhost:${PORT}${BASE}`, { waitUntil: 'networkidle' })
await page.evaluate(async (base) => {
  window.__e = new Worker(base + 'engine/stockfish-nnue-16-single.js')
  window.__l = []
  window.__e.onmessage = (ev) => window.__l.push(String(ev.data))
  const s = (c) => window.__e.postMessage(c)
  s('uci'); s('setoption name Use NNUE value true')
  s('setoption name EvalFile value nn-5af11540bbfe.nnue'); s('isready')
  await new Promise((r) => { const t = setInterval(() => { if (window.__l.includes('readyok')) { clearInterval(t); r() } }, 80) })
}, BASE)

const search = (fen, limit, multipv = 1) => page.evaluate(async ([f, lim, mpv]) => {
  window.__l = []
  window.__e.postMessage('setoption name MultiPV value ' + mpv)
  window.__e.postMessage('position fen ' + f)
  window.__e.postMessage('go ' + lim)
  return await new Promise((r) => {
    const t = setInterval(() => {
      const bm = window.__l.find((l) => l.startsWith('bestmove'))
      if (!bm) return
      clearInterval(t)
      const infos = []
      for (let i = 1; i <= mpv; i++) {
        const line = [...window.__l].reverse().find((l) => l.startsWith('info') && l.includes(' score ') && l.includes(' multipv ' + i + ' '))
        if (line) infos.push(line)
      }
      r({ bestmove: bm.split(' ')[1], infos })
    }, 50)
    setTimeout(() => { clearInterval(t); r(null) }, 180000)
  })
}, [fen, limit, multipv])

// Engine score → White's point of view, as a readable string.
function fmt(info, turn) {
  if (!info) return '??'
  const m = info.match(/score (cp|mate) (-?\d+)/)
  if (!m) return '??'
  const sign = turn === 'w' ? 1 : -1
  const v = sign * Number(m[2])
  return m[1] === 'mate' ? (v > 0 ? `M${v}` : `-M${-v}`) : (v > 0 ? '+' : '') + (v / 100).toFixed(2)
}
const sanOf = (fen, uci) => {
  try {
    const c = new Chess(fen)
    const mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    return mv ? mv.san : uci
  } catch { return uci }
}
const flip = (fen) => { const p = fen.split(' '); p[1] = p[1] === 'w' ? 'b' : 'w'; p[3] = '-'; return p.join(' ') }

for (const job of jobs) {
  // Pure pawn endings blow up on fixed depth (endless repetition branches), so
  // a wall-clock limit is the practical one there.
  const limit = job.play ? null : job.ms ? `movetime ${job.ms}` : `depth ${job.depth || 22}`
  console.log(`\n### ${job.label}`)
  console.log(`fen   : ${job.fen}`)
  try { new Chess(job.fen) } catch (e) { console.log('ILLEGAL:', e.message); continue }
  // chess.js happily loads a position where the side NOT to move is in check.
  // Stockfish does not — it searches such a position forever. Reject them here
  // rather than burning three minutes per bad FEN.
  try {
    if (new Chess(flip(job.fen)).inCheck()) { console.log('ILLEGAL: the side not to move is in check'); continue }
  } catch { /* flip itself unparseable — the search below will report it */ }

  if (job.play) {
    const c = new Chess(job.fen)
    const san = []
    const fens = []
    for (let i = 0; i < job.play; i++) {
      if (c.isGameOver()) break
      fens.push(c.fen())
      const r = await search(c.fen(), `movetime ${job.movetime || 800}`)
      if (!r?.bestmove || r.bestmove === '(none)') break
      const mv = c.move({ from: r.bestmove.slice(0, 2), to: r.bestmove.slice(2, 4), promotion: r.bestmove[4] })
      if (!mv) break
      san.push(mv.san)
    }
    console.log('line  :', JSON.stringify(san))
    console.log('final :', c.fen(), c.isCheckmate() ? '(checkmate)' : c.isStalemate() ? '(stalemate)' : c.isDraw() ? '(draw)' : '')
    san.forEach((s, i) => console.log(`  ${String(i).padStart(2)}  ${fens[i]}  -> ${s}`))
    continue
  }

  const turn = job.fen.split(' ')[1]
  const r = await search(job.fen, limit, job.multipv || 1)
  if (job.multipv) {
    r?.infos.forEach((inf, i) => {
      const pv = inf.split(' pv ')[1]?.split(' ') || []
      console.log(`  ${i + 1}. ${sanOf(job.fen, pv[0] || '')}  ${fmt(inf, turn)}`)
    })
  } else {
    console.log(`${turn} to move: ${fmt(r?.infos[0], turn)}  best ${sanOf(job.fen, r?.bestmove || '')}`)
  }
  if (job.both) {
    const f2 = flip(job.fen)
    const t2 = f2.split(' ')[1]
    const r2 = await search(f2, limit)
    console.log(`${t2} to move: ${fmt(r2?.infos[0], t2)}  best ${sanOf(f2, r2?.bestmove || '')}`)
  }
}

await browser.close(); server.close()
