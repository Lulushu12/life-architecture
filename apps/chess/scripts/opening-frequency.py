import csv, io, json, collections, zstandard
counts = collections.Counter(); tagged = total = 0
dctx = zstandard.ZstdDecompressor()
with open("lichess_db_puzzle.csv.zst","rb") as fh, dctx.stream_reader(fh) as st:
    for row in csv.DictReader(io.TextIOWrapper(st, encoding="utf-8", newline="")):
        total += 1
        tags = (row.get("OpeningTags") or "").strip()
        if not tags: continue
        tagged += 1
        # One vote per puzzle per family: a row tagged both "Sicilian_Defense"
        # and "Sicilian_Defense_Najdorf" is still a single Sicilian game.
        fams = {t.split("_Defense")[0].split("_Game")[0].split("_Opening")[0].replace("_"," ") for t in tags.split()}
        counts.update(fams)
json.dump({"tagged": tagged, "counts": counts.most_common(60)}, open("opening-frequency.json","w"), indent=1)
print(f"{total:,} rows, {tagged:,} tagged")
for n,c in counts.most_common(30): print(f"{c:>9,}  {n}")
