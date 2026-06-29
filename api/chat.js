// Philip Builds Studio — optional AI chat backend (provider-agnostic).
//
// IMPORTANT:
// - This file is NOT executed by GitHub Pages. It only runs on a serverless
//   host such as Vercel, where /api/chat is available server-side.
// - It reads the API key from an environment variable ONLY. Never hardcode a
//   key here and never expose one in the browser.
// - Designed for a Vercel-style serverless handler (export default function),
//   but the core logic is portable to Netlify/other runtimes.
//
// Provider-agnostic: works with any OpenAI-compatible Chat Completions API.
//   OPENAI_API_KEY       (preferred for OpenAI)
//   AI_API_KEY           (generic OpenAI-compatible provider)
//   OPENROUTER_API_KEY   (OpenRouter-compatible provider)
//   AI_PROVIDER_API_KEY  (legacy fallback)
//   AI_BASE_URL          (default: https://api.openai.com/v1)
//   AI_MODEL             (default: gpt-4o-mini)
//
// If no key is configured, it responds 503 so the frontend cleanly uses its
// built-in rule-based fallback and never claims live AI.

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
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

function getProviderConfig() {
  const key =
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.AI_PROVIDER_API_KEY ||
    "";

  const usesOpenRouter =
    !process.env.OPENAI_API_KEY &&
    !process.env.AI_API_KEY &&
    Boolean(process.env.OPENROUTER_API_KEY);

  return {
    key,
    baseUrl: (process.env.AI_BASE_URL || (usesOpenRouter ? DEFAULT_OPENROUTER_BASE_URL : DEFAULT_OPENAI_BASE_URL)).replace(/\/$/, ""),
    model: process.env.AI_MODEL || DEFAULT_MODEL,
  };
}

function sanitizePage(page) {
  if (typeof page !== "string") return "";
  // Only keep a simple path; never echo arbitrary content back to the model.
  return page.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 120);
}

export default async function handler(req, res) {
  const provider = getProviderConfig();

  if (req.method === "GET" || req.method === "HEAD") {
    const configured = Boolean(provider.key);
    res.status(200).json({
      ok: configured,
      mode: configured ? "ai" : "fallback",
      configured,
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!provider.key) {
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

  const userContext = [
    "Visitor message: " + message,
    page ? "Current page: " + page : "",
    lastMatch ? "Last demo they matched with: " + lastMatch : "",
  ].filter(Boolean).join("\n");

  try {
    const upstream = await fetch(provider.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + provider.key,
      },
      body: JSON.stringify({
        model: provider.model,
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
