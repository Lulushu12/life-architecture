"""Tests for server.py. Run: python3 -m unittest discover ops/la-backup"""

import datetime as dt
import gzip
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request

import server

TOKEN = "t" * 32
UTC = dt.timezone.utc


class Retention(unittest.TestCase):
    def test_keeps_a_week_then_daily_then_monthly(self):
        now = dt.datetime(2026, 10, 10, 12, tzinfo=UTC)
        items = []
        # four copies a day for 400 days
        for d in range(400):
            for h in (1, 7, 13, 19):
                t = now - dt.timedelta(days=d, hours=h)
                items.append((f"{server.stamp(t)}_{'a' * 12}", t))
        items.sort(key=lambda x: x[1], reverse=True)
        keep = server.to_keep(items, now)
        kept = [t for cid, t in items if cid in keep]
        recent = [t for t in kept if now - t <= dt.timedelta(days=7)]
        daily = [t for t in kept if dt.timedelta(days=7) < now - t <= dt.timedelta(days=30)]
        monthly = [t for t in kept if now - t > dt.timedelta(days=30)]
        self.assertEqual(len(recent), len([1 for _, t in items if now - t <= dt.timedelta(days=7)]))
        self.assertEqual(len(daily), len({t.date() for t in daily}))  # one per day
        self.assertEqual(len(monthly), len({(t.year, t.month) for t in monthly}))  # one per month
        self.assertLessEqual(len(monthly), 13)
        self.assertTrue(all(now - t <= dt.timedelta(days=366) for t in kept))

    def test_never_drops_the_newest(self):
        now = dt.datetime(2026, 10, 10, tzinfo=UTC)
        old = now - dt.timedelta(days=900)
        items = [(f"{server.stamp(old)}_{'b' * 12}", old)]
        self.assertEqual(server.to_keep(items, now), {items[0][0]})


class Storage(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_stores_gzip_and_points_latest(self):
        status, out = server.store_backup(self.dir, "chess", b'{"a":1}')
        self.assertEqual(status, 201)
        path = os.path.join(self.dir, "chess", out["id"] + ".json.gz")
        with gzip.open(path) as f:
            self.assertEqual(json.load(f), {"a": 1})
        self.assertEqual(os.readlink(os.path.join(self.dir, "chess", "latest.json.gz")), out["id"] + ".json.gz")

    def test_the_same_data_twice_is_not_stored_twice(self):
        server.store_backup(self.dir, "chess", b'{"a":1}')
        status, out = server.store_backup(self.dir, "chess", b'{"a":1}')
        self.assertEqual((status, out["duplicate"]), (200, True))
        self.assertEqual(len(server.copies(os.path.join(self.dir, "chess"))), 1)
        later = server.utc_now() + dt.timedelta(seconds=5)
        self.assertEqual(server.store_backup(self.dir, "chess", b'{"a":2}', now=later)[0], 201)
        self.assertEqual(len(server.copies(os.path.join(self.dir, "chess"))), 2)

    def test_leaves_no_temp_files(self):
        server.store_backup(self.dir, "chess", b"{}")
        self.assertFalse([n for n in os.listdir(os.path.join(self.dir, "chess")) if n.startswith(".tmp-")])


class Http(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp()
        cls.srv = server.make_server(0, cls.dir, TOKEN)
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def req(self, method, path, body=None, headers=None, token=TOKEN):
        h = dict(headers or {})
        if token:
            h["Authorization"] = "Bearer " + token
        r = urllib.request.Request(self.base + path, data=body, method=method, headers=h)
        try:
            with urllib.request.urlopen(r) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_health_needs_no_token(self):
        self.assertEqual(self.req("GET", "/v1/health", token=None), (200, b"ok"))

    def test_put_list_download(self):
        body = gzip.compress(json.dumps({"games": [1, 2]}).encode())
        status, out = self.req("PUT", "/v1/backups/chess", body, {"Content-Type": "application/gzip"})
        self.assertEqual(status, 201)
        cid = json.loads(out)["id"]
        status, out = self.req("GET", "/v1/backups/chess")
        self.assertEqual(status, 200)
        self.assertIn(cid, [c["id"] for c in json.loads(out)])
        status, out = self.req("GET", f"/v1/backups/chess/{cid}")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(gzip.decompress(out)), {"games": [1, 2]})

    def test_plain_json_is_accepted_too(self):
        status, out = self.req("PUT", "/v1/backups/plain", b'{"x":1}', {"Content-Type": "application/json"})
        self.assertEqual(status, 201)

    def test_rejects_a_bad_token_bad_body_and_bad_names(self):
        self.assertEqual(self.req("PUT", "/v1/backups/chess", b"{}", token="wrong")[0], 401)
        self.assertEqual(self.req("GET", "/v1/backups/chess", token=None)[0], 401)
        self.assertEqual(self.req("PUT", "/v1/backups/chess", b"not json")[0], 400)
        self.assertEqual(self.req("PUT", "/v1/backups/chess", b"\x1f\x8bbroken", {"Content-Encoding": "gzip"})[0], 400)
        self.assertEqual(self.req("PUT", "/v1/backups/Chess!", b"{}")[0], 404)
        self.assertEqual(self.req("GET", "/v1/backups/chess/..%2F..%2Fetc")[0], 404)
        self.assertEqual(self.req("GET", "/v1/backups/chess/2026-01-01T00-00-00Z_000000000000")[0], 404)


if __name__ == "__main__":
    unittest.main()
