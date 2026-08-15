"""Per-opening play counts, keyed by normalised name so they can be joined to
the app's own openings list."""
import csv, io, json, collections, re, zstandard

def norm(s):
    return re.sub(r"[^a-z0-9 ]", " ", s.lower().replace("_", " ")).split()

counts = collections.Counter(); tagged = 0
dctx = zstandard.ZstdDecompressor()
with open("puzzles.csv.zst", "rb") as fh, dctx.stream_reader(fh) as st:
    for row in csv.DictReader(io.TextIOWrapper(st, encoding="utf-8", newline="")):
        tags = (row.get("OpeningTags") or "").strip()
        if not tags:
            continue
        tagged += 1
        # one vote per game per distinct tag
        for t in set(tags.split()):
            counts[" ".join(norm(t))] += 1
json.dump({"tagged": tagged, "counts": counts.most_common()}, open("opening_names.json", "w"))
print(f"{tagged:,} tagged games, {len(counts):,} distinct opening tags")
for n, c in counts.most_common(8): print(f"  {c:>7,}  {n}")
