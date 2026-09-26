# actuallystupid.com

One page. For people who want to talk about AI with people who don't talk about AI.

Static HTML + one Cloudflare Pages Function (`functions/api/join.js`) that stores signup emails in a KV namespace. No build step, no framework, no wrangler config: Pages settings live in the Cloudflare dashboard, like the fleet's other Pages sites.

## Setup (dashboard, once)

1. **Pages → Create → Connect to Git** → this repo. Production branch `main`. Framework preset: None. Build command: empty. Output directory: `/`.
   Never `wrangler pages project create`; that makes a direct-upload project and Cloudflare can't convert it.
2. **Settings → Bindings → Add → KV namespace.** Variable name `SIGNUPS` → namespace `actuallystupid-signups` (id `d1625629f51c419483f197f2814b265c`). Redeploy once so the binding is live.
3. **Custom domains → add `actuallystupid.com`** (and `www`). DNS is at Hover: point the apex per the dashboard's instructions (CNAME flattening to the `*.pages.dev` host, or the A records it shows).

## Signups

Stored in KV as `email:<address>` → `{email, ts, ref, country}`. Per-IP rate limit under `rl:<ip>`, 5 per 10 minutes. A honeypot field (`website`) silently swallows bots.

Read them back:

```sh
npx wrangler kv key list --namespace-id d1625629f51c419483f197f2814b265c --prefix email: | jq -r '.[].name'
```

## Local dev

```sh
npx wrangler pages dev . --kv SIGNUPS
```

## Copy

The page text is Mike's. Edit `index.html` directly; the For Review draft is not the source of truth.
