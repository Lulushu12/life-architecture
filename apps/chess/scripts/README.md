# Content scripts

Dev tooling, not shipped in the app. Each one needs the Lichess puzzle dump:

```sh
curl -O https://database.lichess.org/lichess_db_puzzle.csv.zst   # ~290MB, CC0
pip install zstandard
```

| Script | What it does |
|---|---|
| `sample-puzzles.py` | Rebuilds `public/puzzles.json` — a quality-filtered, reservoir-sampled slice of the dump, 1200 puzzles per difficulty tier. Deterministic: same seed, same set. |
| `opening-frequency.py` | Recounts opening families for `src/lessons/popularity.js`, which drives the order of the opening lessons. One vote per game per family. |
| `gen-line.mjs` | Plays a position out with the app's own Stockfish and prints the SAN line plus the FEN before each ply. Use it to build lesson content from moves that are provably legal and provably the engine's choice, rather than from memory. Needs playwright. |

Lesson content must pass `node validate-lessons.mjs --engine` before it ships;
that run needs `PLAYWRIGHT_MODULE` pointed at an installed playwright and the
built app served at `http://localhost:4187/life-architecture/chess/`.
