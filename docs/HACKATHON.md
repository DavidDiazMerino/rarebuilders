# OpenAI Build Week 2026: rules and submission checklist

> **Operational source of truth for RareBuilders.** Read this before making
> product, engineering, asset, licensing, demo, or submission decisions.
>
> Last verified against the official Devpost pages: **2026-07-17 (Europe/Madrid)**.
> The rules may change. The [Official Rules](https://openai.devpost.com/rules)
> and official notices always override this summary, so re-check them before
> the final submission.

This document is an actionable summary, not legal advice and not a replacement
for the Official Rules.

## The non-negotiables

- Submit by **Tuesday, July 21, 2026 at 5:00 PM PDT**, which is **Wednesday,
  July 22 at 02:00 CEST in Madrid**. Do not plan to use the final hour.
- The project must make **meaningful use of both Codex and GPT-5.6**. Their use
  cannot be incidental or decorative.
- Submit to exactly **one** track.
- The product must work reliably as shown and described.
- Supply a working, free testing path for judges through the end of judging.
- Supply a repository URL, a compliant README, and the `/feedback` Codex
  Session ID from the primary build thread.
- Supply a **public YouTube** demo with audio, no longer than three minutes,
  which shows the working project and specifically explains how Codex and
  GPT-5.6 were used.
- Submission materials must be in English, or include English translations.
- Use only code, data, media, brands, SDKs, and APIs that the entrant is
  authorized to use. Track licenses and provenance as the project evolves.
- Once the submission window closes, the submission cannot normally be edited.

## Official timeline

Pacific Time is the legal/official reference. Madrid conversions below assume
PDT (UTC-7) and CEST (UTC+2).

| Event | Official Pacific time | Madrid time |
| --- | --- | --- |
| Registration opened | Jul 9, 10:00 AM PDT | Jul 9, 19:00 CEST |
| Submission period opened | Jul 13, 9:00 AM PDT | Jul 13, 18:00 CEST |
| Free Codex credit request deadline | Jul 17, 12:00 PM PDT | Jul 17, 21:00 CEST |
| **Registration and submission deadline** | **Jul 21, 5:00 PM PDT** | **Jul 22, 02:00 CEST** |
| Official Rules: judging begins | Jul 22, 10:00 AM PDT | Jul 22, 19:00 CEST |
| Official Rules: judging ends | Aug 5, 5:00 PM PDT | Aug 6, 02:00 CEST |
| Winners announced, approximately | Aug 12, 2:00 PM PDT | Aug 12, 23:00 CEST |
| DevDay for first-place passes | Sep 29, 2026 | Sep 29, 2026 |

There is a conflict on Devpost: the separate schedule page lists judging from
July 22 at 9:00 AM through August 9 at 5:00 PM PDT, while the Official Rules
list July 22 at 10:00 AM through August 5 at 5:00 PM PDT. The Official Rules
say they prevail in a conflict, so use their dates for compliance and check
again before submission.

The $100 promotion is for **Codex credits, not API credits**, is limited to one
code per entrant, and was subject to approval and availability. The Resources
page now says all available credits have been distributed. Any additional
usage cost belongs to the entrant.

## Eligibility and entry

- Individuals must have reached the age of majority where they live.
- Each individual and organization must be resident/domiciled in a supported
  OpenAI API country or territory and must not fall under an excluded
  jurisdiction or sanctions restriction. Spain appears in the eligible list.
- Individuals, teams, and organizations may enter. The FAQ states there is no
  general team-size limit, although prize-specific restrictions still apply.
- Every team member must independently meet the eligibility requirements.
- A team or organization must appoint one eligible, authorized representative
  to submit and act on its behalf.
- Sponsor/administrator staff, judges, certain relatives/household members,
  affiliates, people involved in running the event, and entrants with a real
  or apparent conflict of interest are excluded as detailed in the rules.
- Registration requires joining the hackathon with a Devpost account before
  the registration deadline.

Before submission, the human entrant/representative must confirm:

- [ ] Every team member is eligible.
- [ ] RareBuilders is entered as an individual, team, or organization.
- [ ] If applicable, the team representative is explicitly authorized.
- [ ] The Devpost account has joined OpenAI Build Week.
- [ ] Team members and roles are final and accurately listed.

## What the project must be

The project may be an app, website, agent, workflow, game, plugin, MCP, skill,
developer tool, or another format, but it must:

1. Use **Codex to build the project**. Evidence is required in the description,
   video, README, repository, and primary Codex session.
2. Use **GPT-5.6 meaningfully in the project**. The integration must be visible
   in the repository and explained and demonstrated in the submission.
3. Fit one track:

   - **Apps for Your Life:** consumer apps for productivity, creativity, home,
     family, travel, health, personal finance, and everyday life.
   - **Work and Productivity:** tools that make teams faster or more effective,
     including automation, support, analytics, sales, and back-office work.
   - **Developer Tools:** testing, DevOps, agentic workflows, security, and
     other tools for developers.
   - **Education:** AI projects for students, teachers, or educational
     organizations.

4. Install and run consistently on its intended platform.
5. Behave as depicted in the video and text.
6. Be available free of charge and without testing restrictions to the judges
   through the official judging period.

### Track recommendation for RareBuilders

The recommended track is **Work and Productivity**. RareBuilders is a decision
system that helps builders allocate scarce work time, evaluate opportunities,
and turn a promising one into an actionable build plan. **Developer Tools** is
the fallback only if the submitted product becomes primarily about its
connector/agent infrastructure. A project can enter only one track.

### New versus pre-existing work

Projects created during the submission period are eligible. Pre-existing
projects must be meaningfully extended with Codex and/or GPT-5.6 after the
submission period began, and only the new work is judged. Pre-existing entrants
must clearly separate old and new work using dated commits, timestamped Codex
session logs, or equivalent evidence.

RareBuilders currently has a useful clean baseline:

- first recorded commit: `f7dd2ae` (`Initial RareBuilders prototype`);
- commit time: `2026-07-17T12:53:24+02:00`;
- this is after the official submission period opened on July 13.

Preserve the Git history. Keep future commits focused and descriptive, and do
not rewrite the history that demonstrates when the work was created.

## Required submission package

The Devpost entry must contain all of the following:

- [ ] A working project built with Codex and GPT-5.6.
- [ ] Exactly one selected track.
- [ ] An English text description of the features and functionality.
- [ ] A compliant public YouTube demo video.
- [ ] A URL to the code repository.
- [ ] A README with setup, sample data if needed, testing instructions, and a
      specific account of the Codex/GPT-5.6 collaboration.
- [ ] The `/feedback` Codex Session ID for the primary build thread where most
      core functionality was built.
- [ ] A working website, demo, test build, sandbox, or test account that judges
      can access for free.
- [ ] English versions/translations of every submitted artifact.

Judges are allowed to evaluate only the description, images, and video. They
are not required to clone, build, or test the project. The submission must
therefore make the value and working state obvious without depending on a
successful local setup.

### Repository and testing

The repository must be one of:

- **Public:** include an appropriate project license and comply with all
  dependency and asset licenses.
- **Private:** share it with both `testing@devpost.com` and
  `build-week-event@openai.com`.

Testing access must remain working, free, and unrestricted for the sponsor,
administrator, and judges until judging ends. If a private demo needs a login,
put credentials in Devpost's private testing instructions, not in the public
repository. If unusual proprietary hardware is required, the organizers may
request physical access.

Plugins and Developer Tools have extra requirements: installation instructions,
supported platforms, and a test path that does not require judges to rebuild
the project from scratch.

### README content required before submission

The final README must include:

- what RareBuilders is and the real audience/problem;
- a working demo URL;
- supported platform and prerequisites;
- exact install and run steps;
- environment variable names and setup, with no real secrets committed;
- sample data or a deterministic fixture path;
- exact judge testing steps and any test account guidance;
- how GPT-5.6 is integrated and why it is necessary;
- how Codex was used throughout the project;
- specific places Codex accelerated work;
- key product, engineering, and design decisions made by the human entrant;
- evidence and dates distinguishing any pre-hackathon work from new work;
- third-party/open-source acknowledgements and licenses where applicable;
- known limitations that affect testing.

Do not write a vague "built with AI" paragraph. Technical Implementation and
Quality of the Idea are explicitly judged using this account.

### Codex evidence

Keep the majority of core work in one representative Codex thread where
practical. Near submission time:

1. Run `/feedback` in that primary thread.
2. Copy its unique Session ID into the Devpost form.
3. Do not use a side conversation or throwaway test thread.
4. If several threads materially contributed, submit the most representative
   one and explain the broader collaboration in the README.
5. Preserve dated Git commits and accurate documentation as supporting
   evidence.

Do not commit the Session ID to this repository unless there is a deliberate
reason to make it public; Devpost is the required destination.

## Video requirements

The submitted video must:

- [ ] Be **three minutes or less**. The Official Rules say "less than three
      minutes"; the FAQ says "three minutes or under." To satisfy both, target
      **2:45-2:55**, never exactly 3:00.
- [ ] Be uploaded to YouTube and set to **Public**, not unlisted or private.
- [ ] Show a clear demo of the real, working project.
- [ ] Include spoken audio/voiceover. AI-assisted narration is allowed.
- [ ] Explain what was built.
- [ ] Explain specifically how Codex was used to build it, including workflow,
      key moments, and decisions rather than a generic claim.
- [ ] Explain how GPT-5.6 is integrated and what it does.
- [ ] Be in English or have a complete English translation.
- [ ] Avoid third-party trademarks, copyrighted music, and other protected
      material unless permission is documented.

Showing the Codex interface is not mandatory, but the official FAQ calls it a
strong signal for the Technological Implementation score. Record proof and
usable demo footage throughout development rather than relying on the final
night.

Suggested safe outline:

1. **0:00-0:20:** the concrete problem and target user.
2. **0:20-1:45:** an uninterrupted happy-path product demo.
3. **1:45-2:15:** why GPT-5.6 is essential and the result it produces.
4. **2:15-2:40:** how Codex accelerated the build and where the human made key
   decisions.
5. **2:40-2:55:** impact, differentiation, and closing proof that it works.

## IP, licenses, privacy, and outside support

- The submission must be the entrant's original work, owned by the entrant,
  and must not violate copyright, trademark, patent, contract, privacy,
  publicity, or other rights.
- Open-source software and hardware are allowed only when their licenses are
  followed and the entrant's work enhances/builds on their functionality.
- Standard tools, libraries, and frameworks are allowed. Disclose pre-existing
  code and third-party work.
- Any third-party API, SDK, data source, font, icon, image, music, video, model,
  or other asset requires authorization compatible with the intended use.
- Third-party technical assistance is allowed only if the submitted components
  remain the entrant's work product, ideas, and creativity, and the entrant
  owns all necessary rights.
- A project developed with prior financial or preferential support from OpenAI
  or Devpost may be disqualified under the specific conditions in the Official
  Rules. Ordinary event Codex credits are part of the hackathon process; any
  other potentially relevant support must be reviewed.
- Do not expose personal information, production credentials, private customer
  data, or secrets in the repository, demo, screenshots, or video.
- The entrant retains project IP but grants the sponsor a non-exclusive license
  for judging. The sponsor and Devpost may promote the submission and use
  contributors' name, likeness, voice, and image for hackathon publicity for
  three years, as detailed in the rules.
- Entering accepts the Official Rules, Devpost Terms, privacy terms, releases,
  dispute provisions, and potential tax obligations. Read the full legal text
  rather than relying on this summary.

Maintain a simple provenance record before submission:

| Item | Source/owner | License or permission | Included in attribution? |
| --- | --- | --- | --- |
| Application source | RareBuilders entrant/team | MIT | Yes |
| npm dependencies | Their respective owners | Package licenses | Yes |
| `src/assets/hero.png` | Generated with Codex for the initial prototype; unused and excluded from build | Entrant-authorized AI output | Yes |
| `public/favicon.svg` | Original RareBuilders target mark | MIT with application | Yes |
| Interface icons and fonts | Lucide / Fontsource packages | ISC / OFL 1.1 | Yes |
| Opportunity fixture/API data | Original labelled patterns / linked public APIs | Provenance documented | Yes |
| Video audio/music/media | Entrant or authorized source | Verify when created | Pending |

## Judging

Stage One is pass/fail: the project must be viable, fit the hackathon theme,
and reasonably use the required technology.

Projects that pass are scored on four **equally weighted** criteria:

1. **Technological Implementation:** thorough and skillful Codex use; genuine
   effort; working, non-trivial code.
2. **Design:** a complete, coherent, runnable product experience, not merely a
   technical proof of concept.
3. **Potential Impact:** a credible, specific real problem and audience, with a
   demonstrated solution that actually addresses it.
4. **Quality of the Idea:** creativity, novelty, and differentiation from
   existing concepts.

Tie-breaks compare the criteria in that order, so Technological Implementation
is the first tie-breaker.

For RareBuilders this means:

- make GPT-5.6 do meaningful product work, not a decorative summary;
- use a manual URL/text importer as the reliable real-ingestion path and add
  one searchable public connector if time permits;
- keep fixtures only as a labelled, deterministic fallback and comparison set;
- demo one polished end-to-end journey rather than many unfinished features;
- make the target user and outcome concrete;
- explain why personal edge and Hiddenness are novel versus a directory;
- prove that the recommendation/strategy changes based on the builder rather
  than showing a static list.

## Prizes

Each of the four tracks awards:

- first place: **$15,000**, up to two DevDay/Exchange passes, OpenAI Developers
  promotion, a meeting with the Codex team, and a Pro account for one year;
- second place: **$10,000**, OpenAI Developers promotion, and a Pro account for
  one year.

Each project is eligible for one prize. First-place passes are limited to two
team members. Travel, accommodation, visas, taxes, and other unstated costs are
the recipients' responsibility. Prize recipients must pass verification and
return required forms on time. For teams, the representative receives and
allocates the monetary prize.

## RareBuilders live compliance checklist

Update this section as work progresses.

### Already evidenced

- [x] Project Git history begins during the submission period.
- [x] A runnable Vite/React/Vercel product exists.
- [x] Full local setup and judge instructions exist in the README.
- [x] The product has a stated target problem and differentiator.
- [x] Fixture data supports a deterministic demo path.
- [x] Codex is being used in a primary build thread.
- [x] GPT-5.6 has three visible, structured-output product roles.
- [x] URL/text ingestion and a public GitHub connector are implemented.
- [x] Feedback persists and changes the recommendation set.
- [x] Unit, build, lint and browser-journey checks pass locally.

### Eligibility blockers

- [ ] Confirm entrant/team eligibility and representative.
- [ ] Confirm Devpost registration and "Join Hackathon" completion.
- [x] Implement a meaningful, visible GPT-5.6 product integration.
- [x] Keep that integration visible in code and README.
- [ ] Demonstrate live GPT-5.6 in the final deployed app and video.
- [x] Lock **Work and Productivity** as the track.
- [ ] Obtain the primary thread's `/feedback` Codex Session ID.

### Repository and testing blockers

- [x] Add a Git remote and produce the repository URL.
- [x] Publish the repository publicly.
- [x] Choose and include the MIT project license.
- [x] Audit dependency, asset, font, icon, and fixture-data licenses.
- [x] Document asset and data provenance.
- [x] Add required Codex/GPT-5.6 collaboration detail to the README.
- [x] Add exact judge setup and test instructions to the README.
- [x] Deploy a stable demo/test instance at `https://rarebuilders.vercel.app`.
- [x] Ensure the deterministic judge path is free and works in a clean browser.
- [ ] Keep demo access alive through the judging period.
- [x] Add safe, explicitly labelled sample data; no test account is needed.
- [x] Run lint, unit tests, production build and Chromium end-to-end test.
- [ ] Verify no secrets or personal data exist in Git history or build output.

### Submission blockers

- [ ] Draft the English Devpost description.
- [ ] Select screenshots that show the working product and contain no secrets.
- [ ] Write, rehearse, record, and caption the under-three-minute demo.
- [ ] Verify the final YouTube video is Public and its audio works.
- [ ] Verify the video explicitly covers RareBuilders, Codex, and GPT-5.6.
- [ ] Verify every third-party visual/audio element is authorized.
- [ ] Complete every required Devpost field and save a draft early.
- [ ] Test every submitted link from a logged-out/incognito browser.
- [ ] Re-read the Official Rules and official updates on submission day.
- [ ] Submit well before **Jul 22, 02:00 CEST (Madrid)**.
- [ ] Save screenshots/confirmation proving the entry was submitted on time.

## Submission-day runbook

1. Freeze the demo path and deploy the exact tested commit.
2. Run lint/build and test the deployed journey in a clean browser.
3. Confirm repo visibility/shares, license, README, and testing access.
4. Generate and save the primary `/feedback` Session ID.
5. Watch the final public YouTube video end to end with sound.
6. Check that description, repo, deployment, video, screenshots, and track all
   agree about what the product does.
7. Re-read the current rules and announcements for changes.
8. Submit early, then verify the confirmation and every link while edits remain
   possible.
9. Do not rely on post-deadline edits.

## Official links

- [Hackathon overview](https://openai.devpost.com/)
- [Official Rules](https://openai.devpost.com/rules)
- [FAQ](https://openai.devpost.com/details/faqs)
- [Resources and announcements](https://openai.devpost.com/resources)
- [Schedule page](https://openai.devpost.com/details/dates)
- [OpenAI API supported countries and territories](https://platform.openai.com/docs/supported-countries)
- [Devpost Terms of Service](https://info.devpost.com/terms)
- [Devpost Privacy Policy](https://info.devpost.com/privacy)

For an ambiguity not resolved by the official pages, use the official Devpost
discussion board or `support@devpost.com`, and keep the written response.
