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

The switch lives in **`shared/ai-config.js`** (a public file, no secrets). It is
loaded before `shared/assistant.js` on every page. Default = off:

```js
window.PBS_AI_CONFIG = window.PBS_AI_CONFIG || {
  endpoint: "",            // "" → Guided demo mode (no network calls)
  modeLabel: "Guided demo mode",
  allowModelMode: false    // must be true AND endpoint set to call the backend
};
```

To turn it on after deploying the function, edit that one file:
`endpoint: "/api/chat"` and `allowModelMode: true`. (A legacy
`window.PBS_AI_ENDPOINT = "…"` global is also still honored as a fallback.)

The chat header shows a live badge: **Guided mode** (off) → **Model-ready**
(endpoint set) → **Model mode** (after a successful reply) → **Guided fallback**
(if the backend errors).

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

## Enable model mode on Vercel — exact steps
1. Push this repo to GitHub (already done) and **Import** it into Vercel
   (vercel.com → Add New → Project → pick the repo).
2. In Vercel → **Settings → Environment Variables**, add:
   - `AI_PROVIDER_API_KEY` = your key (required)
   - `AI_BASE_URL` (optional, default `https://api.openai.com/v1`)
   - `AI_MODEL` (optional, default `gpt-4o-mini`)
3. In `shared/ai-config.js` set `endpoint: "/api/chat"` and
   `allowModelMode: true`, then commit/push.
4. **Deploy** (Vercel builds automatically on push).
5. Open the Vercel URL, open the assistant, and send a prompt — the badge
   should move to **Model mode** on the first successful reply.
6. Confirm fallback: temporarily set a bad `endpoint`, send a prompt, and verify
   it degrades to **Guided fallback** without breaking the page.
7. **Roll back** anytime by setting `endpoint: ""` (and/or
   `allowModelMode: false`) and pushing — instantly back to guided mode.

> GitHub Pages keeps working throughout as the static, guided-mode version.
> Model mode only exists on the Vercel deployment.

### Why there is no `vercel.json`
Vercel zero-config already does the right thing for this repo: it serves the
static files as-is and auto-detects `api/chat.js` as a serverless function at
`/api/chat`. Adding a `vercel.json` would only risk overriding that sensible
default (and could break static routing), so it is intentionally omitted. Add
one later only if you need custom headers, regions, or rewrites.

---

## Troubleshooting
| Symptom | Cause | Fix |
| --- | --- | --- |
| Assistant always guided, badge "Guided mode" | `endpoint` empty / `allowModelMode` false | Set both in `shared/ai-config.js` |
| Backend returns **503** | No `AI_PROVIDER_API_KEY` in env | Add the env var in the host dashboard |
| Backend returns **405** | Non-POST request | Frontend uses POST; check any manual test |
| Reply hangs then "Guided fallback" | Upstream slow / down (12s timeout) | Expected safety net; retry later |
| CORS error in console | Calling a cross-origin endpoint | Deploy frontend + function on the same origin (e.g. both on Vercel) so `/api/chat` is same-origin |
| No network call at all | `endpoint` is empty | That's correct for GitHub Pages |

## Cost control
- Replies are capped (`max_tokens` ~320) and kept concise by the system prompt.
- Requests are limited to 2000 characters; oversized ones are rejected (413).
- No personal info is sent or logged.
- If it ever gets real traffic, add simple per-IP rate limiting at the function.

---

## Rollback plan
The frontend is safe with or without a backend. To disable Mode 2 entirely, set
`endpoint: ""` in `shared/ai-config.js` (or never set it) — the assistant reverts
to rule-based mode with no other changes. To remove the scaffold, delete `api/`,
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
