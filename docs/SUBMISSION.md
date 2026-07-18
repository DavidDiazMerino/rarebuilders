# OpenAI Build Week submission draft

Working document. Replace every `[pending]` field and re-verify the official
rules before submitting.

## Devpost fields

- **Project:** RareBuilders
- **Track:** Work and Productivity
- **Tagline:** Personal opportunity intelligence for builders who want an edge,
  not another infinite directory.
- **Repository:** `https://github.com/DavidDiazMerino/rarebuilders`
- **Demo:** `https://rarebuilders.vercel.app`
- **Public YouTube video:** `[pending]`
- **Primary Codex Session ID:** `[pending — generate with /feedback]`

## Short description

Builders miss high-fit grants, bounties and competitions because they are
fragmented across obscure sources—and popular directories rank by visibility,
not personal advantage. RareBuilders builds a living model of a builder,
normalizes messy opportunities with GPT-5.6, and recommends up to five finite
moves targeting two practical, two rare and one wildcard. If the available
pool cannot satisfy a bucket, RareBuilders labels the replacement “closest
available” instead of misrepresenting it. Each dossier separates facts from
inference, shows fit, win signal, hiddenness, strategic value, effort and risk,
matches reusable projects, and turns the best opportunity into a concrete
participation strategy.

## What makes it different

RareBuilders does not claim to predict a winner. It makes an asymmetric
decision inspectable. A large competition may score high on strategic value
and low on hiddenness; a small bounty may reverse that balance. Hiddenness is
calculated from observable channel, aggregator, reach, region, language and
participation signals, with its confidence and factors visible in the dossier.
The user sees the trade rather than one magical percentage. Decisions change
the shortlist, while separate preferences change the local builder model.
Structured pass reasons tune constraints; private notes never go to GPT.

The product has a reliable manual URL/text path, live public GitHub discovery,
and clearly labelled fixtures. It does not pretend to crawl private Discord,
Telegram or WeChat communities.

## GPT-5.6

GPT-5.6 performs three essential structured-output tasks:

1. Build an editable project inventory from only the Markdown notes and public
   repositories the user explicitly selects.
2. Normalize an unstructured opportunity into source-linked facts, inferences,
   requirements, deadlines and material uncertainty. It does not rank or
   invent Hiddenness.
3. Generate a builder-specific participation angle, hard risks and exactly
   three first actions using existing assets.

TypeScript validates every model record and deterministically owns Fit,
Hiddenness, Win Signal, Strategic Value, Effort, Risk, hard gates, ranking,
persistence and feedback learning. Factual opportunity analysis is cached by
source evidence—not by the mutable profile—and atomic Redis reservations
protect the API budget.

## Codex

Codex was the primary implementation collaborator across rules research,
product architecture, domain contracts, scoring, visual redesign, Vercel
functions, GPT structured outputs, connectors, privacy/security controls,
testing, failure diagnosis and documentation. The human entrant made the
product thesis, audience, track, design, privacy, data, budget and release
decisions. The Git history preserves the initial prototype baseline and the
subsequent Build Week implementation.

## Suggested screenshots

1. Editorial landing page with the two explicit starting paths.
2. Full radar header and first two opportunities, showing the 2/2/1 mix.
3. Dossier decision section plus signal stack.
4. GPT-5.6 strategy and matched project assets.
5. URL/text source workbench or public GitHub discovery results.
6. Builder-memory consent and selection UI.

Use fresh production screenshots only after the final deployment. Confirm they
contain no token, private filename, browser extension, notification or personal
information beyond what the entrant intends to publish.

## 2:50 video script

### 0:00–0:18 — problem

“The best opportunity is rarely the biggest one. Builders miss small grants,
bounties and challenges because they are scattered across GitHub, newsletters
and local communities. Directories show what is popular; they do not show where
*you* have an edge.”

### 0:18–0:38 — profile

Choose **Explore David's radar**. Briefly show the builder memory.

“RareBuilders combines interests and constraints with work I already own:
products, audiences, workflows and unfinished ideas. A new user can create the
first model with six decisions or import only selected Markdown and public
GitHub context.”

### 0:38–1:12 — radar

Show the radar header and scroll through practical, rare and wildcard picks.

“The output is deliberately finite: it targets two practical opportunities,
two rare ones, and one wildcard. When the source pool cannot meet a definition,
the replacement is visibly marked closest available. Each has separate
personal fit, win signal, hiddenness, confidence and effort. Win signal is a
heuristic—not a fake chance of winning.”

### 1:12–1:48 — dossier and contrast

Open the publishing grant dossier; show the decision, arguments and project
matches. Then briefly reference OpenAI Build Week.

“This hidden regional pattern reuses Reseñas.lat, while OpenAI Build Week is
crowded but strategically valuable. Hiddenness is calculated from visible
source and reach evidence—not generated by the model—and the dossier exposes
every factor. It also makes both the positive case and the reason to walk away
and surfaces what still needs verification.”

### 1:48–2:13 — GPT-5.6

Show the cached strategy, then import this exact source in the add-source
workbench:
`https://www.unesco.org/creativity/en/international-fund-cultural-diversity`.

“GPT-5.6 is the language intelligence layer. It converts an unstructured call
into a validated record, builds an editable inventory from explicitly selected
context, and creates a source-grounded participation angle with hard risks and
three first actions. Deterministic code owns the final bounds and ranking.”

### 2:13–2:31 — feedback

Return to radar, pass one item, undo it, then mark “more like this.”

“My decision and what I want the radar to learn are separate. Passing promotes
the next candidate; a structured reason tunes a relevant constraint. More or
less like this changes canonical domain preferences. The latest signal replaces
its previous effect instead of stacking contradictory votes, and private notes
never leave this browser.”

### 2:31–2:48 — Codex and close

Show a brief Codex/Git diff or test result shot.

“Codex helped turn the initial static mockup into the product: architecture,
structured outputs, connectors, security, the visual system and automated
tests. I made the product, privacy, track and budget decisions. RareBuilders
helps builders stop chasing visibility and start choosing leverage.”

Leave two seconds of visual breathing room. Target 2:48, public YouTube,
spoken English audio and accurate captions.

## Final gate

- [ ] Live GPT call succeeds from the production domain.
- [ ] Deterministic demo succeeds in a clean/incognito browser.
- [ ] Public repository and MIT license are visible.
- [ ] README contains the final demo URL.
- [ ] Video is public, under three minutes, audible and captioned.
- [ ] All Devpost fields and links agree with the shipped functionality.
- [ ] `/feedback` Session ID is copied into Devpost.
- [ ] Official rules and announcements are re-read on submission day.
