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

const SYSTEM_PROMPT = `You are the Philip Builds Studio website assistant. Philip Builds Studio builds websites and browser tools for local businesses.

Services and prices (use ONLY these — never invent other prices, tiers, or conditions):
- Starter Site: $150 — a clean, fast landing page.
- Business Site: $300 — multi-section site with contact, services, and proof.
- Site Care: $50/month — ongoing updates, fixes, and monitoring.

Every demo on this site is a fictional, front-end concept — NOT a real business. No real payments, bookings, or form submissions occur in any demo.

Rules you must always follow:
- Never invent clients, testimonials, case studies, awards, statistics, guarantees, or services not listed above.
- Never include URLs, domain names, markdown links [text](url), angle brackets, or placeholder # links. Your reply must be plain conversational text only.
- Keep your reply to 2–3 sentences. Be direct and friendly.
- After your plain-text reply, on its own line, write exactly: NEXT: <key>

Valid NEXT keys and when to use each:
- cleaning — cleaning business, janitorial, quote calculator
- command — operations dashboard, multi-tool, flagship demo
- service — service business landing page, booking flow
- invoice — invoice builder, billing, client handoff
- glosslane — mobile detailing, auto, car wash, field service
- contractor — contractor estimate builder, trades, construction
- kettle — restaurant, café, menu, food business
- portfolio — visitor wants to browse all demos
- matcher — visitor is unsure what to build or needs help choosing
- start — visitor is ready to start a project or contact Philip

If the visitor asks about AI assistants, explain that the assistant is optional, Philip can add a similar assistant to any site, and they can ask on the Start a Project page. Then use NEXT: start.
If you are unsure which key fits, use NEXT: matcher.`;

// Map of safe NEXT keys to validated relative hrefs (matching the routes in shared/assistant.js).
const ROUTE_MAP = {
  cleaning:   { href: "demos/cleaning-quote-calculator/index.html",       label: "Open cleaning demo" },
  command:    { href: "demos/local-business-command-center/index.html",   label: "Open flagship demo" },
  service:    { href: "demos/service-business-landing-page/index.html",   label: "Open service demo" },
  invoice:    { href: "demos/invoice-builder/index.html",                 label: "Open invoice builder" },
  glosslane:  { href: "demos/mobile-detailing-landing-page/index.html",   label: "Open detailing demo" },
  contractor: { href: "demos/contractor-estimate-builder/index.html",     label: "Open estimate builder" },
  kettle:     { href: "demos/restaurant-menu-page/index.html",            label: "Open café menu demo" },
  portfolio:  { href: "portfolio/index.html",                             label: "Browse portfolio" },
  matcher:    { href: "project-matcher/index.html",                       label: "Find your fit" },
  start:      { href: "start-project/index.html",                         label: "Start a project" },
};

function extractRoute(text) {
  const match = text.match(/\bNEXT:\s*(\w+)/i);
  if (!match) return null;
  return ROUTE_MAP[match[1].toLowerCase()] || null;
}

function sanitizeReply(text) {
  // Strip the NEXT: directive line wherever it appears.
  let clean = text.replace(/\bNEXT:\s*\w+[^\n]*/gi, "").trim();
  // Strip markdown links [label](url) → keep label text only.
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Strip bare http/https URLs.
  clean = clean.replace(/https?:\/\/[^\s]+/g, "");
  // Collapse any extra whitespace left behind.
  return clean.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

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
      // Log safe diagnostic info to Vercel function logs (no key, no message content).
      let errType = "";
      try {
        const errJson = await upstream.json();
        if (errJson && errJson.error && typeof errJson.error.type === "string") {
          errType = errJson.error.type;
        }
      } catch (_) {}
      console.error("[api/chat] upstream", upstream.status, errType || upstream.statusText || "");
      res.status(502).json({ error: "Upstream error", upstream: upstream.status, upstreamType: errType || undefined });
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
      console.error("[api/chat] empty reply from upstream");
      res.status(502).json({ error: "Empty reply" });
      return;
    }

    const route = extractRoute(reply);
    const cleanReply = sanitizeReply(reply);

    // Primary link from AI's NEXT key (validated against whitelist); fall back to matcher.
    const primary = route || ROUTE_MAP.matcher;
    // Secondary: always offer start-project unless that's already the primary.
    const secondary = primary.href === ROUTE_MAP.start.href ? ROUTE_MAP.matcher : ROUTE_MAP.start;

    res.status(200).json({
      reply: cleanReply,
      links: [[primary.label, primary.href], [secondary.label, secondary.href]],
    });
  } catch (e) {
    // Log the error type without leaking message contents or secrets.
    const msg = e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120);
    console.error("[api/chat] handler error:", msg);
    res.status(502).json({ error: "Request failed" });
  }
}
