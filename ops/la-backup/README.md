# la-backup: a backup receiver for your box

The chess app (Android) sends a copy of its backup here once a day at most,
on launch and after a game. Nothing else talks to it. It's one Python file
using only the standard library, run as a NixOS service and reached over your
tailnet.

**Status: written and tested here, not yet run on your box or phone.** Expect
to fix small things the first time.

## 1. Make a token

```sh
head -c 32 /dev/urandom | base64 | sudo tee /etc/la-backup.token >/dev/null
sudo chmod 600 /etc/la-backup.token
```

## 2. Add the service to your NixOS configuration

```nix
imports = [ /path/to/life-architecture/ops/la-backup/module.nix ];
services.la-backup = {
  enable = true;
  tokenFile = "/etc/la-backup.token";
};
```

Then `sudo nixos-rebuild switch`, and check it's up:

```sh
curl http://127.0.0.1:8787/v1/health      # ok
```

## 3. Put HTTPS in front of it with Tailscale

```sh
sudo tailscale serve --bg 8787
tailscale serve status
```

This serves `https://<box>.<your-tailnet>.ts.net` to your tailnet only, never
the internet. The `tailscale serve` syntax has changed between Tailscale
versions; if that command is refused, `tailscale serve --help` shows the form
your version wants. The goal is HTTPS on the tailnet, proxying to
`http://127.0.0.1:8787`.

## 4. Point the phone at it

In the chess app: Settings, Backup to your box. Enter
`https://<box>.<your-tailnet>.ts.net` and the token from step 1, switch on
"Send a daily copy", and tap "Send a copy now". The status line should say
"Last copy to box" with the time.

## What's kept

`/var/lib/la-backup/chess/`, one `.json.gz` per distinct copy (an identical
copy isn't stored twice), and `latest.json.gz` pointing at the newest:

- every copy from the last 7 days
- then the newest copy of each day, up to 30 days
- then the newest copy of each month, up to 12 months

## Restoring

```sh
TOKEN=$(sudo cat /etc/la-backup.token)
curl -H "Authorization: Bearer $TOKEN" https://<box>.<tailnet>.ts.net/v1/backups/chess          # list
curl -H "Authorization: Bearer $TOKEN" -o chess.json.gz https://<box>.<tailnet>.ts.net/v1/backups/chess/<id>
gunzip chess.json.gz
```

Then in the app: Settings, Backup and restore, Import from file (or paste the
text). Or just `zcat /var/lib/la-backup/chess/latest.json.gz` on the box.

## Tests

```sh
python3 -m unittest discover -s ops/la-backup -v
```
