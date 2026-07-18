# RareBuilders product specification

> This is the product source of truth. The current UI is an early concept
> prototype, not the hackathon MVP described here.

## One-liner

RareBuilders is a personal opportunity radar that finds overlooked
competitions, grants, bounties, and builder calls, ranks them by personal edge
and realistic win signal, and turns the best ones into concrete build plans.

## Product thesis

Builders do not need another directory ordered by deadline or prize size.
Directories optimize for coverage and popularity. RareBuilders optimizes for
**personal edge**:

- Is this opportunity unusually relevant to this builder?
- Is it obscure or constrained enough to be less saturated?
- Does the builder already own projects, knowledge, or assets that create an
  advantage?
- Is the effort justified by money, access, visibility, learning, or a reusable
  artifact?
- What is the most credible project this builder could submit?

The valuable opportunities are often fragmented across local institutions,
small communities, other languages, GitHub issues, newsletters, PDFs, Discord
announcements, and posts with little distribution. Hiddenness is not a novelty
filter; it is a possible source of asymmetric advantage.

RareBuilders is therefore an **opportunity recommender and decision system**,
not a hackathon search engine and not a prettier Devpost.

## Initial user and job to be done

The initial user is David: a solo builder with several existing projects, broad
interests, limited weekly time, and a high tolerance for strange but plausible
opportunities.

The core job:

> Every morning, tell me which five opportunities deserve my attention, why
> they fit me, what could make me competitive, what they will cost, and what I
> should build if I enter.

The daily mix is:

- 2 practical opportunities;
- 2 rare but plausible opportunities;
- 1 wildcard from another domain.

Each receives a verdict: **Enter**, **Investigate**, **Monitor**, **Recycle the
idea**, or **Ignore**.

After proving the personal workflow, the same engine can serve other builders,
small studios, innovation teams, incubators, universities, and agencies.

## The product loop

RareBuilders should behave more like Spotify or Netflix than a form plus table:

1. Build a living model of the builder.
2. Ingest opportunities from visible and obscure sources.
3. Normalize claims and retain links/evidence.
4. Rank opportunities using transparent, separate signals.
5. Explain the upside, downside, uncertainty, and recommended action.
6. Cross each opportunity with existing projects and reusable assets.
7. Generate a concrete participation strategy for promising opportunities.
8. Learn from saves, rejections, requests for more, submissions, and outcomes.

The profile is updated through use. Onboarding only creates the first useful
version of it.

## Implementation status

The July 17 baseline was a landing-page concept with four static cards. The
Build Week implementation now covers the promised end-to-end product loop:

- two-step, six-decision onboarding and editable local builder memory;
- optional, consent-based Markdown and public GitHub project import with an
  editable review of extracted interests, exploratory topics and no-go signals;
- URL/PDF/text opportunity ingestion with source-specific adapters, extraction
  diagnostics and a review step;
- public GitHub issue discovery;
- Devpost, EU Funding & Tenders and optional Kaggle discovery behind one
  candidate contract;
- editable CV-derived professional evidence without retaining the raw file;
- persistent source states, full decision history and a decision library;
- daily source refresh with a protected personal automatic-analysis budget;
- structured GPT-5.6 profile, opportunity and strategy analysis;
- an evidence-linked dossier with facts, inferences and unknowns;
- bounded deterministic scoring and a 2 practical / 2 rare / 1 wildcard radar;
- project reuse matching and persistent feedback learning;
- labelled fixtures and cached strategies for a deterministic judge path;
- a responsive editorial application shell, unit tests and a Chromium journey.

The remaining work is operational rather than core product implementation:
configure hosted OpenAI/Upstash credentials, deploy and smoke-test the live
functions, publish the repository, then prepare the video and Devpost entry.
Broad private-community crawling and account sync remain explicit non-goals.

## Hackathon MVP promise

For the OpenAI Build Week demo, a user must be able to:

1. Create or inspect a meaningful builder profile.
2. Add at least one real opportunity from a URL or supported source.
3. Watch GPT-5.6 turn the source into a normalized, evidence-linked record.
4. See a five-item radar divided into practical, rare, and wildcard picks.
5. Understand separate Fit, Win Signal, Hiddenness, Strategic Value, and Effort
   scores without mistaking them for objective probabilities.
6. Open an opportunity dossier with reasons for and against entering.
7. See the opportunity matched against existing projects and assets.
8. Generate a concrete strategy and build angle.
9. Save, enter or pass independently from asking for more or fewer
   opportunities of a type, and see the radar change.
10. Compare a crowded strategic opportunity with a hidden high-edge one.

Anything that does not strengthen this journey is secondary.

## Primary demo story

The shortest credible story is:

1. **The builder.** David has 12-18 hours, builds agents and creative tools,
   prefers visibility/access, has several reusable projects, and accepts one
   wildcard.
2. **The raw opportunity.** Paste or select a real source. GPT-5.6 extracts the
   deadline, eligibility, reward, requirements, audience, source evidence, and
   unknowns.
3. **The radar.** The system assembles today's five opportunities: two
   practical, two rare, one wildcard.
4. **The contrast.** OpenAI Build Week scores low on Hiddenness and Win Signal
   but high on Strategic Value. A small, obscure challenge scores higher on
   Hiddenness and achievable edge.
5. **The personal advantage.** RareBuilders connects an opportunity to one of
   David's existing projects or assets and explains the leverage.
6. **The decision.** The dossier shows why to enter, why not to, expected cost,
   uncertainties, and a proposed build.
7. **The learning loop.** Pass with a structured reason or select “More like
   this”; the visible recommendations and explanation change without sending a
   private note to the model.

The demo should prove a decision became easier. It should not be a tour of
cards and labels.

## Information architecture

### 1. Radar

The default screen is a working product dashboard, not a marketing hero.

It contains:

- today's date and a concise "5 opportunities for you" statement;
- a distribution indicator: 2 practical / 2 rare / 1 wildcard;
- a compact profile/availability summary;
- five recommendation cards with an explicit verdict;
- provenance, freshness, deadline, and confidence;
- the reason this recommendation exists;
- fast actions: Save, Pass, More like this, Open dossier.

### 2. Opportunity dossier

The dossier is where the product earns trust:

- source and direct evidence link;
- extracted facts versus inferred values;
- deadline with timezone and urgency;
- eligibility and hard requirements;
- reward type and estimated participation cost;
- Fit, Win Signal, Hiddenness, Strategic Value, Effort Fit, and Risk;
- confidence/unknowns for every estimate;
- why it fits;
- why it may be a bad idea;
- comparable/crowded alternatives;
- reusable projects and assets;
- recommended build angle;
- entry strategy and first three actions;
- feedback and decision state.

### 3. Builder model

Onboarding must capture enough information to change recommendations:

- interest domains;
- explicit wildcard domains;
- hard no-go areas;
- things the builder can ship quickly;
- technologies the builder wants to explore;
- preferred reward: money, access, visibility, learning, or portfolio;
- language and region comfort;
- tolerance for small competitions and strange rules;
- tolerance for large but strategic competitions;
- available hours and deadline pressure;
- solo/team mode;
- existing projects, ideas, knowledge, audiences, and reusable assets.

The builder model must show what the system has learned from feedback and allow
the user to correct it.

### 4. Inbox / add opportunity

The MVP needs a credible real input path:

- paste a public opportunity URL;
- optionally paste raw text when fetching is blocked;
- show extraction progress;
- display the normalized output and evidence before saving;
- expose missing or uncertain fields instead of inventing them.

### 5. Saved and decisions

Persist two independent state families:

- decision: Saved, Entered or Passed;
- preference: More like this or Less like this;
- structured pass reason: time, reward, eligibility, team, deadline,
  source trust, domain fit or other;
- optional private note, retained locally and never sent to GPT.

The latest event per opportunity and state family owns its learning effect.

## The scorecard

Do not collapse all reasoning into one unexplained number. Show separate,
interpretable scores and then an overall verdict.

### Personal Fit

Signals include:

- domain and skill overlap;
- language and region;
- preferred rewards;
- solo/team constraints;
- desired technologies;
- project/asset reuse;
- previous feedback.

### Win Signal

This is a heuristic signal, **not a factual probability of winning**:

- visible participant count or credible discoverability proxy;
- niche/community size;
- restrictive rules that reduce the qualified field;
- regional or language saturation;
- deadline versus reusable work;
- strength of the builder-specific angle;
- confidence in the underlying evidence.

Never show a fabricated percentage such as "63% chance of winning."

### Strategic Value

Value even without a prize:

- portfolio strength;
- sponsor or community relationship;
- useful credits or access;
- reusable product artifact;
- content/distribution potential;
- alignment with a longer product line.

### Participation Cost

- estimated build hours;
- video/demo/repository work;
- legal and IP burden;
- paid APIs or hardware;
- team requirements;
- language and bureaucracy;
- deadline risk.

### Hiddenness

RareBuilders' signature signal estimates how non-obvious the opportunity is:

- absent from mainstream competition directories;
- discovered in a small Discord, GitHub thread, local site, PDF, or newsletter;
- low-engagement original announcement;
- non-global language or regional distribution;
- little visible participant activity;
- difficult discovery path.

Hiddenness is only valuable when paired with fit and credible evidence. An
obscure but irrelevant opportunity is not a good recommendation.

### Risk and confidence

Every recommendation needs:

- confidence in extracted facts;
- freshness of source;
- missing information;
- potential eligibility/IP/cost blockers;
- an explanation of which values are facts and which are estimates.

## GPT-5.6's product role

GPT-5.6 must perform essential, visible work:

- extract and normalize unstructured opportunity pages or pasted text;
- identify requirements, exclusions, deadlines, and ambiguous claims;
- classify source type and provide evidence snippets/links;
- infer candidate domains and cost drivers with uncertainty;
- match an opportunity against the builder's projects and assets;
- explain the separate scores without fabricating certainty;
- generate reasons for and against entering;
- propose a tailored build angle and short participation strategy;
- translate or summarize non-English opportunity material when appropriate.

Deterministic code should own validation, time calculations, eligibility gates,
score bounds, persistence, and sorting. GPT-5.6 supplies structured analysis,
not arbitrary final truth.

The demo must make this division visible.

## Connector strategy

Use a clean connector interface so normalized opportunities do not depend on a
specific source.

### Required for the MVP

1. **Manual URL/text drop:** the reliable real-ingestion path.
2. **One searchable public source:** preferably GitHub issues/discussions or
   another source with stable, lawful access.
3. **Curated fixtures:** only as a deterministic fallback and comparison set;
   clearly label them as demo data where relevant.

### Strong stretch goal

4. RSS/newsletter feeds.
5. A Devpost importer or saved-link flow.

### Later

- X/Twitter assisted search;
- Reddit;
- Discord communities where the user has access;
- Telegram and manual WeChat relay;
- university, government, and foundation PDFs;
- Eventbrite/Meetup;
- Kaggle, AIcrowd, DoraHacks, Lablab, and MLH;
- monitoring selected organizations over time.

Do not claim live Discord, Telegram, WeChat, or broad-web coverage in the MVP
unless it is actually implemented and demonstrable.

## Data model

### BuilderProfile

- domains and wildcard domains;
- hard no-go zones;
- fast-shipping skills;
- technologies to explore;
- reward preferences;
- weekly hours;
- languages and regions;
- risk/rarity appetite;
- solo/team mode;
- existing projects and reusable assets;
- learned preferences and feedback history.

### Opportunity

- title and organizer;
- canonical URL and evidence;
- source/source type;
- discovered and last-verified timestamps;
- region and language;
- deadline and timezone;
- eligibility;
- reward;
- visible participants or discoverability proxy;
- requirements and deliverables;
- domains;
- estimated cost;
- uncertainties and extraction confidence;
- raw/normalized provenance.

### Evaluation

- personal fit;
- win signal;
- hiddenness;
- strategic value;
- effort fit;
- risk;
- confidence;
- overall verdict;
- reasons for;
- reasons against;
- reusable assets;
- proposed build angle and strategy.

### Feedback

- user;
- opportunity;
- action;
- optional reason;
- timestamp;
- profile changes attributable to the action.

## Visual direction

RareBuilders should feel like an opinionated intelligence instrument: calm,
specific, editorial, and information-dense.

Use:

- a real application shell with restrained navigation;
- compact hierarchy and strong typography;
- one purposeful accent rather than multiple glowing colors;
- visible evidence, confidence, and status;
- score bars or small calibrated graphics rather than decorative circles;
- dossier panels that reward inspection;
- excellent empty, loading, extraction, error, and success states;
- responsive behavior designed for both desktop demo and laptop judges.

Avoid:

- oversized landing-page heroes;
- generic glassmorphism;
- endless identical cards;
- pill-shaped controls everywhere;
- fake charts or decorative radar graphics;
- gradients used as a substitute for hierarchy;
- product claims that the UI cannot demonstrate;
- Spanish-only submission/demo UI without an English path.

The interface should make a hard recommendation and show its evidence. It
should not look like a template for an AI SaaS landing page.

## Definition of done for the hackathon

The MVP is done only when:

- [ ] A first-time user understands the product without explanatory narration.
- [ ] Profile choices materially alter the radar.
- [ ] At least one real opportunity can be ingested end to end.
- [ ] GPT-5.6 visibly produces a validated normalized record and tailored
      analysis.
- [ ] Today's radar contains the promised 2 practical / 2 rare / 1 wildcard.
- [ ] Every score has an explanation and confidence.
- [ ] A real dossier includes both reasons for and against entering.
- [ ] At least one existing project is matched to an opportunity.
- [ ] A tailored build strategy can be generated.
- [ ] Feedback changes persisted state and subsequent recommendations.
- [ ] The crowded-versus-hidden contrast is obvious.
- [ ] Demo fixtures are labelled and never presented as live discoveries.
- [ ] The core flow survives refresh and handles failure gracefully.
- [ ] The visual experience feels like a coherent product, not a landing-page
      mockup.
- [ ] A judge can use the deployed app without credentials, secrets, or local
      setup.

## Hackathon positioning

Recommended track: **Work & Productivity**.

RareBuilders helps builders decide where to invest scarce work time and turns
fragmented opportunity discovery into an actionable workflow. Developer Tools
is a weaker alternative unless the submitted product is repositioned around
the connector/agent infrastructure rather than the builder's decision system.

Pitch:

> Builders miss high-fit opportunities because they are scattered across
> obscure communities, languages, and platforms. RareBuilders profiles a
> builder, finds and normalizes visible and hidden opportunities, ranks them by
> personal fit and realistic win signal, and turns each one into a concrete
> build strategy.

## Non-goals for Build Week

- Comprehensive crawling of the entire web.
- Unsupported access to private communities.
- A statistically valid probability of winning.
- Forty shallow connectors.
- Multi-tenant organization administration.
- Billing.
- A generic hackathon directory.
- A marketing site presented as the product.
