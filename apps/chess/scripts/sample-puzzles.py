"""Sample the Lichess puzzle database (CC0) into offline difficulty tiers.

The full dump is ~5M puzzles / 1GB uncompressed, far too much to bundle. This
takes a quality-filtered, reservoir-sampled slice per rating band, keeping only
the fields the app needs.

Lichess convention: `fen` is the position *before* the opponent's move, and
moves[0] is that opponent move. The solver answers with moves[1], [3], ...
"""
import csv
import io
import json
import random
import sys

import zstandard

SRC = "lichess_db_puzzle.csv.zst"
OUT = "../public/puzzles.json"

# (key, label, lo, hi) — hi exclusive
TIERS = [
    ("starter", "Starter", 0, 1000),
    ("easy", "Easy", 1000, 1300),
    ("medium", "Medium", 1300, 1600),
    ("hard", "Hard", 1600, 1900),
    ("brutal", "Brutal", 1900, 2200),
    ("expert", "Expert", 2200, 9999),
]
PER_TIER = 1200

# Only well-settled puzzles: a tight rating deviation, plenty of attempts, and
# a high thumbs-up rate. Keeps out noise and the actively disliked ones.
MAX_DEVIATION = 75
MIN_PLAYS = 1000
MIN_POPULARITY = 90

# Themes worth surfacing as filters; the rest are dropped to save space.
KEEP_THEMES = {
    "mateIn1", "mateIn2", "mateIn3", "fork", "pin", "skewer", "discoveredAttack",
    "doubleCheck", "sacrifice", "deflection", "decoyAttraction", "clearance",
    "interference", "xRayAttack", "zugzwang", "trappedPiece", "hangingPiece",
    "backRankMate", "smotheredMate", "promotion", "underPromotion", "enPassant",
    "capturingDefender", "attraction", "quietMove", "defensiveMove", "endgame",
    "middlegame", "opening", "rookEndgame", "pawnEndgame", "queenEndgame",
    "bishopEndgame", "knightEndgame", "advancedPawn", "intermezzo",
}

random.seed(20260815)  # deterministic sample; reruns give the same set

reservoirs = {k: [] for k, _, _, _ in TIERS}
seen = {k: 0 for k, _, _, _ in TIERS}
total = kept = 0


def tier_of(rating):
    for key, _, lo, hi in TIERS:
        if lo <= rating < hi:
            return key
    return None


dctx = zstandard.ZstdDecompressor()
with open(SRC, "rb") as fh, dctx.stream_reader(fh) as stream:
    text = io.TextIOWrapper(stream, encoding="utf-8", newline="")
    reader = csv.DictReader(text)
    for row in reader:
        total += 1
        if total % 500000 == 0:
            print(f"  scanned {total:,}…", flush=True)
        try:
            rating = int(row["Rating"])
            dev = int(row["RatingDeviation"])
            plays = int(row["NbPlays"])
            pop = int(row["Popularity"])
        except (ValueError, KeyError, TypeError):
            continue
        if dev > MAX_DEVIATION or plays < MIN_PLAYS or pop < MIN_POPULARITY:
            continue
        key = tier_of(rating)
        if key is None:
            continue

        kept += 1
        themes = [t for t in row["Themes"].split() if t in KEEP_THEMES]
        item = {
            "i": row["PuzzleId"],
            "f": row["FEN"],
            "m": row["Moves"],
            "r": rating,
            "t": themes,
        }

        # Reservoir sampling: an unbiased fixed-size sample in one pass.
        seen[key] += 1
        res = reservoirs[key]
        if len(res) < PER_TIER:
            res.append(item)
        else:
            j = random.randrange(seen[key])
            if j < PER_TIER:
                res[j] = item

out = {
    "source": "Lichess puzzle database (CC0) — database.lichess.org",
    "note": "fen is before the opponent's move; moves[0] is that move, the solver plays moves[1], [3], ...",
    "tiers": [
        {"key": k, "label": lab, "min": lo, "max": (None if hi == 9999 else hi)}
        for k, lab, lo, hi in TIERS
    ],
    "puzzles": {k: sorted(v, key=lambda p: p["r"]) for k, v in reservoirs.items()},
}

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(out, fh, separators=(",", ":"), ensure_ascii=False)

print(f"\nscanned {total:,} rows, {kept:,} passed quality filters")
for k, lab, _, _ in TIERS:
    print(f"  {lab:<8} pool={seen[k]:>8,}  sampled={len(reservoirs[k]):>5,}")
import os

print(f"\nwrote {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")
