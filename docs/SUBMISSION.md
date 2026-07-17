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
normalizes messy opportunities with GPT-5.6, and recommends five finite moves:
two practical, two rare and one wildcard. Each dossier separates facts from
inference, shows fit, win signal, hiddenness, strategic value, effort and risk,
matches reusable projects, and turns the best opportunity into a concrete
participation strategy.

## What makes it different

RareBuilders does not claim to predict a winner. It makes an asymmetric
decision inspectable. A large competition may score high on strategic value
and low on hiddenness; a small bounty may reverse that balance. The user sees
the trade rather than one magical percentage. Feedback changes a local builder
model, so rejecting an opportunity actually changes the next radar.

The product has a reliable manual URL/text path, live public GitHub discovery,
and clearly labelled fixtures. It does not pretend to crawl private Discord,
Telegram or WeChat communities.

## GPT-5.6

GPT-5.6 performs three essential structured-output tasks:

1. Build an editable project inventory from only the Markdown notes and public
   repositories the user explicitly selects.
2. Normalize an unstructured opportunity into source-linked facts, inferences,
   requirements, deadlines, uncertainty and bounded heuristic inputs.
3. Generate a builder-specific participation angle, hard risks and exactly
   three first actions using existing assets.

TypeScript validates every model record and owns score bounds, filtering,
ranking, persistence and feedback learning. Cached results protect the judge
path; per-IP and global Redis reservations protect the API budget.

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

“The output is deliberately finite: two practical opportunities, two rare
ones, and one wildcard. Each has separate personal fit, win signal,
hiddenness, confidence and effort. Win signal is a heuristic—not a fake chance
of winning.”

### 1:12–1:48 — dossier and contrast

Open the publishing grant dossier; show the decision, arguments and project
matches. Then briefly reference OpenAI Build Week.

“This hidden regional pattern reuses Reseñas.lat, while OpenAI Build Week is
crowded but strategically valuable. The dossier makes both the positive case
and the reason to walk away, distinguishes source facts from inference, and
surfaces what still needs verification.”

### 1:48–2:13 — GPT-5.6

Show the cached strategy, then the add-source workbench.

“GPT-5.6 is the language intelligence layer. It converts an unstructured call
into a validated record, builds an editable inventory from explicitly selected
context, and creates a source-grounded participation angle with hard risks and
three first actions. Deterministic code owns the final bounds and ranking.”

### 2:13–2:31 — feedback

Return to radar and reject one item.

“When I say ‘not for me,’ the opportunity disappears, learned domain weights
change, and the next candidate is promoted. This is a recommender, not a dead
form.”

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
