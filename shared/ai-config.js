/* Philip Builds Studio — public AI config (NO SECRETS).
 *
 * This file is safe to ship to the browser. It contains NO API key and NO
 * token — only a public endpoint URL that is EMPTY by default.
 *
 * Default (GitHub Pages): endpoint = "" → the assistant runs in rule-based
 * "Guided demo mode" and makes NO network calls.
 *
 * To enable model-powered mode after deploying the serverless function
 * (e.g. on Vercel), set:
 *     endpoint: "/api/chat"
 * The API key stays in the server's environment variables — never here.
 */
window.PBS_AI_CONFIG = window.PBS_AI_CONFIG || {
  endpoint: "",
  modeLabel: "Guided demo mode",
  allowModelMode: false
};
