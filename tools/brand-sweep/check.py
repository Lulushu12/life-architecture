#!/usr/bin/env python3
"""Brand sweep with an allowlist, for CI.

Runs sweep.py (vendored from github.com/Jakeschincariol/replica-skill, MIT,
see LICENSE-sweep) over an app folder and sorts every hit into one of three:

  allowed   listed under "allow" in the config: hits that must stay, each
            with a reason (a licence notice, an importer the user asked for)
  pending   listed under "pending": known hits a planned change removes;
            reported as warnings, they do not fail the run
  new       anything else; any new hit fails the run (exit 1)

An entry matches a hit when its "file" equals the hit's path (relative to the
swept folder) and, when given, its "text" occurs in the hit's line and its
"match" equals what was matched.

    python3 tools/brand-sweep/check.py apps/chess --config apps/chess/brand.json
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sweep import sweep  # noqa: E402


def matches(entry, hit):
    if entry.get("file") != hit["file"]:
        return False
    if "text" in entry and entry["text"] not in hit["text"]:
        return False
    if "match" in entry and entry["match"].lower() != hit["match"].lower():
        return False
    return True


def classify(hits, allow, pending):
    out = {"allowed": [], "pending": [], "new": []}
    for h in hits:
        if any(matches(e, h) for e in allow):
            out["allowed"].append(h)
        elif any(matches(e, h) for e in pending):
            out["pending"].append(h)
        else:
            out["new"].append(h)
    return out


def line(h):
    loc = h["file"] if not h["line"] else "%s:%d" % (h["file"], h["line"])
    return "  %-6s %-10s %s  %s" % (h["kind"], h["match"][:10], loc, h["text"][:100])


def main(argv=None):
    ap = argparse.ArgumentParser(description="Brand sweep with an allowlist")
    ap.add_argument("root")
    ap.add_argument("--config", required=True)
    args = ap.parse_args(argv)
    with open(args.config, encoding="utf-8") as fh:
        cfg = json.load(fh)
    hits = sweep(args.root, cfg.get("avoid", []), cfg.get("domains", []), cfg.get("colors", []))
    hits = [h for h in hits if not any(h["file"].startswith(p) for p in cfg.get("skip", []))]
    groups = classify(hits, cfg.get("allow", []), cfg.get("pending", []))
    print("Brand sweep of %s: %d allowed, %d pending, %d new"
          % (args.root, len(groups["allowed"]), len(groups["pending"]), len(groups["new"])))
    if groups["pending"]:
        print("\nPending removal (warnings):")
        for h in groups["pending"]:
            print(line(h))
    if groups["new"]:
        print("\nNew hits (these fail the check):")
        for h in groups["new"]:
            print(line(h))
        return 1
    print("\nNo new hits.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
