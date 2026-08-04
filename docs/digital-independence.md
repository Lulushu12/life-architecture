# Digital Independence — handoff

Standalone context for continuing the self-hosting / de-SaaS thread in a new
conversation. It came out of building **Life Architecture** (this repo), but
the plan below is about infrastructure, not this app.

Written 2026-08-04. Nothing here is built yet — it is all decisions and
reasoning, plus a couple of concrete next steps.

---

## 1. Who this is for

- Orthopedic surgeon (OR Thu/Fri, clinic Mon–Wed), systematic trader, based in
  Bucharest. Partner: Despina.
- Runs **NixOS** as a daily driver and prefers declarative config. Anything
  proposed here should be expressible as a flake, not a pile of shell history.
- Phone is **Android**; the phone is the primary surface for anything daily.
- Has a **Gemini subscription** (consumer) and Google AI Edge Gallery installed.
- Owns no server yet. Considering a Raspberry Pi.

## 2. Where the app landed (context only — this part is done)

`main` currently holds a version of Life Architecture that is deliberately
account-free and provider-light:

- **No login at all.** First run asks only where data should live.
- **Storage**: local-first in `localStorage`, optionally mirrored to a **git
  branch** — the app commits `data/store.json` to a configured
  `owner/repo` + branch through the GitHub contents API, using a fine-grained
  PAT that never leaves the browser. One branch per person is the sharing model.
  Code: `src/data/store.js`, `src/data/branchSync.js`, settings UI in
  `src/views/Setup.jsx`.
- **AI Coach**: calls any **OpenAI-compatible** `/chat/completions` endpoint
  straight from the browser — local (Ollama, LM Studio, llama.cpp) or hosted.
  Firebase and the old server-side function are deleted. Code:
  `src/coach/client.js`.
- **PWA**, installable on Android, works offline via the service worker.

Two open items carried over from that work:

1. **Repo visibility.** The repo is public and health data syncs into it as
   plain JSON. GitHub Pages does not serve private repos on the Free plan, so
   making it private takes the site down unless the account has Pro. Interim
   options: keep code public + put data in a separate private repo (the app
   accepts any `owner/repo`), or upgrade, or — see §5 — self-host git.
2. **Coach provider.** Currently easiest path is Google's OpenAI-compatible
   Gemini endpoint (`https://generativelanguage.googleapis.com/v1beta/openai`,
   model `gemini-2.5-flash`, key from aistudio.google.com — verified to allow
   browser CORS from the app origin). Note the **consumer Gemini subscription
   does not include API access**; the free API tier is separate, and on the
   free tier Google may train on submitted prompts. Enabling billing moves to
   terms where they do not. This matters because the payload is health data.

## 3. Findings so far (do not re-litigate these)

**Raspberry Pi is a bad LLM host, a good service host.**
LLM throughput is dominated by memory bandwidth. Pi 5 is ~17 GB/s — *lower
than a modern Android flagship*. Measured expectations: ~6–8 tok/s on a 3B
model, ~2–3 tok/s on 7–8B. Worse, prompt processing dominates this app's use
case (the Coach ships the protocol set + recent logs, a few thousand tokens),
which on a Pi means roughly a minute before the first output token on a 7B.
Conclusion: **do not buy a Pi to run Ollama.** Buy it for services.

**If private local inference becomes a real requirement**, the hardware tiers
that actually work are: mini-PC with a Ryzen APU (fine for 7–8B), Mac mini
(great bandwidth, silent, low idle draw), or a cheap tower with a used 12 GB
GPU (RTX 3060) for proper 7–14B speeds. Not a Pi.

**Phone-local inference is possible but marginal.** Ollama runs under Termux;
`localhost` on the phone is a browser-trusted origin, so the hosted HTTPS PWA
*can* call it. Practical ceiling is 2–4B models (llama3.2:3b, qwen2.5:3b,
gemma2:2b) — adequate for "parse this sentence into a log", weak for the
judgment-style coaching. Android also kills Termux in the background
(`termux-wake-lock` mitigates). Fine as an experiment, not as the daily path.

**Google AI Edge Gallery is a dead end for integration.** It runs Gemma
on-device but exposes no local HTTP endpoint, so no browser page can reach it.
Would only change if Google ships a local API surface.

**Browsers block HTTPS pages from calling plain-HTTP LAN addresses.** This is
why "just point the phone at the desktop's LAN IP" fails, and it is the single
technical reason Tailscale is in this plan at all.

## 4. Why Tailscale is the keystone

`tailscale serve` gives each service a stable hostname with a **valid HTTPS
certificate** on the tailnet. That solves three problems at once:

- The mixed-content/LAN-IP block above disappears — the phone can reach home
  services from anywhere (clinic, hospital, travel).
- **Nothing is exposed to the public internet**: no port forwarding, no
  reverse-proxy hardening, no fail2ban, no dynamic DNS. For a home server run
  by one busy person, this is the whole ballgame.
- Free for personal use, and `services.tailscale.enable = true;` on NixOS.

Caveat to remember: services still need to accept the browser's CORS preflight
from the app origin (for Ollama that is `OLLAMA_ORIGINS`).

## 5. The plan

**Hardware:** Raspberry Pi 5, **16 GB**, official **NVMe HAT + small SSD**
(SD-card wear is the leading cause of dead Pi servers), proper official PSU,
a case with a fan. NixOS runs on Pi 5 aarch64, so the whole box is one flake.

**Rollout order** (each stage is independently useful; stop anywhere):

1. **Tailscale + AdGuard Home** — network-wide ad/tracker blocking, immediate
   daily benefit, proves out the tailnet and DNS.
2. **Vaultwarden** — Bitwarden-compatible password manager. Highest-value SaaS
   replacement per unit of effort. Needs a real backup story before trusting it.
3. **Immich** (Google Photos) and/or **Syncthing** or **Nextcloud** (Drive /
   Dropbox). Note: Immich's ML indexing is slow on a Pi but functional.
4. **Miniflux** (RSS), **Home Assistant** if there is any home automation.
5. **Forgejo** — self-hosted git. See §6: this is the one that closes the loop
   with the app.

**Backups are not optional and are the usual failure point.** Decide before
stage 2, not after: restic to an external disk plus an offsite target
(Backblaze B2 or a friend's box), automated and *test-restored once*. A
self-hosted password manager with no verified restore is worse than the SaaS
it replaced.

**Explicitly out of scope:** hosting an LLM on the Pi (see §3), and exposing
anything to the public internet.

## 6. The loop-closing move: Forgejo + app sync

Once Forgejo is up on the tailnet, the app's branch sync can point at it
instead of GitHub, at which point health data never touches a third party.

Forgejo inherits Gitea's API, which has a **contents endpoint compatible in
shape** with what `src/data/branchSync.js` already uses (`GET`/`PUT`
`/repos/{owner}/{repo}/contents/{path}`, base64 `content`, `sha` for updates,
`branch` selector). The expected change is small and localized:

- Make the API base URL configurable (currently hardcoded
  `const API = "https://api.github.com"`), defaulting to GitHub; add the field
  to the setup screen next to repo/branch/token.
- Forgejo tokens use `Authorization: token <t>` rather than `Bearer` — verify
  which the target version accepts.
- Verify the create-vs-update semantics and the exact JSON returned on PUT
  (the code reads `content.sha` back).
- CORS: Forgejo must allow the app origin, or the app gets served from the
  same origin (Forgejo Pages / a static host on the tailnet), which sidesteps
  it entirely and also solves §2's "repo must be private" problem.

Not started. No code written for this yet.

## 7. Good first prompt for the new conversation

> Continuing from `docs/digital-independence.md` on branch
> `claude/digital-independence-handoff`. I've ordered/received a Pi 5 16 GB.
> Help me build the NixOS flake for stage 1 (Tailscale + AdGuard Home),
> including the backup strategy decision from §5.

Or, if the hardware is not here yet:

> Continuing from `docs/digital-independence.md`. Before buying anything,
> pressure-test the plan in §5 against my constraints, and tell me what I'd
> regret in a year.
