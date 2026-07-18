# Source architecture

RareBuilders treats discovery as an evidence pipeline, not as an AI web search.
Connectors collect deterministic source records, normalize them into
`OpportunityCandidate`, and preserve provenance. Cheap local pre-fit ranks the
pool; a model is only used after a candidate is inspected or selected by an
explicit owner budget.

## Connector contract

Every automated connector must:

- accept a short optional focus query;
- return stable external IDs and canonical source URLs;
- isolate its own timeout, cache policy, credentials and errors;
- discard expired or clearly irrelevant records before normalization;
- provide enough source text to inspect or a URL that the safe fetcher can read;
- declare participation, deadline and reward as unknown rather than inventing them;
- remain independently disableable when a provider changes or fails.

The server registry is exhaustive over `AutomatedConnectorId`. Adding an ID now
produces a type error until a handler exists, which prevents a source from
appearing in the interface without a working implementation.

## Next source tiers

1. **RSS and Atom feeds.** Newsletters, grant blogs, lab announcements and small
   community sites provide high-signal sources without credentials.
2. **Community APIs.** Reddit, Hacker News, GitHub Discussions and public
   Discourse instances can reveal bounties, calls for collaborators and unusual
   requests before they reach competition directories.
3. **Open social networks.** Bluesky and Mastodon can be searched through
   documented APIs and retain a canonical public post as evidence.
4. **Twitter/X.** Use an official or licensed search route when economically
   viable, plus user-supplied post URLs through the existing safe source reader.
   Do not rely on brittle scraping or bypass access controls.

Each new tier should ship with fixtures for duplicates, deleted posts, stale
deadlines, provider errors and rate limits. Results enter the same candidate
history, ranking and decision flow as the current connectors.

## Quality gates

A source is ready only when it has:

- bounded request time, response bytes and result count;
- cache and per-client rate limits;
- stable deduplication across broad and profile-focused searches;
- a visible source link and extraction/provenance label;
- tests for normalization, expiry and failure isolation;
- no secrets or raw provider failures exposed to the browser.
