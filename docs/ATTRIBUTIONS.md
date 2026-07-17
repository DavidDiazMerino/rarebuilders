# Attributions and provenance

Last audited: 2026-07-17.

## Application work

- RareBuilders application code, visual system, copy and the target/radar
  favicon are original Build Week work by the entrant with Codex collaboration.
- License: MIT; see [`LICENSE`](../LICENSE).
- `src/assets/hero.png` was generated at the entrant's request with Codex in a
  prior session for the initial prototype. It is not imported, copied into the
  production build, displayed, or used in submission materials.

## Runtime and development dependencies

Package licenses are recorded in each installed package and remain owned by
their respective authors. Principal direct dependencies:

| Package | Purpose | License |
| --- | --- | --- |
| React / React DOM / React Router | UI and routing | MIT |
| OpenAI Node SDK | Responses API and structured outputs | Apache-2.0 |
| Zod | Runtime contracts | MIT |
| Upstash Redis | cache and quota client | MIT |
| Cheerio | safe HTML text extraction | MIT |
| ipaddr.js | private/reserved IP rejection | MIT |
| Lucide React | interface icons | ISC |
| Fontsource Inter | self-hosted Inter files | SIL OFL 1.1 |
| Fontsource Newsreader | self-hosted Newsreader files | SIL OFL 1.1 |
| Vite / TypeScript / Vitest / Playwright | build and verification | respective open-source licenses |

Run `npm install` from the committed lockfile to recover the exact dependency
graph. `npm audit --omit=dev` reported zero production vulnerabilities on the
audit date.

## Data

- **OpenAI Build Week:** fixture facts link to the official Devpost page and
  exist to compare a crowded, strategically valuable opportunity. Verify them
  against the primary source before submission.
- **Other bundled opportunities:** original curated demo patterns written for
  RareBuilders. They are marked `fixture: true`, labelled “Demo dataset” in the
  UI and must not be described as live competitions.
- **Builder projects:** short factual summaries derived from the entrant's own
  local project READMEs (Reseñas.lat, StarForge, PorraHub / Oráculo and AGI
  Noel). No private source content is bundled.
- **GitHub results:** fetched on demand from GitHub's public REST API and linked
  back to the originating public issue or repository.
- **Imported pages and notes:** transient user-supplied inputs; not part of this
  repository.

## Submission media

No music, stock photography or third-party raster art is included in the
application. Any later screenshots, narration, music or video assets must be
added to this record before submission.
