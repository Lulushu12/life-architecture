// Bot strength calibration: play the app's sub-1320 bot model against
// Stockfish's own UCI_Elo-limited play (calibrated by the Stockfish project)
// and report the measured score and Elo gap. This is how the error-model
// constants in src/bot.js were sanity-checked — rerun it after changing them.
//
//   node scripts/calibrate-bots.mjs --elo 1200 --games 12 --anchor 1320
//
// Requires a built dist/ (npm run build) and Playwright (point
// PLAYWRIGHT_MODULE at an installed copy, like probe-positions.mjs).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { Chess } from 'chess.js'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

const arg = (name, dflt) => {
  const i = process.argv.indexOf('--' + name)
  return i >= 0 ? Number(process.argv[i + 1]) : dflt
}
const BOT_ELO = arg('elo', 1200)
const GAMES = arg('games', 12)
const ANCHOR_ELO = arg('anchor', 1320)
const ANCHOR_MS = arg('anchor-ms', 120)
const MAX_PLIES = arg('max-plies', 240)

// ---- mirror of the sub-1320 model in src/bot.js (keep in sync) ----
const UCI_ELO_MIN = 1320
const nodesForElo = (elo) => Math.round(600 * Math.pow(2, (elo - 800) / 125))
const blunderChance = (elo) => 0.03 + Math.max(0, UCI_ELO_MIN - elo) * (0.11 / 520)
const scoreOf = (l) => (l.mate != null ? (l.mate > 0 ? 9000 : -9000) : l.cp)

function pickBotMove(fen, lines) {
  if (lines.length === 0) return null
  const legal = new Chess(fen).moves({ verbose: true })
  if (Math.random() < blunderChance(BOT_ELO) && legal.length > 3) {
    const top = new Set(lines.slice(0, 3).map((l) => l.move))
    const outside = legal.map((m) => m.from + m.to + (m.promotion || '')).filter((u) => !top.has(u))
    if (outside.length > 0) return outside[Math.floor(Math.random() * outside.length)]
  }
  if (lines.length === 1) return lines[0].move
  const best = scoreOf(lines[0])
  const temp = 60 + (UCI_ELO_MIN - BOT_ELO) * 0.24
  const weights = lines.map((l) => Math.exp(-Math.max(0, best - scoreOf(l)) / temp))
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lines.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return lines[i].move
  }
  return lines[lines.length - 1].move
}

// ---- serve dist and boot the app's own engine build in Chromium ----
const dir = new URL('../dist', import.meta.url).pathname
const BASE = '/life-architecture/chess/'
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.nnue': 'application/octet-stream' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1)
  if (p === '/' || p === '') p = '/index.html'
  const f = join(dir, normalize(p).replace(/^(\.\.[/\\])+/, ''))
  try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': TYPES[extname(f)] ?? 'application/octet-stream' }); res.end(b) }
  catch { res.writeHead(404); res.end('nf') }
})
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

// One search. opts: array of setoption commands to send first.
const search = (fen, goCmd, multipv, opts) => page.evaluate(async ([f, go, mpv, pre]) => {
  window.__l = []
  for (const o of pre) window.__e.postMessage(o)
  window.__e.postMessage('setoption name MultiPV value ' + mpv)
  window.__e.postMessage('position fen ' + f)
  window.__e.postMessage('go ' + go)
  return await new Promise((r) => {
    const t = setInterval(() => {
      const bm = window.__l.find((l) => l.startsWith('bestmove'))
      if (!bm) return
      clearInterval(t)
      const infos = []
      for (let i = 1; i <= mpv; i++) {
        const line = [...window.__l].reverse().find((l) => l.startsWith('info') && l.includes(' score ') && (mpv === 1 || l.includes(' multipv ' + i + ' ')))
        if (line) infos.push(line)
      }
      r({ bestmove: bm.split(' ')[1], infos })
    }, 25)
    setTimeout(() => { clearInterval(t); r(null) }, 60000)
  })
}, [fen, goCmd, multipv, opts])

const parseLines = (infos) =>
  infos.map((raw) => {
    const t = raw.split(' ')
    const l = { cp: null, mate: null, pv: [] }
    for (let i = 0; i < t.length; i++) {
      if (t[i] === 'score') { if (t[i + 1] === 'cp') l.cp = Number(t[i + 2]); else if (t[i + 1] === 'mate') l.mate = Number(t[i + 2]) }
      else if (t[i] === 'pv') { l.pv = t.slice(i + 1); break }
    }
    l.move = l.pv[0]
    return l
  }).filter((l) => l.move)

const FULL = ['setoption name UCI_LimitStrength value false', 'setoption name Skill Level value 20']
const LIMITED = [`setoption name UCI_LimitStrength value true`, `setoption name UCI_Elo value ${ANCHOR_ELO}`, 'setoption name Skill Level value 20']

async function botMove(fen) {
  const r = await search(fen, 'nodes ' + nodesForElo(BOT_ELO), 8, FULL)
  if (!r) return null
  const lines = parseLines(r.infos)
  return pickBotMove(fen, lines) || r.bestmove
}

// Returns { move, cpWhite } — the anchor's own score doubles as the
// adjudication signal for hopeless positions.
async function anchorMove(fen) {
  const r = await search(fen, 'movetime ' + ANCHOR_MS, 1, LIMITED)
  if (!r) return null
  const l = parseLines(r.infos)[0]
  const raw = l ? (l.mate != null ? (l.mate > 0 ? 10000 : -10000) : l.cp) : 0
  return { move: r.bestmove, cpWhite: fen.split(' ')[1] === 'w' ? raw : -raw }
}

let botPts = 0
for (let game = 0; game < GAMES; game++) {
  const botIsWhite = game % 2 === 0
  const c = new Chess()
  let hopeless = 0 // consecutive anchor reads of a decided position
  let result = null // bot points
  while (!c.isGameOver() && c.history().length < MAX_PLIES) {
    const botTurn = (c.turn() === 'w') === botIsWhite
    let uci
    if (botTurn) {
      uci = await botMove(c.fen())
    } else {
      const a = await anchorMove(c.fen())
      uci = a?.move
      if (a && Math.abs(a.cpWhite) >= 900) hopeless++
      else hopeless = 0
      if (hopeless >= 6) { result = (a.cpWhite > 0) === botIsWhite ? 1 : 0; break }
    }
    if (!uci || uci === '(none)') break
    const mv = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    if (!mv) break
  }
  if (result == null) {
    if (c.isCheckmate()) result = (c.turn() === 'w') !== botIsWhite ? 1 : 0
    else result = 0.5
  }
  botPts += result
  console.log(`game ${game + 1}/${GAMES}  bot(${BOT_ELO}) as ${botIsWhite ? 'White' : 'Black'}  ${result === 1 ? 'WIN' : result === 0 ? 'loss' : 'draw'}  (${c.history().length} plies)  running: ${botPts}/${game + 1}`)
}

const s = Math.min(0.99, Math.max(0.01, botPts / GAMES))
const diff = Math.round(-400 * Math.log10(1 / s - 1))
console.log(`\nbot(${BOT_ELO}) vs UCI_Elo ${ANCHOR_ELO}: ${botPts}/${GAMES} (${Math.round(s * 100)}%) → measured ≈ ${ANCHOR_ELO + diff} Elo (${diff >= 0 ? '+' : ''}${diff} vs anchor)`)
await browser.close(); server.close()
