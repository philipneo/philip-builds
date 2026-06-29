/* Philip Builds Studio — public AI config (NO SECRETS).
 *
 * This file is safe to ship to the browser. It contains NO API key and NO
 * token — only a public endpoint URL that is EMPTY by default.
 *
 * Default activation target: "/api/chat". On Vercel this points to the
 * serverless backend. On GitHub Pages that backend does not exist, so the
 * assistant shows "AI backend unavailable" and falls back to local rules.
 *
 * The API key stays in the server's environment variables — never here.
 * Keep endpoint same-origin so browser code only talks to Philip's backend.
 */
window.PBS_AI_CONFIG = window.PBS_AI_CONFIG || {
  endpoint: "/api/chat",
  modeLabel: "Vercel AI backend",
  allowModelMode: true,
  sameOriginOnly: true
};
