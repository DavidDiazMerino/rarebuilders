# RareBuilders — OpenAI Build Week submission package

Use this document as the single source of truth while completing Devpost and
recording the demo. Text marked `[PENDING]` or `[CONFIRM]` still needs a human
answer. Save the Devpost entry as a draft early, but do not consider it
submitted until Devpost shows the green confirmation and `Submitted` status.

## Submission at a glance

| Field | Final answer / status |
| --- | --- |
| Project name | `RareBuilders` |
| Track | `Work and Productivity` |
| Tagline | `Find the opportunity where your existing work gives you an edge.` |
| Live demo | `https://rarebuilders.vercel.app` |
| Repository | `https://github.com/DavidDiazMerino/rarebuilders` |
| License | `MIT` |
| Project status | New project created during the submission period |
| Submitter | `[CONFIRM: individual, team, or organization]` |
| Country of residence | `[CONFIRM: Spain]` |
| Team members | `[CONFIRM: David only, or add every eligible member]` |
| YouTube demo | `[PENDING: public URL]` |
| Codex Session ID | `[PENDING: run /feedback in the primary build thread]` |

The tagline is below Devpost's 140-character standard limit.

## What to enter in Devpost

Devpost normally presents these as several steps. Custom OpenAI questions may
use slightly different wording, but the answer should remain the same.

### Step 1 — Manage team

- Confirm whether this is an individual entry.
- Add every actual contributor and no one else.
- Confirm that every listed entrant meets the eligibility rules.
- If this is a team entry, confirm that the submitter is authorized to act for
  the team.

This legal/eligibility information must be answered by the human entrant.

### Step 2 — Project overview

- **Project name:** RareBuilders
- **Tagline:** Find the opportunity where your existing work gives you an edge.
- **Thumbnail:** use a clean 3:2 crop of the radar or landing page. Recommended
  export: 1500 × 1000 PNG, under 5 MB.

The thumbnail should show the product name, the finite radar, and at least
three real signal labels. Avoid tiny text, browser chrome, and a collage of
features.

### Step 3 — Project details

- Paste the full **Project story** below.
- Add the **Built with** tags below.
- Add the production URL under **Try it out**.
- Add the public YouTube URL after uploading the final video.
- Upload four production screenshots in the order listed below.

**Built with tags:**

`GPT-5.6`, `OpenAI API`, `Codex`, `TypeScript`, `React`, `Vercel`,
`Upstash Redis`, `Zod`, `GitHub API`, `Kaggle API`, `Vitest`, `Playwright`

**Try it out:**

`https://rarebuilders.vercel.app`

**Suggested gallery order:**

1. Landing page with the two explicit starting paths.
2. Radar showing the finite practical / rare / wildcard mix.
3. Dossier showing arguments, score explanations, observable hiddenness, and
   matched project assets.
4. Real Devpost source normalized into facts, requirements, and deliverables.

Optional fifth image: the consent-driven Builder Memory import. Do not use a
gallery image just to repeat the same radar view.

### Step 4 — OpenAI-specific details

Use these answers when the corresponding fields appear:

- **Category / track:** Work and Productivity.
- **Repository URL:** `https://github.com/DavidDiazMerino/rarebuilders`
- **Repository access:** Public.
- **License:** MIT.
- **New or existing project:** New project created during the submission
  period. The first recorded prototype commit is `f7dd2ae`, dated July 17,
  2026, after submissions opened on July 13.
- **Codex Session ID:** `[PENDING]` — run `/feedback` in the primary RareBuilders
  Codex thread and paste the returned ID into Devpost. Do not put the ID in the
  public repository.
- **How was Codex used?:** use the short answer below if the form provides a
  dedicated field.
- **How is GPT-5.6 used?:** use the short answer below if the form provides a
  dedicated field.
- **Testing instructions:** use the judge path below.
- **Submitter type and country:** answer from the entrant's legal reality, not
  from this document.

**Short Codex answer:**

> Codex was my primary engineering collaborator from product audit to
> production. It helped turn the initial prototype into typed domain
> contracts, deterministic scoring, GPT-5.6 structured-output workflows,
> source adapters, security and quota controls, a coherent interaction system,
> and automated tests. I made the product thesis, privacy, design, track,
> budget, and release decisions, and used Codex to implement, test, challenge,
> and refine them. The repository history and primary Codex Session ID preserve
> that collaboration.

**Short GPT-5.6 answer:**

> GPT-5.6 is RareBuilders' language-intelligence layer. It turns unstructured
> opportunity evidence into a validated, source-linked record; builds an
> editable project inventory from context the user explicitly selects; and
> proposes a builder-specific participation angle, hard risks, and exactly
> three first actions. Deterministic TypeScript—not the model—owns scoring,
> hiddenness, hard gates, ranking, persistence, and feedback learning.

**Testing instructions:**

> Open https://rarebuilders.vercel.app in a clean browser and choose “Explore
> David's radar” for the deterministic no-sign-up path. Open any card to inspect
> the decision dossier and signal explanations. Use “More like this,” “Pass,”
> and “Undo” to test the reversible feedback loop. Then return home, choose
> “Build my own radar,” and use Add Source with
> https://openai.devpost.com/ to see public source evidence converted into a
> structured opportunity. No paid account or private credential is required.

### Step 5 — Review and submit

- Read the declarations rather than accepting them mechanically.
- Confirm all media, source material, and code are authorized for submission.
- Test every link while logged out.
- Click the final **Submit project** action; saving a draft is not submission.
- Confirm Devpost shows the green confirmation and `Submitted` status.
- Save a screenshot/PDF of the confirmation and the final entry.

## Project story — ready to paste

### Inspiration

The most visible opportunity is not always the best use of a builder's time.
Grants, bounties, competitions, pilots, and open calls are fragmented across
Devpost, GitHub, institutional pages, newsletters, and regional communities.
Existing directories are useful for discovery, but they mostly organize what
is popular. They do not answer a more personal question: **where does the work
I already own give me an unusual edge?**

I built RareBuilders because I needed that answer myself. I did not want
another infinite feed. I wanted a small, honest set of decisions that accounts
for my skills, constraints, reusable projects, and tolerance for effort and
risk.

### What it does

RareBuilders turns a builder's selected context into a finite opportunity
radar. It targets two practical opportunities, two rare opportunities, and one
wildcard. If the available evidence cannot honestly satisfy a bucket, the
product labels the recommendation **closest available** instead of silently
changing the definition.

Each opportunity opens into a decision dossier with:

- reasons to pursue it and reasons to walk away;
- reusable projects and assets from the builder's own inventory;
- reward, deadline, eligibility, participation cost, and unknowns;
- separate Fit, Win Signal, Hiddenness, Strategic Value, Effort, Risk, and
  Confidence signals;
- observable factors explaining Hiddenness rather than a mysterious
  model-generated number;
- a source-grounded participation angle, hard risks, and three concrete first
  actions.

The user can start immediately with a clearly labelled demo or build a personal
radar through six decisions. They can add a public URL, pasted text, a CV,
selected Markdown notes, or selected public GitHub repositories. Public
discovery connectors support GitHub, Devpost, EU opportunities, and Kaggle.

Decisions and preferences remain separate. “Pass” removes an item from the
active radar but keeps it recoverable. “More like this” and “Less like this”
teach canonical domain preferences. Structured pass reasons tune relevant
constraints, and private notes remain in the browser.

### How we built it

The product is a React and TypeScript application deployed on Vercel. GPT-5.6
is integrated through the OpenAI API using validated structured outputs for
three tasks:

1. normalize messy opportunity evidence into source-linked facts, inferences,
   requirements, deadlines, deliverables, and explicit uncertainty;
2. build an editable project inventory from only the context the user chooses;
3. generate a builder-specific participation strategy with hard risks and
   exactly three first actions.

The model does not own the final decision. TypeScript deterministically
calculates Fit, Hiddenness, Win Signal, Strategic Value, Effort, Risk, hard
gates, radar composition, persistence, and feedback learning. Factual analysis
is cached by normalized source evidence rather than by the mutable user
profile. Redis-backed atomic reservations protect the shared AI budget, and
the URL ingestion layer includes SSRF defenses, redirects and content limits.

Codex was my primary implementation collaborator. I used it to audit the
competition requirements, turn a static prototype into typed domain contracts,
design the scoring and learning loop, integrate GPT-5.6 structured outputs,
build and debug source adapters, harden quota and fetch behavior, refine the
visual system, and construct the test suite. I made the product thesis,
audience, privacy boundaries, track, interface, budget, and release decisions.
Codex repeatedly helped expose weak assumptions—for example, model-invented
hiddenness and misleading fallback buckets—and convert those findings into
testable product behavior.

### Challenges we ran into

The hardest challenge was preserving honesty while still making AI useful.
Unstructured sources omit fields, use inconsistent terminology, and mix facts
with promotion. A language model can normalize that material well, but asking
it to invent a final score creates false precision. We therefore separated
language interpretation from deterministic decision logic and expose
uncertainty in the interface.

Source ingestion created another difficult boundary. A pasted Devpost URL may
contain tracking parameters, API metadata, dynamic HTML, or partial public
content. RareBuilders canonicalizes references, combines safe public evidence
where appropriate, rejects mismatched competition results, and falls back
honestly when a field is unknown.

The feedback loop also needed care. Domain labels such as “AI Agents,”
“ai-agents,” and “AI agents” must teach the same preference, while a new vote
must replace the user's previous effect rather than accumulate contradictory
weights. That learning is now canonicalized and reversible.

### Accomplishments that we're proud of

- A no-sign-up judge path that communicates the product in about one minute.
- A real source pipeline that can normalize the OpenAI Build Week page itself.
- Explainable scoring where observable code owns Hiddenness and ranking.
- Honest radar composition with visible “closest available” fallbacks.
- Consent-driven project memory and browser-local private notes.
- Reversible decisions, structured learning, and candidate history.
- Quota, cache, URL-safety, and graceful-degradation controls suitable for a
  public demo.
- 60 unit tests and 7 end-to-end tests covering the core experience.

### What we learned

Personalization is not just collecting more profile fields. The valuable part
is connecting a builder's existing assets to the cost and shape of a specific
opportunity. We also learned that an AI product becomes more credible when it
shows where the model stops: GPT-5.6 interprets language and proposes strategy;
observable rules calculate the decision signals.

Finally, a finite shortlist creates a better feedback loop than an endless
feed. Passing one opportunity is meaningful when it promotes a visible next
candidate and the user can understand what changed.

### What's next for RareBuilders

Next I would expand reliable source coverage beyond hackathons into grants,
pilots, bounties, residencies, calls for proposals, and local programs; add
deadline monitoring and source-change alerts; and evaluate recommendations
against actual application and outcome data. I would also develop
privacy-preserving collaboration so small teams can combine selected project
inventories without exposing all of their personal context.

The long-term goal is not to predict winners. It is to help builders allocate
scarce time where their existing work creates the strongest asymmetric
advantage.

## Video: the story to tell

The demo should tell one story:

> A builder starts with scattered opportunities and limited time. RareBuilders
> gives them a finite, explainable radar; proves the reasoning inside a dossier;
> converts the real OpenAI Build Week page into structured evidence with
> GPT-5.6; learns from a reversible decision; and shows that Codex helped build
> the reliable system underneath it.

Do not try to demonstrate CV upload, GitHub, Kaggle, EU discovery, daily
refresh, every profile editor, and every score. Those belong in the written
entry and screenshots. The video needs one memorable decision path.

### Final English voiceover — target 2:45–2:50

Speak naturally at roughly 125–135 words per minute. Do not rush to match the
timestamps; shorten pauses during editing instead.

#### 0:00–0:16 — problem and promise

> The most visible opportunity is not always the best use of a builder's time.
> Grants, bounties, and challenges are fragmented, while directories rank
> popularity—not personal leverage. RareBuilders finds the opportunity where
> work you already own gives you an edge.

#### 0:16–0:42 — finite radar

> A judge can enter this clearly labelled example without signing up. Instead
> of another infinite feed, RareBuilders creates a finite radar: two practical
> moves, two rare ones, and one wildcard. If the evidence cannot satisfy a
> bucket, it says “closest available” rather than pretending.

#### 0:42–1:13 — explainable dossier

> Every dossier makes the decision inspectable: reasons for and against,
> reusable project assets, reward, effort, risk, and missing evidence. Fit and
> Win Signal are heuristics, not a fake probability of winning. Hiddenness is
> calculated from observable source, reach, language, region, and participation
> signals—not invented by GPT.

#### 1:13–1:54 — real source and GPT-5.6

> Now I will add a real source: OpenAI Build Week itself. RareBuilders combines
> safe public Devpost evidence and converts the unstructured call into a
> validated opportunity. GPT-5.6 extracts the deadline, reward, eligibility,
> requirements, deliverables, and explicit unknowns. It also builds editable
> project memory from context the user selects and proposes a source-grounded
> strategy with hard risks and three first actions. Deterministic TypeScript
> owns the final scores, gates, and ranking.

#### 1:54–2:15 — reversible learning

> Decisions and preferences are separate. “More like this” teaches the next
> ranking. “Pass” hides a card without losing it, a structured reason updates
> the relevant constraint, and Undo makes a mistake reversible. Private notes
> never leave the browser.

#### 2:15–2:40 — Codex proof

> Codex was my primary engineering collaborator. It helped turn a static
> prototype into typed domain contracts, structured GPT outputs, source
> adapters, quota and URL-safety controls, and sixty unit plus seven
> end-to-end tests. I made the product thesis, privacy, track, design, budget,
> and release decisions; Codex implemented, tested, and challenged them with
> me.

#### 2:40–2:50 — close

> RareBuilders does not promise a win probability. It helps builders stop
> chasing visibility and choose where their existing work creates leverage.

This script is approximately 309 spoken words. The exact runtime depends on
delivery; record it once without rushing, then trim visual pauses to remain
comfortably below three minutes.

## Video: exact shot list

Record the product footage as short clean clips and add the voiceover afterward.
That is faster and safer than trying to narrate a perfect live take.

| Time | What the viewer sees | Action |
| --- | --- | --- |
| 0:00–0:16 | Landing hero | Hold long enough to read the promise and the two paths. |
| 0:16–0:25 | Demo entry | Click **Explore David's radar**. Let the demo explanation appear. |
| 0:25–0:42 | Radar | Show the five-card composition and briefly hover Fit, Win Signal, Hiddenness, and Confidence. |
| 0:42–1:13 | Dossier | Open the first strong card. Show the illustrative-source label, reasons for/against, reusable projects, reward/cost, and observable Hiddenness factors. |
| 1:13–1:29 | Add Source | In a separate clean browser state, paste `https://openai.devpost.com/` and fetch it. |
| 1:29–1:54 | GPT result | Show rendered source facts, click Analyze, then reveal the normalized deadline, reward, eligibility, requirements, and deliverables. Pre-warm this exact request before recording. |
| 1:54–2:15 | Feedback | In the demo state, click **More like this**, then **Pass**, show the recoverable tray/message, and click **Undo**. |
| 2:15–2:29 | Codex | Show the primary Codex workspace for a few seconds with a safe, representative build/test exchange. Never show secrets or the owner access code. |
| 2:29–2:40 | Technical proof | Show the test summary and a brief architecture/code view with GPT structured output and deterministic scoring visible. |
| 2:40–2:50 | Closing product shot | Return to the radar or landing hero and hold on the RareBuilders name. |

The dossier fixture is allowed to be illustrative because the interface says
so. Do not hide that label. The following real-source scene is what proves that
the working product handles live evidence.

### Two browser states to prepare

Use two separate browser profiles or record these sequences independently:

1. **Demo state:** radar, dossier, feedback, and Undo.
2. **Real-source state:** fresh personal radar, Add Source, fetch, and GPT-5.6
   analysis of `https://openai.devpost.com/`.

Adding the first live source intentionally replaces demo opportunities. Trying
to record both stories in one continuous state can make the radar appear to
lose cards. Editing between two honest states keeps the explanation clear.

### Recording checklist

- Record at 1920 × 1080 or 2560 × 1440, 30 fps, browser zoom 100%.
- Use a fresh Chrome profile; hide bookmarks, extensions, personal tabs,
  notifications, downloads, and password-manager prompts.
- Activate owner access privately before recording the GPT scene. Never record
  or publish the owner code.
- Fetch and analyze the exact OpenAI Build Week URL once before the real take
  so the production cache is warm and the response is immediate.
- Confirm the source preview shows the real reward, deadline, eligibility, and
  requirements before recording.
- Move the cursor deliberately and pause after every click.
- Capture three to five extra seconds at the beginning and end of every clip.
- Record voiceover in a quiet room after the visual edit; keep music out unless
  its license is documented. No music is the safest choice.
- Add accurate English captions and proofread product names, GPT-5.6, Codex,
  RareBuilders, Hiddenness, and Devpost.
- Export H.264 MP4 at 1080p and upload it to **Public YouTube**.
- Test the YouTube page and its Devpost embed while logged out.

Suggested YouTube title:

`RareBuilders — OpenAI Build Week 2026 Demo`

Suggested YouTube description:

> RareBuilders is personal opportunity intelligence for builders: a finite,
> explainable radar for grants, bounties, competitions, pilots, and open calls.
>
> Live demo: https://rarebuilders.vercel.app
>
> Source code: https://github.com/DavidDiazMerino/rarebuilders

## Tomorrow's recording runbook

1. Open the deployed site in both prepared browser profiles.
2. Smoke-test the demo path, dossier, More like this, Pass, and Undo.
3. Smoke-test the OpenAI Build Week fetch and GPT-5.6 result.
4. Capture the four gallery screenshots while the browser is clean.
5. Record the demo-state clips.
6. Record the real-source clips.
7. Record the safe Codex and test-proof clips.
8. Assemble the silent visual cut to approximately 2:42.
9. Record the English voiceover and align it.
10. Add captions and a final two-second closing hold.
11. Export, upload as Public, and test while logged out.
12. Paste the YouTube URL into the Devpost draft.
13. Run `/feedback` in the primary Codex thread and paste the Session ID.
14. Complete the human eligibility/team fields and accept the declarations.
15. Run the final gate below, then submit and save confirmation.

## Final gate

- [ ] Human entrant has confirmed eligibility, submitter type, country, and
      final team membership.
- [ ] Devpost account has joined OpenAI Build Week.
- [ ] Production demo succeeds in a clean/incognito browser.
- [ ] Live GPT-5.6 call succeeds from the production domain.
- [ ] Public repository, README, commit history, and MIT license are visible.
- [ ] Four clean production screenshots are uploaded.
- [ ] Video is public, has spoken English audio and captions, and is under three
      minutes.
- [ ] Video visibly demonstrates a working product, GPT-5.6 integration, and
      the Codex collaboration.
- [ ] Every Devpost claim agrees with shipped behavior.
- [ ] Every link works while logged out.
- [ ] `/feedback` Session ID is entered in Devpost, not committed publicly.
- [ ] Official rules, FAQ, and announcements have been re-read that day.
- [ ] Entry is submitted before July 22, 2026 at 02:00 CEST in Madrid.
- [ ] Devpost displays `Submitted` and the confirmation is saved.
