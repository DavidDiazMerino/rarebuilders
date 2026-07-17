# CLAUDE.md

## Project

RareBuilders is a demo-first Vite/React app for Merino Labs. It scouts rare builder opportunities: hidden hackathons, grants, bounties, research challenges, hardware contests, biotech education calls and weird competitions.

## Product constraints

- Do not build a generic hackathon directory.
- Optimize for personal edge: fit, hiddenness, realistic win signal, strategic value, and effort.
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
