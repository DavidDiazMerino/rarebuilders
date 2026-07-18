# RareBuilders

RareBuilders is personal opportunity intelligence for builders. It finds and
normalizes overlooked challenges, grants and bounties, then ranks a finite set
by the builder's actual edge: fit, win signal, hiddenness, strategic value,
effort and risk.

It is deliberately not another hackathon directory. The product answers:
**which opportunity deserves this builder's limited time, why, and what should
they build if they enter?**

Built for **OpenAI Build Week 2026** in the **Work and Productivity** track.

**Live demo:** [rarebuilders.vercel.app](https://rarebuilders.vercel.app)

## What works

- A deterministic, no-login demo for David's builder context using clearly
  labelled illustrative opportunity samples.
- Two-step onboarding covering six decisions that materially affect ranking.
- A daily radar targeting two practical, two rare and one wildcard opportunity,
  with “closest available” disclosure when the source pool cannot satisfy a bucket.
- Transparent scorecards, evidence, unknowns and reasons to enter or walk away.
- Reuse matching against an editable inventory of existing projects.
- Decisions (saved, entered, passed) and preferences (more/less like this) are
  stored separately. Structured pass reasons teach constraints without sending
  private notes to GPT.
- Public GitHub repository discovery and bounty/issue search.
- Devpost hackathon, EU Funding & Tenders and optional Kaggle discovery.
- Safe URL, PDF or pasted-text ingestion with extraction diagnostics and a normalized preview before saving.
- Private, review-before-applying CV extraction from PDF, DOCX or text.
- Review-before-applying GPT-5.6 builder-memory extraction from selected Markdown and public READMEs, including explicit interests and no-go signals.
- GPT-5.6 opportunity normalization and tailored participation strategies.
- Persistent candidate history, decision library and visible learned preferences.
- Daily connector refresh with a configurable personal 0/2/5 analysis budget.
- Responsive desktop and mobile application shells.

The bundled opportunities are explicitly marked **Illustrative sample**. They
are reference patterns, not claims that those calls currently exist. Once a
personal profile adds any live opportunity, illustrative samples leave its
radar entirely.

## Judge path

The core product can be tested without an account or API key:

1. Open the app in a clean browser.
2. Choose **Explore David's radar**.
3. Compare the five ranked picks and their separate signals.
4. Open **Independent publishing discovery grant**.
5. Inspect the argument for and against, project leverage, evidence and cached
   GPT-5.6 strategy.
6. Return to the radar and select **Pass**; the item disappears, the next
   candidate is promoted, and the action can be undone.
7. Open **Discover** to search current public GitHub bounty issues.
8. Reset from the lower-left profile control and choose **Build my profile** to
   test the personalized path.

Live GPT-5.6 buttons require the server environment described below. Cached
demo results intentionally keep the main judging path reliable if an external
API is temporarily unavailable.

The live golden path uses this exact primary source:
`https://www.unesco.org/creativity/en/international-fund-cultural-diversity`.
Open **Add source**, fetch that URL, review the extracted text, analyze it,
inspect the normalized preview, and add it to the pool. Opportunity analysis is
factual and profile-independent, so identical evidence reuses the same cache
even after feedback changes.

## How it works

```text
Public URL / PDF / pasted call / GitHub issue / selected builder notes
                            │
                            ▼
                  validated server endpoints
                            │
                   GPT-5.6 structured output
                            │
                            ▼
        Opportunity + evidence      Builder project inventory
                    └──────────────┬──────────────┘
                                   ▼
                 bounded deterministic score engine
                                   ▼
       2 practical · 2 rare · 1 wildcard target
          (closest alternatives are disclosed)
                                   ▼
          structured feedback updates the local profile
```

GPT-5.6 owns the work that benefits from language understanding: extracting an
unstructured call, identifying facts versus inferences and unknowns, building
a factual project inventory, and proposing a source-grounded build strategy.
Deterministic TypeScript owns schema validation, score bounds, ranking,
deadlines, persistence, filtering and feedback learning. Hiddenness is also
derived from observable source channel, aggregator reach, geographic scope,
language and visible participation; its confidence and contributing factors
are shown in the dossier. A model never gets to silently invent the final
recommendation.

The three structured-output integrations live in
[`api/_lib/openai.ts`](api/_lib/openai.ts):

- `summarizeBuilderMemory` turns explicitly selected notes and public repository
  context into editable projects and skills;
- `analyzeOpportunitySource` normalizes a real opportunity with evidence and
  material unknowns;
- `generateOpportunityStrategy` produces a project-specific angle, risks and
  exactly three first actions.

## Local setup

Prerequisites: Node.js 22+, npm and, for the full serverless flow, the Vercel
CLI.

```bash
npm install
cp .env.example .env.local
npm run dev:full
```

`npm run dev` runs only the browser application. It is enough for the cached
demo, but `/api` routes require `npm run dev:full`.

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Live AI only | Server-side Responses API access |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6-luna` |
| `UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL` | Live AI only | Shared cache and quota state |
| `UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN` | Live AI only | Upstash REST authentication |
| `AI_GLOBAL_OPERATION_LIMIT` | No | Hard global reservation ceiling; default `40` |
| `AI_OWNER_GLOBAL_OPERATION_LIMIT` | No | Monthly personal ceiling; default `150` |
| `OWNER_ACCESS_CODE_SHA256` | No | Enables higher personal limits without accounts |
| `GITHUB_TOKEN` | No | Raises public GitHub REST limits |
| `KAGGLE_API_TOKEN` | Kaggle only | Current official Kaggle API token |
| `KAGGLE_USERNAME` / `KAGGLE_KEY` | No | Legacy Kaggle credential fallback |

Secrets never use a `VITE_` prefix and are never sent to the browser.

### Spend safeguards

Live model calls fail closed unless Redis is configured. A cache lookup happens
before quota reservation; uncached calls are limited per IP and share one
atomic monthly counter. Request text and output tokens are bounded. Public
traffic defaults to a conservative 40-call deployment ceiling; requests with
the configured personal access code use a separate 150-call ceiling. OpenAI
dashboard budgets are still configured as an additional alert, not treated as
a hard technical control.

## Verification

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

The unit suite covers scoring, learning, storage recovery and SSRF rejection.
The browser test exercises the exact judge journey in Chromium.

## Storage, privacy and security

- The builder profile, projects, private feedback notes and decisions stay in
  localStorage and can be edited, reset, exported or imported.
- Upstash stores content-hash cache keys, model results and anonymous quota
  counters.
- Markdown/text never leaves the browser until the user reviews the selected
  files and presses **Analyze selected context**.
- CV files are sent once as direct model input with storage disabled; the app
  retains only the reviewed structured profile in localStorage.
- GitHub import reads only repositories selected from a public user profile;
  loading a username never preselects repositories.
- Remote URL import accepts only HTTP(S), resolves and rejects private/reserved
  IPs, revalidates redirects, enforces a timeout and a 5 MB response limit, and
  extracts at most 30,000 characters. GitHub issues, EU calls, Devpost
  challenges and configured Kaggle competitions use source-specific adapters;
  generic HTML preserves headings/lists and incorporates JSON-LD metadata.
- Server responses use no-store caching and the deployment applies CSP,
  anti-framing, MIME-sniffing, referrer and permissions headers.

This is a hackathon prototype, not a claim of statistically calibrated win
probability. “Win signal” is always labelled as a heuristic, and eligibility
must be verified at the primary source.

## Codex collaboration

The initial repository contained a small landing-page concept with static
cards. During Build Week, Codex was used as the primary engineering partner to:

- inspect the baseline and translate the product thesis into an incremental
  specification;
- research the official rules and maintain the compliance checklist;
- design the domain contracts, score engine and feedback loop;
- rebuild the visual system and every product route;
- implement Vercel endpoints, GPT-5.6 structured outputs, GitHub connectors,
  Redis caching/quota protection and safe source fetching;
- create fixture data from the entrant's existing project documentation;
- write unit and end-to-end tests, investigate failures and inspect rendered
  desktop/mobile screenshots;
- audit production dependencies, security boundaries and submission
  documentation.

The human entrant chose the product thesis, target user, Work and Productivity
positioning, editorial visual direction, two-path landing experience, six
onboarding decisions, local-first privacy model, public GitHub/Markdown inputs,
MIT release, €10 spend ceiling and which existing projects form the demo
memory. Codex proposed and implemented within those decisions; the entrant
retained product and submission judgment.

The preserved baseline commit is `f7dd2ae`, dated July 17, 2026, after the
official submission period opened. Subsequent commits contain the hackathon
implementation. The primary Codex `/feedback` Session ID belongs in Devpost
and is intentionally not committed here.

## Repository map

```text
api/                 Vercel functions, connectors, GPT and safeguards
shared/domain.ts     Runtime-validated domain contracts
src/data/fixtures.ts Labelled deterministic demo records
src/lib/scoring.ts   Transparent ranking and feedback learning
src/pages/           Radar, dossier, discovery, source and memory flows
docs/HACKATHON.md    Rules summary and submission runbook
docs/PRODUCT.md      Product source of truth
```

Known limitations:

- broad Discord, Telegram, WeChat, X and newsletter crawling is not claimed or
  implemented;
- Devpost discovery depends on its public listing API and fails independently
  if that interface changes;
- Kaggle discovery requires server credentials and its broad competition search
  can return low-relevance results that still need human inspection;
- GitHub public search quality depends on issue authors using useful titles and
  labels;
- some sites block server-side page extraction, so pasted text is the reliable
  fallback;
- there is no account sync or multi-user backend;
- fixtures are curated demonstrations and must not be presented as live calls.

## License and acknowledgements

RareBuilders source is released under the [MIT License](LICENSE). Third-party
libraries, fonts, icons and data provenance are listed in
[`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md).

All contributors should read the [hackathon rules and live submission
checklist](docs/HACKATHON.md) before changing the demo, dependencies, assets or
submission materials.
