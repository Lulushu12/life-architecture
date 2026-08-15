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
| `opening-frequency-by-name.py` | Per-opening-name play counts from the dump, for the opening explorer. Distinct from `opening-frequency.py`, which aggregates to families for the lesson ordering. |
| `eval-openings.mjs` | Evaluates the final position of all 3,704 named openings with the shipped Stockfish at depth 12. Takes roughly half an hour; writes progress as it goes so it can be interrupted. Needs playwright. |
| `build-opening-meta.mjs` | Joins the two above into `public/opening-meta.json`. A line only takes a count from a tag naming that same line — trailing qualifiers may be dropped, but never far enough to collapse into the parent family, or every sub-variation would report the whole Sicilian's numbers. |
| `gen-line.mjs` | Plays a position out with the app's own Stockfish and prints the SAN line plus the FEN before each ply. Use it to build lesson content from moves that are provably legal and provably the engine's choice, rather than from memory. Needs playwright. |
| `probe-positions.mjs` | Evaluates a batch of candidate positions in one browser launch, optionally with `multipv` (which alternatives also hold?) and `both` (evaluate with each side to move, to find mutual zugzwang). Check an endgame position here **before** writing a lesson around it — candidates for the endgame lessons repeatedly turned out to be drawn both ways, won both ways, or outright illegal. It rejects a position where the side not to move is in check, because Stockfish searches those forever. Needs playwright. |

Lesson content must pass `node validate-lessons.mjs --engine` before it ships;
that run needs `PLAYWRIGHT_MODULE` pointed at an installed playwright and the
built app served at `http://localhost:4187/life-architecture/chess/`.
