# RareBuilders

RareBuilders is Merino Labs' personal radar for rare builder opportunities: hidden hackathons, grants, bounties, research challenges, hardware contests, biotech education calls, and weird competitions that are not obvious on Devpost.

It is not a generic hackathon search engine. It profiles a builder, searches visible and obscure sources, scores opportunities by personal fit and realistic edge, and turns promising opportunities into concrete build strategies.

## Hackathon MVP

The OpenAI Build Week version demonstrates:

1. **Builder profiling** — interests, weirdness appetite, time budget, regions, wildcard openness.
2. **Opportunity normalization** — source, region, language, deadline, reward, domains, participants, effort, hiddenness.
3. **Personal scoring** — fit, win signal, effort fit, strategic value, overall ranking.
4. **Merino Labs angle** — converts each opportunity into a project angle from David's universe.
5. **Feedback loop placeholder** — buttons for “me interesa”, “no es para mí”, “más así”.

## Product thesis

The advantage is not discovering the largest competition. The advantage is discovering an under-saturated opportunity where your existing projects, taste, skills, and willingness to explore weird domains create leverage.

Examples of target opportunities:

- small Discord challenges from AI/open-source communities;
- local grants in Spanish/European/LatAm ecosystems;
- university or lab competitions with low discoverability;
- hardware/watch/wearable maker challenges;
- biotech or CRISPR-adjacent documentation/safety challenges that do not require a wet lab;
- civic tech calls hidden in PDFs;
- bounties in GitHub issues/discussions;
- X/Reddit/newsletter calls with low traction.

## Demo data

The current app includes fixture opportunities so the video path is reliable. Real connectors should be added behind the same `Opportunity` interface in `src/scoring.ts`.

## Commands

```bash
npm install
npm run dev
npm run build
```
