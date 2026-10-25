# Eureka Atlas v19 — scientific benchmark resilience
Release date: 2026-10-25

## Visible changes
- **Benchmark Lab works without a Gemini API key.** It provides a conservative Crossref bibliographic snapshot of paper identity and related DOI records, clearly marked **metadata only**.
- HTTP 429 Gemini quota exhaustion now produces an actionable quota notice and a metadata-only fallback instead of a terminal raw HTTP error.
- Scores that cannot be defended from evidence show a dash, never an invented 0/100.
- Paper identities and experimental numeric measurements are explicitly separated: Crossref DOI/title verification does not prove a reported current density, yield, lifetime or energy cost.
- Related papers are filtered using title-term overlap; relatedness is presented as a lead for review, not as a scientifically established like-for-like benchmark.
- Missing comparative values, industrial specifications, and unreadable PDF content are prominently labeled rather than filled with guessed numbers.
- Previously extracted target PDF metrics can be carried into metadata mode with clear AI/PDF-location provenance.
- Existing successful benchmark results stay on screen while replacement analysis is in progress, and are preserved if both primary and fallback requests fail.

## Behind-the-scenes improvements
- Gemini API HTTP 429 errors now stop cross-model cascades, stop GenerateContent fallback, and trigger a short in-tab cooldown using a bounded Retry-After value when available.
- Polling also handles quota errors instead of burning model and network retries.
- DOI records and related-title Crossref search results are cached in memory for a single tab session to avoid repeated metadata lookups.
- Paper verifier now checks Crossref DOI, title, journal, complete online-first publication date and a model-supplied exact date.
- AI-based numeric SOTA comparison is suppressed when the comparator DOI is not independently identified or source-linked measurements with units, test conditions and evidence location are missing.
- Industrial numeric targets without valid https source links are rejected as unverified. A valid link is provenance, not a guarantee of correctness.
- New executable fallback regression tests cover strict exact dates, identity-only verification, numerical evidence scrubbing, cache reuse, quota fallback and partial-PDF preservation.
- Added pull-request checks and deployment preflight tests. GitHub Pages publishing fails closed if core tests fail.

## Source checks (2026-10-18 through 2026-10-25)
- Google Gemini API documents 429 RESOURCE_EXHAUSTED for rate/spend limits and recommends bounded, jittered retries, project-level quotas, and checking AI Studio. The application's quota response avoids repeated requests and uses the scientifically weaker metadata fallback.
- Crossref documents free, publisher-deposited DOI and journal metadata. It does **not** independently certify experimental measurements.
- OpenAlex documents limited unauthenticated requests and free-key-supported larger budgets. No unverified OpenAlex endpoint migration was made.
- Nature's Electrochemistry topic page included studies dated 2026-10-23; these were not forced into the journal-search result set without matching the user's exact journal/date/topic filters.

## Honest limitations
- No live Gemini API-key integration can be confirmed by fixture tests alone.
- Metadata-only fallback cannot extract experimental results from a PDF, determine true performance leadership, or assert industrial readiness.
- Crossref may return no convincing comparators, particularly for unusual terminology or poorly deposited metadata. This is not proof that no relevant work exists.
