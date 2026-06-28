// Philip Builds Studio — optional AI chat backend (provider-agnostic).
//
// IMPORTANT:
// - This file is NOT used by the static GitHub Pages site. The frontend only
//   calls it if window.PBS_AI_ENDPOINT is set to a deployed URL.
// - It reads the API key from an environment variable ONLY. Never hardcode a
//   key here and never expose one in the browser.
// - Designed for a Vercel-style serverless handler (export default function),
//   but the core logic is portable to Netlify/other runtimes.
//
// Provider-agnostic: works with any OpenAI-compatible Chat Completions API.
//   AI_PROVIDER_API_KEY  (required to enable real responses)
//   AI_BASE_URL          (default: https://api.openai.com/v1)
//   AI_MODEL             (default: gpt-4o-mini)
//
// If no key is configured, it responds 503 so the frontend cleanly falls back
// to its built-in rule-based guide.

const SYSTEM_PROMPT = [
  "You are the Philip Builds Studio website assistant.",
  "Help visitors understand the studio, its demos, the project matcher, and the Start Project path.",
  "Be honest that every demo is a fictional, front-end concept — not a real business, and with no real payments, bookings, or form submissions.",
  "Never invent clients, testimonials, awards, results, statistics, or agency scale. Never promise or guarantee outcomes.",
  "Never claim to be human. Do not collect sensitive personal information. Do not send emails or book appointments.",
  "If a visitor wants to start a project, point them to /start-project/. If they are unsure what fits, point them to /project-matcher/.",
  "Keep answers concise, practical, and friendly. Prefer suggesting the single best next page.",
].join(" ");

const MAX_MESSAGE_CHARS = 2000;

function sanitizePage(page) {
  if (typeof page !== "string") return "";
  // Only keep a simple path; never echo arbitrary content back to the model.
  return page.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 120);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    // No key configured → tell the frontend to use its local fallback.
    res.status(503).json({ error: "AI backend not configured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "Missing message" });
    return;
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    res.status(413).json({ error: "Message too long" });
    return;
  }

  const page = sanitizePage(body.page);
  const lastMatch = typeof body.lastMatch === "string" ? body.lastMatch.slice(0, 80) : "";

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const userContext = [
    "Visitor message: " + message,
    page ? "Current page: " + page : "",
    lastMatch ? "Last demo they matched with: " + lastMatch : "",
  ].filter(Boolean).join("\n");

  try {
    const upstream = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 320,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContext },
        ],
      }),
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "Upstream error" });
      return;
    }

    const data = await upstream.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
        ? data.choices[0].message.content.trim()
        : "";

    if (!reply) {
      res.status(502).json({ error: "Empty reply" });
      return;
    }

    // Always offer a safe next step the frontend can render.
    res.status(200).json({
      reply: reply,
      links: [["Find your fit", "project-matcher/index.html"], ["Start a project", "start-project/index.html"]],
    });
  } catch (e) {
    // Never log message contents or secrets.
    res.status(502).json({ error: "Request failed" });
  }
}
