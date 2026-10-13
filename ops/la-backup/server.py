#!/usr/bin/env python3
"""Receiver for one-way app backups (chess plan item 14).

Standard library only. Each app PUTs its backup; the box keeps one gzip file
per distinct copy and prunes old ones:

    <data-dir>/<app>/<UTC time>_<sha256-12>.json.gz
    <data-dir>/<app>/latest.json.gz  -> newest copy

Retention: every copy from the last 7 days, then the newest copy of each day
for 30 days, then the newest of each month for 12 months.

API (all but /v1/health need "Authorization: Bearer <token>"):
    PUT  /v1/backups/<app>        body: JSON, or gzip JSON with
                                  Content-Encoding: gzip or Content-Type: application/gzip
    GET  /v1/backups/<app>        list stored copies
    GET  /v1/backups/<app>/<id>   download one (gzip JSON)
    GET  /v1/health               "ok"

Run: server.py --port 8787 --data-dir /var/lib/la-backup --token-file /run/secrets/la-backup
"""

import argparse
import datetime as dt
import gzip
import hashlib
import hmac
import json
import os
import re
import sys
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_RE = re.compile(r"^[a-z-]{1,32}$")
ID_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z_[0-9a-f]{12}$")
MAX_BODY = 20 * 1024 * 1024
LATEST = "latest.json.gz"


def utc_now():
    return dt.datetime.now(dt.timezone.utc)


def stamp(t):
    return t.strftime("%Y-%m-%dT%H-%M-%SZ")


def parse_stamp(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H-%M-%SZ").replace(tzinfo=dt.timezone.utc)


def copies(app_dir):
    """Stored copies, newest first: [(id, time)]."""
    out = []
    if not os.path.isdir(app_dir):
        return out
    for name in os.listdir(app_dir):
        if not name.endswith(".json.gz") or name == LATEST:
            continue
        cid = name[: -len(".json.gz")]
        if ID_RE.match(cid):
            out.append((cid, parse_stamp(cid.split("_")[0])))
    out.sort(key=lambda x: x[1], reverse=True)
    return out


def to_keep(items, now):
    """Ids to keep under the retention rules. items: [(id, time)] newest first."""
    keep = set()
    seen_days = set()
    seen_months = set()
    for cid, t in items:
        age = now - t
        if age <= dt.timedelta(days=7):
            keep.add(cid)
        elif age <= dt.timedelta(days=30):
            day = t.date()
            if day not in seen_days:
                seen_days.add(day)
                keep.add(cid)
        elif age <= dt.timedelta(days=366):
            month = (t.year, t.month)
            if month not in seen_months:
                seen_months.add(month)
                keep.add(cid)
    if items:
        keep.add(items[0][0])  # never delete the newest copy
    return keep


def prune(app_dir, now):
    items = copies(app_dir)
    keep = to_keep(items, now)
    removed = 0
    for cid, _ in items:
        if cid not in keep:
            os.remove(os.path.join(app_dir, cid + ".json.gz"))
            removed += 1
    return removed


def atomic_write(path, data):
    d = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def point_latest(app_dir, cid):
    link = os.path.join(app_dir, LATEST)
    tmp = link + ".new"
    if os.path.lexists(tmp):
        os.remove(tmp)
    os.symlink(cid + ".json.gz", tmp)
    os.replace(tmp, link)


def store_backup(data_dir, app, raw_json, now=None):
    """Stores a backup. Returns (status, body)."""
    now = now or utc_now()
    app_dir = os.path.join(data_dir, app)
    os.makedirs(app_dir, exist_ok=True)
    digest = hashlib.sha256(raw_json).hexdigest()[:12]
    items = copies(app_dir)
    if items and items[0][0].endswith("_" + digest):
        return 200, {"id": items[0][0], "duplicate": True}
    cid = f"{stamp(now)}_{digest}"
    atomic_write(os.path.join(app_dir, cid + ".json.gz"), gzip.compress(raw_json, mtime=0))
    point_latest(app_dir, cid)
    prune(app_dir, now)
    return 201, {"id": cid, "storedAt": now.isoformat()}


class Handler(BaseHTTPRequestHandler):
    server_version = "la-backup/1"
    data_dir = "."
    token = ""

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))

    def send_json(self, status, obj):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorized(self):
        got = self.headers.get("Authorization", "")
        want = "Bearer " + self.token
        return bool(self.token) and hmac.compare_digest(got.encode(), want.encode())

    def route(self):
        parts = [p for p in self.path.split("?")[0].split("/") if p]
        if len(parts) >= 3 and parts[:2] == ["v1", "backups"] and APP_RE.match(parts[2]):
            return parts[2], parts[3] if len(parts) == 4 else None, len(parts) <= 4
        return None, None, False

    def do_GET(self):
        if self.path.split("?")[0] == "/v1/health":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(body)
            return
        app, cid, ok = self.route()
        if not ok:
            return self.send_json(404, {"error": "not found"})
        if not self.authorized():
            return self.send_json(401, {"error": "bad token"})
        app_dir = os.path.join(self.data_dir, app)
        if cid is None:
            listing = [
                {"id": i, "storedAt": t.isoformat(), "bytes": os.path.getsize(os.path.join(app_dir, i + ".json.gz"))}
                for i, t in copies(app_dir)
            ]
            return self.send_json(200, listing)
        if not ID_RE.match(cid) or not os.path.exists(os.path.join(app_dir, cid + ".json.gz")):
            return self.send_json(404, {"error": "no such copy"})
        with open(os.path.join(app_dir, cid + ".json.gz"), "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "application/gzip")
        self.send_header("Content-Disposition", f'attachment; filename="{app}-{cid}.json.gz"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self):
        app, cid, ok = self.route()
        if not ok or cid is not None:
            return self.send_json(404, {"error": "not found"})
        if not self.authorized():
            return self.send_json(401, {"error": "bad token"})
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            length = -1
        if length < 0:
            return self.send_json(411, {"error": "length required"})
        if length > MAX_BODY:
            return self.send_json(413, {"error": "too large"})
        body = self.rfile.read(length)
        gz = self.headers.get("Content-Encoding", "") == "gzip" or self.headers.get("Content-Type", "").startswith("application/gzip")
        try:
            raw = gzip.decompress(body) if gz else body
            if len(raw) > MAX_BODY * 5:
                return self.send_json(413, {"error": "too large"})
            json.loads(raw)
        except (OSError, EOFError, ValueError):
            return self.send_json(400, {"error": "not a JSON backup"})
        status, out = store_backup(self.data_dir, app, raw)
        self.send_json(status, out)


def make_server(port, data_dir, token, host="127.0.0.1"):
    handler = type("BoundHandler", (Handler,), {"data_dir": data_dir, "token": token})
    return ThreadingHTTPServer((host, port), handler)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=8787)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--data-dir", required=True)
    ap.add_argument("--token-file", required=True)
    args = ap.parse_args(argv)
    with open(args.token_file) as f:
        token = f.read().strip()
    if len(token) < 16:
        sys.exit("token file must hold a token of at least 16 characters")
    os.makedirs(args.data_dir, exist_ok=True)
    srv = make_server(args.port, args.data_dir, token, args.host)
    print(f"la-backup listening on {args.host}:{srv.server_address[1]}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
