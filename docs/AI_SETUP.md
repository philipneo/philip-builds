# AI Setup - Philip Builds Studio

Philip Builds Studio uses a safe two-mode assistant:

1. **Rule-based fallback** - runs in the browser with no API key, no backend dependency, and no automatic outreach.
2. **AI backend reachable** - only on a serverless host such as Vercel, through the same-origin `/api/chat` endpoint.

GitHub Pages never receives an API key. Browser JavaScript never receives an API key. On GitHub Pages, the assistant stays in **Rule-based fallback** without probing a missing server. On Vercel, if the backend is misconfigured, slow, or failing, the assistant shows **AI backend unavailable** and falls back to local rules.

## Current Frontend Switch

The public browser config lives in `shared/ai-config.js`.

It contains no secrets:

```js
window.PBS_AI_CONFIG = window.PBS_AI_CONFIG || {
  endpoint: "/api/chat",
  modeLabel: "Vercel AI backend",
  allowModelMode: true,
  sameOriginOnly: true
};
```

The assistant only accepts a same-origin `/api/...` endpoint. It will not call a model provider URL directly from the browser.

## Backend Endpoint

Endpoint path:

```text
/api/chat
```

Implementation:

```text
api/chat.js
```

The endpoint is a Vercel-style serverless function. It supports:

- `GET /api/chat` - health check used by the frontend.
- `POST /api/chat` - model request used only after the frontend is configured for the same-origin endpoint.

If no key is configured, the health check returns `200` with `ok: false`, and the frontend stays honest by using fallback mode. A real chat `POST` still returns `503` if no key is configured.

## Vercel Environment Variables

Set secrets in Vercel Project Settings, not in this repo.

Preferred key order:

| Variable name | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Preferred OpenAI key |
| `AI_API_KEY` | Generic OpenAI-compatible provider key |
| `OPENROUTER_API_KEY` | OpenRouter-compatible provider key |
| `AI_PROVIDER_API_KEY` | Legacy fallback supported by older docs |

Optional config:

| Variable name | Default |
| --- | --- |
| `AI_BASE_URL` | `https://api.openai.com/v1` |
| `AI_MODEL` | `gpt-4o-mini` |

For OpenRouter, set `OPENROUTER_API_KEY` and usually set `AI_MODEL` to the provider model you want. If `OPENROUTER_API_KEY` is the only key and no base URL is set, the backend uses the OpenRouter-compatible base URL.

## Deploy To Vercel

1. Import the GitHub repo into Vercel.
2. Keep the project as a static site with the `api/chat.js` serverless function.
3. In Vercel -> Project -> Settings -> Environment Variables, add `OPENAI_API_KEY` or another supported server-side key.
4. Deploy.
5. Open the Vercel URL, not the GitHub Pages URL, when testing real AI mode.

No `vercel.json` is required for the current repo. Vercel can serve the static files and expose `api/chat.js` as `/api/chat` with zero config.

## Test The Backend

Health check:

```bash
curl -i https://YOUR-VERCEL-DOMAIN/api/chat
```

Expected:

- `200` with `{"ok":true,"mode":"ai","configured":true}` when the env key is present.
- `200` with `{"ok":false,"mode":"fallback","configured":false}` when the key is missing.

POST check:

```bash
curl -s https://YOUR-VERCEL-DOMAIN/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Which demo should I open first?","page":"/","lastMatch":""}'
```

Expected success response:

```json
{
  "reply": "Short assistant reply...",
  "links": [["Find your fit", "project-matcher/index.html"], ["Start a project", "start-project/index.html"]]
}
```

## Verify Frontend Mode

Open the assistant bubble.

Badge states:

- **Rule-based fallback** - no usable backend endpoint or fallback-only mode.
- **Checking AI backend** - frontend is probing `/api/chat`.
- **AI backend reachable** - `GET /api/chat` confirmed the server-side key is configured. A model reply still requires a successful `POST`.
- **AI backend unavailable** - backend missing, key missing, upstream failed, or request timed out.

The assistant should never claim a model answered unless `/api/chat` returns a successful model reply.

## Troubleshooting POST Failures

If the health check badge shows **AI backend reachable** but messages fall back to rule-based:

1. Open Vercel → Project → Functions → `api/chat` → Logs.
2. Look for lines beginning `[api/chat]`. The log shows the upstream HTTP status and OpenAI error type without leaking the key.

| Upstream status | Cause | Fix |
| --- | --- | --- |
| `401` | API key invalid or missing in runtime | Verify `OPENAI_API_KEY` is set in Vercel → Settings → Environment Variables → Production |
| `402` | Account has no credits | Add a payment method and credits to the OpenAI account |
| `429` with `insufficient_quota` | OpenAI account quota/billing is exhausted or billing is not active | Add billing/credits in OpenAI, confirm the key belongs to that funded project, then redeploy or retest |
| `429` without `insufficient_quota` | Rate limit window exceeded | Wait for the rate-limit window to reset or lower traffic |
| `5xx` | OpenAI service error | Transient — retry in a few minutes |
| `fetch is not defined` | Node.js < 18 in Vercel runtime | Set `"engines": { "node": ">=18" }` in `package.json` (already present) and redeploy |

The assistant panel shows `"AI backend unavailable — OpenAI billing or quota issue."` when the server reports `402`, `429`, or `insufficient_quota`. A `401` is shown separately as an API key/auth issue.

After fixing OpenAI billing or quota, retest with:

```bash
curl -s https://YOUR-VERCEL-DOMAIN/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Which demo should I open first?","page":"/","lastMatch":""}'
```

Expected: HTTP `200`, a non-empty `reply`, and two safe relative links.

## Fallback Behavior

Fallback mode uses `shared/assistant.js` rule-based routing. It can recommend demos, explain the studio, route to Start Project, and answer AI/key questions honestly.

Fallback mode does not:

- Send emails.
- Book appointments.
- Store server-side chat history.
- Expose keys.
- Claim real AI is connected.

## Security Notes

- Never put API keys in `shared/ai-config.js`.
- Never put API keys in HTML, CSS, or browser JavaScript.
- Never commit `.env`.
- Never paste keys into docs, screenshots, issues, prompts, or public pages.
- GitHub Pages cannot run `/api/chat`; it will fall back.
- Vercel holds the key in environment variables and runs the serverless function.

## Local Checks

Syntax check:

```bash
node --check api/chat.js
node --check shared/assistant.js
node --check shared/ai-config.js
```

Static preview:

```bash
python3 -m http.server 8080
```

On local static preview, `/api/chat` is not a Vercel function, so the assistant should show backend unavailable and then use rule-based fallback.

## Rollback

To force fallback-only mode, set `allowModelMode: false` or set `endpoint: ""` in `shared/ai-config.js`. No backend or API key is needed for fallback mode.
