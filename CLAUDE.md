# CLAUDE.md

## Project

RareBuilders is a demo-first Vite/React app for Merino Labs. It scouts rare builder opportunities: hidden hackathons, grants, bounties, research challenges, hardware contests, biotech education calls and weird competitions.

Read `docs/PRODUCT.md` before product or UI work. It defines the actual product,
current prototype gap, hackathon demo flow, GPT-5.6 role, connector scope,
visual direction, and definition of done. Do not treat the existing single-page
UI as an architecture or design constraint.

## OpenAI Build Week compliance

Before making product, engineering, dependency, asset, licensing, demo, or
submission changes, read `docs/HACKATHON.md` in full. It is the repository's
living compliance guide and submission checklist. The Official Rules linked
there always take precedence.

Non-negotiable constraints:

- Submit before July 21, 2026 at 5:00 PM PDT (July 22 at 02:00 CEST in Madrid).
- Both Codex and GPT-5.6 must be used meaningfully and evidenced in the product,
  repository, README, demo video, and Devpost submission.
- Preserve dated Git history and the primary Codex build thread; the submission
  requires its `/feedback` Session ID.
- Keep the project runnable and provide judges a stable, free testing path.
- Do not introduce code, data, fonts, images, audio, trademarks, SDKs, or APIs
  without confirming and documenting the relevant rights or license.
- Treat the required public YouTube video, English submission materials,
  repository access/license, and submission checklist as product deliverables.

## Product constraints

- Do not build a generic hackathon directory.
- Optimize for personal edge: fit, hiddenness, realistic win signal, strategic value, and effort.
- Build a decision workflow, not a marketing landing page or static feed.
- Never present a heuristic win signal as a factual probability.
- Clearly distinguish sourced facts, inferences, confidence, and fixture data.
- Keep the demo reliable: fixture data is acceptable when live connectors are brittle.
- Add real connectors behind clean interfaces; do not make the UI depend directly on scraping code.
- Preserve the Merino Labs tone: curious, opinionated, analytical, not kawaii.

## Engineering constraints

- TypeScript strictness should stay green.
- Run `npm run build` before reporting success.
- Keep scoring logic testable/pure where possible.
- Do not add paid external services or secrets without explicit approval.

## Current architecture

- `src/scoring.ts` contains domain types, fixture opportunities and scoring functions.
- `src/App.tsx` is the demo UI.
- `docs/PRODUCT.md` contains the product brief.
