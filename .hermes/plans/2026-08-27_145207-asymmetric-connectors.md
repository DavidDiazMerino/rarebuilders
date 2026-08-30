# Asymmetric Source Connectors Implementation Plan

> **For Hermes:** Implement task-by-task with TDD and review existing uncommitted Builder Memory work before touching shared contracts.

**Goal:** Replace RareBuilders’ fixed directory-search connectors with a privacy-aware source monitoring system that discovers niche opportunities early, preserves provenance, and ranks qualified competition rather than raw registrations.

**Architecture:** Introduce `SourceSubscription` and `RawSignal` as stable boundaries. Collectors fetch or receive changes; adapters parse known source formats; cheap deterministic rules promote signals into `OpportunityCandidate`; GPT only normalizes reviewed candidates. Existing GitHub/Devpost/EU/Kaggle integrations become registered adapters rather than enum-coupled product concepts.

**Tech Stack:** TypeScript, Zod, Vercel functions, React, localStorage v4 migration, Vitest, Playwright, RSS/Atom XML parsing, bounded HTTP fetching, optional OAuth-backed relays.

---

## Preconditions

- The working tree already contains uncommitted Builder Memory changes. Inspect and preserve them before implementation.
- Do not add LinkedIn scraping.
- Do not expose email/Discord raw content to public exports.
- Do not introduce X spend until a monthly read budget is explicit.
- `docs/PRODUCT.md` remains product source of truth.

## Task 1: Add source-domain contracts

**Objective:** Model sources and raw observations independently from connectors and candidates.

**Files:**
- Modify: `shared/domain.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/lib/storage.ts`

**Steps:**
1. Write failing schema tests for `SourceSubscription` and `RawSignal`.
2. Include source kind, privacy, auth mode, cadence, trust, cursor, ETag/hash, last checked/changed, query/endpoint and source packs.
3. Add `sources: SourceSubscription[]` and `signals: RawSignal[]` to `AppData` version 4.
4. Write migration test from version 3 to empty sources/signals without losing profile, feedback, projects or candidates.
5. Run `npm test -- src/lib/storage.test.ts` and verify red then green.
6. Run `npm run build`.

## Task 2: Replace the compile-time connector union with a registry

**Objective:** Add a source or adapter without editing UI/domain enums.

**Files:**
- Create: `api/_lib/source-registry.ts`
- Create: `api/_lib/source-registry.test.ts`
- Modify: `api/_lib/connectors.ts`
- Modify: `api/discover/search.ts`
- Modify: `src/lib/api.ts`

**Steps:**
1. Write a failing registry test that registers an adapter by runtime ID and reports its capabilities.
2. Define `SourceCapability` with id, label, collector kinds, auth/configuration state, cost class and privacy support.
3. Register the four existing adapters in the registry.
4. Replace `max(4)` fixed-enum validation with validated registry IDs and a bounded maximum source count.
5. Return capabilities from a read-only API endpoint.
6. Verify unknown IDs fail closed and one adapter failure does not fail the aggregate.

## Task 3: Make Discover render server capabilities

**Objective:** Remove duplicated hardcoded connector labels from the UI.

**Files:**
- Modify: `src/pages/DiscoverPage.tsx`
- Modify: `src/lib/api.ts`
- Create: `src/pages/DiscoverPage.test.tsx`

**Steps:**
1. Write a failing component test with a fake capability not present in source code.
2. Fetch and render capabilities grouped as Catalogues, Monitors and Private Relays.
3. Show setup-needed, paid, private and experimental states.
4. Preserve source history when a capability becomes unavailable.
5. Verify mobile and keyboard behavior.

## Task 4: Implement RSS/Atom collection

**Objective:** Monitor stable feeds without LLM calls when unchanged.

**Files:**
- Create: `api/_lib/collectors/feed.ts`
- Create: `api/_lib/collectors/feed.test.ts`
- Create: `api/_lib/collectors/types.ts`

**Steps:**
1. Write fixtures for RSS 2.0 and Atom with GUID/id, link, title, summary, author and published date.
2. Test conditional requests using ETag and Last-Modified.
3. Normalize entries to `RawSignal` with stable IDs and content hashes.
4. Prove a repeated unchanged response produces zero new signals.
5. Bound response size, redirects and timeout through the existing safe-fetch boundary.
6. Reject private/reserved hosts and malformed XML safely.

## Task 5: Implement page-change monitoring

**Objective:** Turn arbitrary official pages into cheap monitors.

**Files:**
- Create: `api/_lib/collectors/page.ts`
- Create: `api/_lib/collectors/page.test.ts`
- Reuse: `api/_lib/safe-fetch.ts`

**Steps:**
1. Write failing tests for unchanged hash, changed content, blocked page and oversized response.
2. Extract semantic title/headings/lists/links and stable text.
3. Store current hash and bounded unified diff metadata.
4. Emit `RawSignal` only when the source changes materially.
5. Add selectors/ignore patterns to suppress countdowns, rotating ads and timestamps.
6. Verify a page monitor can cover Hackster, Printables and Pollen-style fixtures without bespoke code.

## Task 6: Add deterministic signal promotion

**Objective:** Prevent every feed item or page change becoming an opportunity.

**Files:**
- Create: `shared/opportunity-signals.ts`
- Create: `shared/opportunity-signals.test.ts`

**Steps:**
1. Write failing tests for positive terms: application, call, bounty, prize, grant, challenge, hardware kit, submissions open.
2. Add negative/closed/stale patterns and exact deadline parsing with timezone preservation.
3. Require at least two independent opportunity signals or one strong structured signal.
4. Keep ambiguous signals in an inbox without GPT analysis.
5. Record why a signal was promoted or suppressed.

## Task 7: Add source packs

**Objective:** Encode repeatable scouting lanes instead of ad-hoc queries.

**Files:**
- Create: `src/data/source-packs.ts`
- Create: `src/data/source-packs.test.ts`
- Modify: `src/pages/ProfilePage.tsx` or create `src/pages/SourcesPage.tsx`

**Initial packs:**
- Agent infrastructure
- Robotics/hardware
- Sports analytics
- Creative/music/film
- Bio/CRISPR wildcard

**Steps:**
1. Test pack activation adds subscriptions idempotently.
2. Store sources, query templates, positive/negative terms, languages, cadence and expected opportunity types.
3. Allow per-profile enable/disable and cadence override.
4. Show which pack/source produced each candidate.

## Task 8: Improve GitHub opportunity quality

**Objective:** Stop treating nominally open but saturated issues as available bounties.

**Files:**
- Modify: `api/_lib/github.ts`
- Modify: `api/_lib/connectors.ts`
- Modify: `api/_lib/github.test.ts`

**Steps:**
1. Add failing tests for 1,000 comments, active claims, existing PRs, closed linked PR and requester completion signals.
2. Parse reward amount/currency.
3. Fetch bounded comments/linked PR counts only for top candidates.
4. Store `claims`, `openPrs`, `mergedPrs`, `comments` and saturation confidence.
5. Suppress obviously overclaimed bounties.

## Task 9: Add Hiddenness 2.0 candidate metadata

**Objective:** Rank asymmetric opportunity distribution before expensive normalization.

**Files:**
- Modify: `shared/domain.ts`
- Modify: `src/lib/candidates.ts`
- Modify: `src/lib/candidates.test.ts`

**Fields:**
- channel reach class
- first seen timestamp
- mainstream seen timestamp
- registrations/submissions/claims/PRs
- qualification barriers
- source depth
- source freshness/confidence

**Steps:**
1. Test that 10,000 registrations with unknown submissions is not treated as 10,000 competitors.
2. Test that track segmentation and mandatory niche integration reduce the qualified-field signal without fabricating a count.
3. Test that private source status alone does not create a recommendation.
4. Include approved Builder Memory, active project conflicts and reusable assets in pre-fit.

## Task 10: Add a private email relay

**Objective:** Ingest newsletters and forwarded announcements without exposing the inbox.

**Files:**
- Create: `api/_lib/collectors/email.ts`
- Create: `api/_lib/collectors/email.test.ts`
- Create: `api/sources/email/import.ts`

**First implementation:** manual `.eml`/forwarded text or local Gmail label import. Add push/PubSub only after the local flow proves useful.

**Steps:**
1. Parse sender, subject, date, text, links and message ID.
2. Mark every email signal private.
3. Strip tracking URLs and canonicalize links.
4. Never send full raw email to GPT by default; show reviewed excerpts.
5. Exclude email body from public export.

## Task 11: Add browser relay before LinkedIn integration

**Objective:** Capture blocked/social pages through explicit user action.

**Files:**
- Create: `src/pages/RelayPage.tsx`
- Create: `src/lib/relay.ts`
- Create: `src/lib/relay.test.ts`

**Steps:**
1. Accept URL + pasted/selected text + source label.
2. Preserve canonical URL, author, timestamp and visibility.
3. Default LinkedIn/Discord content to private.
4. Add duplicate detection against existing raw signals.
5. Later expose a bookmarklet/browser extension, but do not build it in this phase.

## Task 12: Add X and Discord only after monitoring core is green

### X
- Account/list watchlists and narrow queries only.
- Explicit monthly resource/read budget.
- Cache post IDs forever; never pay to re-read unchanged posts.
- Disable gracefully when credentials or budget are absent.

### Discord
- Allowlisted guild/channel IDs only.
- Require bot permissions and Message Content intent.
- Prefer a `Forward to RareBuilders` command for communities that will not install the bot.
- Store raw text privately and support channel revocation/deletion.

LinkedIn remains browser relay/manual import because general read/search access is restricted.

## Verification

Run after every vertical slice:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

Add E2E journeys for:

1. activate Robotics source pack;
2. page unchanged → no candidate/no AI;
3. page changed → one private/raw signal;
4. review/promote signal → candidate;
5. private email/Discord source absent from export;
6. overclaimed GitHub bounty suppressed;
7. discovered-via path visible in dossier.

## Risks and tradeoffs

- Page monitors need noise suppression or every timestamp creates false changes.
- Private sources require deletion/revocation semantics before sync/accounts.
- X costs can become unbounded without immutable monthly limits.
- Discord access is community-specific, not global discovery.
- Search-provider results need primary-source verification before recommendation.
- Source packs can become stale; every source needs health/freshness state.
- Existing uncommitted Builder Memory changes must be reviewed before domain version migration.

## Recommended implementation order

**Batch 1:** Tasks 1–6 — source model, registry, RSS/page monitor and promotion.  
**Batch 2:** Tasks 7–9 — packs, GitHub quality and Hiddenness 2.0.  
**Batch 3:** Tasks 10–11 — private relays.  
**Batch 4:** Task 12 — X/Discord after evidence of value.
