# Philip Builds Studio / Neo Labs

Public website and technical portfolio for Philip Miranda.

The current direction is Neo Labs: applied AI, cloud, security-aware front-end systems, and honest learning-in-public documentation. The local-business website studio remains present as the applied/client-style lane in the portfolio.

Open `index.html` in a browser to preview the site.

## Current Focus

Primary proof-of-work:

- Live AI Portfolio Assistant on the public site.
- Same-origin `/api/chat` backend on Vercel, with API keys kept server-side.
- Rule-based fallback when model replies are unavailable.
- Secure RAG Portfolio Search prototype at `ai-lab/secure-rag/index.html`.
- Retrieval Eval Harness at `ai-lab/retrieval-evals/index.html` — a live in-browser regression suite (refusal tests, hit@k checks, honesty states, contract checks) against the Secure RAG engine.
- Secure RAG case study at `case-studies/secure-rag/index.html`.

## Secure RAG Scope

`ai-lab/secure-rag/` is an honest front-end prototype, not a production retrieval platform.

What is live/simulated now:

- Local public-content search over a curated in-browser corpus.
- Ranked result cards with relevance, confidence, source boundary, and claim-safety labels.
- Guardrails for secret-extraction and private-data requests.
- Threat model and prototype-vs-production panels.
- Session-only audit preview and measured local latency.

What remains future work:

- Server-side ingestion pipeline.
- Embeddings and vector database.
- Access-controlled retrieval API.
- Answer synthesis with citations.
- Semantic eval set, prompt regression tests, and persistent privacy-reviewed logs. (A keyword-level regression eval harness is live at `ai-lab/retrieval-evals/`.)

## Folder Map

- `index.html`, `styles.css` - public homepage for Neo Labs / Philip Builds Studio.
- `ai-lab/` - AI Lab pages, including the Secure RAG prototype.
- `case-studies/` - engineering case studies and release notes for shipped proof-of-work.
- `portfolio/` - public portfolio and local-business studio demos.
- `demos/` - clickable public demo apps.
- `shared/` - shared site CSS/JS, assistant UI, and AI config helpers.
- `api/` - Vercel serverless backend endpoints.
- `docs/` - setup and publishing instructions.
- `private/` - ignored internal operating notes and business files.
- `outputs/` - ignored local/generated QA or delivery artifacts.

## Guardrails

- Do not commit API keys, `.env` files, private notes, or generated QA artifacts.
- Do not expose private files through public links.
- Do not claim invented clients, invented revenue, completed credentials, promised outcomes, or production AI infrastructure that is not built.
- Keep status labels honest: Live, Prototype, Planned, Learning.
- For AI changes, run syntax checks, link/static checks where available, and secret scans before committing.
