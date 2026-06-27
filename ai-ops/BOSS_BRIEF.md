# Philip Builds Studio — Boss Brief
## Main goal
Philip Builds Studio should become a premium, cinematic, scroll-heavy portfolio and demo system for local business websites, booking flows, quote tools, calculators, dashboards, and small business workflow pages.
The current issue is that many demos feel too short, too static, and too similar. The demos need to feel like full products, not half-finished cards.
## Current priority
Rebuild Tier 1 demos into full-page long-scroll experiences with:
- real phone mockup presentation
- real desktop/browser mockup presentation
- animation and scroll reveal
- longer sections
- interactive elements
- fictional disclaimers
- mobile-first quality
- desktop polish
- no fake claims
## Tier 1 demos
These must be upgraded first:
1. `demos/local-business-command-center/`
2. `demos/service-business-landing-page/`
3. `demos/mobile-detailing-landing-page/`
4. `demos/restaurant-menu-page/`
5. `demos/cleaning-quote-calculator/`
6. `demos/invoice-builder/`
## Tier 2 demos
Do not touch these until Tier 1 is fully rebuilt and QA’d:
1. `demos/contractor-estimate-builder/`
2. `demos/simple-booking-request/`
3. `demos/appointment-reminder-page/`
4. `demos/barber-booking-landing-page/`
5. `demos/tip-split-calculator/`
6. `demos/shift-downtime-calculator/`
7. `demos/cashflow-lab/`
## Style direction
The user wants inspiration from:
- Framer-style product polish
- Phenomenon Studio-style long-scroll density
- Apple-style motion and spacing
- dark premium product-showcase pages
- cinematic dashboards
- moving UI cards
- phone and desktop mockups
Do not copy those sites, assets, layouts, text, images, logos, or proprietary visuals. Use only inspiration for energy, motion, pacing, and polish.
## Business positioning
Philip Builds Studio builds practical websites and simple tools for local operators:
- business websites
- booking flows
- quote forms
- calculators
- dashboards
- workflow tools
- customer-ready pages
- small business command centers
## Hard boundaries
- No Gmail.
- No email sending.
- No outreach.
- Do not touch private files.
- Do not expose private files.
- Do not stage `.claude/`.
- Do not modify `AGENTS.md`.
- Do not modify `CLAUDE.md`.
- No force push.
- No PR unless explicitly requested.
- No fake testimonials.
- No fake clients.
- No fake awards.
- No fake results.
- No fake statistics.
- No stock photos.
- No external image URLs.
- No external JS libraries.
- No external CSS libraries.
- No Google Fonts.
- No tracking.
- No analytics.
- No backend.
- No real form submission.
- No “AI-powered.”
- No “AI-assisted.”
- No “10x.”
- No “hundreds of clients.”
- No “digital solutions.”
- Use “Philip” / “I”, not fake agency “we.”
- All demo content must be clearly fictional.
- Buttons that do not submit must use `type="button"`.
- Must work on GitHub Pages.
- Do not commit/push until Philip says `run`.
## Current workflow
Claude acts as:
- creative director
- boss
- spec writer
- reviewer
Codex acts as:
- senior front-end engineer
- implementation lead
- QA runner
- report writer
Claude writes:
- `ai-ops/CLAUDE_SPEC.md`
- `ai-ops/CODEX_TASKS.md`
Codex reads:
- `ai-ops/BOSS_BRIEF.md`
- `ai-ops/CLAUDE_SPEC.md`
- `ai-ops/CODEX_TASKS.md`
- `ai-ops/PROJECT_STATUS.md`
Codex writes:
- `ai-ops/CODEX_REPORT.md`
- `ai-ops/PROJECT_STATUS.md` only after successful build/QA
## Approval rule
Codex must not commit or push until Philip says exactly:
`run`
