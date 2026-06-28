# AI Setup — Philip Builds Studio

This site is a **static GitHub Pages frontend**. The assistant runs in two modes
and is safe by default: it never needs, stores, or exposes an API key in the
browser.

---

## How the assistant works

### Mode 1 — Rule-based fallback (active now, no setup)
With no backend configured, the assistant (`shared/assistant.js`) uses built-in
rule-based routing: it recommends demos, explains the studio, answers "are you
real AI?" honestly, and routes to the Project Matcher and Start Project pages.
This is what runs on GitHub Pages today.

### Mode 2 — Model-powered (opt-in, requires a backend)
If a deployed backend endpoint is set via a **public** global, the assistant
POSTs the message there and renders the reply, falling back to Mode 1 on any
error or timeout.

```html
<!-- Set ONLY a public URL here. Never a key. -->
<script>window.PBS_AI_ENDPOINT = "https://your-deployment.example.com/api/chat";</script>
```

The frontend sends only non-sensitive context:
`{ message, page (pathname), lastMatch (a demo label) }` — no names, emails,
phone numbers, cookies, or tracking IDs.

---

## The backend (`api/chat.js`)

Provider-agnostic, Vercel-style serverless handler. **Dormant on GitHub Pages** —
it only runs when deployed to a platform that executes serverless functions.

- Reads the key from an **environment variable only**.
- Validates method + message size (rejects oversized input).
- Uses a tight system prompt (honest, demo-only, no fake claims, no PII, no
  emails/booking).
- Returns `503` when no key is set, so the frontend cleanly uses Mode 1.
- Never logs message contents or secrets.

### Environment variables
| Variable | Required | Default |
| --- | --- | --- |
| `AI_PROVIDER_API_KEY` (or `OPENAI_API_KEY`) | yes (to enable real replies) | — |
| `AI_BASE_URL` | no | `https://api.openai.com/v1` |
| `AI_MODEL` | no | `gpt-4o-mini` |

Any OpenAI-compatible Chat Completions API works via `AI_BASE_URL`.

---

## Deployment options

GitHub Pages cannot run serverless functions. To enable Mode 2, deploy the
frontend **and** the function on a platform that supports both:

- **Vercel** — `api/chat.js` is picked up automatically as `/api/chat`. Set the
  env var in Project Settings. Point `PBS_AI_ENDPOINT` at `/api/chat`.
- **Netlify** — move/rename the handler under `netlify/functions/chat.js` and add
  a `netlify.toml`; endpoint becomes `/.netlify/functions/chat`.
- **GitHub Pages stays valid** as a frontend-only host; the assistant simply
  runs in Mode 1 there.

---

## What never to commit
- `.env` (any real key). Only `.env.example` is tracked — see `.gitignore`.
- No key in any `.html`, `.js`, or `.css` served to the browser.
- No `node_modules/`.

---

## Test commands
```bash
# Frontend (Mode 1 fallback)
python3 -m http.server 8080      # then open http://localhost:8080/

# Backend syntax check (no key needed)
node --check api/chat.js
```

Manual checks: open the assistant, confirm it answers and routes with **no**
endpoint set (Mode 1); set `PBS_AI_ENDPOINT` to a bad URL and confirm it falls
back gracefully without breaking the page.

---

## Rollback plan
The frontend is safe with or without a backend. To disable Mode 2 entirely,
unset `window.PBS_AI_ENDPOINT` (or never set it) — the assistant reverts to
rule-based mode with no code changes. To remove the scaffold, delete `api/`,
`package.json`, and `.env.example`; nothing else depends on them.

---

## Security checklist
- [ ] No secret in any browser-served file
- [ ] No personal data stored (local memory holds only a non-personal last-match label)
- [ ] No invented client/result claims in AI output (enforced by system prompt)
- [ ] No automatic emails or bookings
- [ ] Backend disabled (503) unless an env key is present
- [ ] Frontend fallback works when the endpoint is empty or failing
- [ ] GitHub Pages frontend still works

---

## Future phase (not built yet)
A separate, opt-in "AI site auditor / PR assistant" could run on a schedule
(e.g. GitHub Actions) to open improvement reports — distinct from visitor chat,
and never holding secrets in the frontend.
