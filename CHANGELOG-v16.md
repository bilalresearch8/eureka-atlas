# Eureka Atlas v16 — 2026-09-13

## Reliability upgrades

- OpenAlex is no longer hard-gated on an API key. Keyless requests are now allowed for the browser fallback path, while a supplied free key is still used automatically for higher quotas.
- Exact-journal OpenAlex rescue now inventories the selected ISSNs directly instead of pre-filtering the journal inventory with one large relevance query. This materially improves recall for priority journals whose papers use unexpected terminology.
- Exact-journal OpenAlex rescue now checks up to 300 records per journal/date window (3 × 100-result pages) before topical qualification.
- Cross-source deduplication now preserves publication date, exact journal identity, and ISSNs from the highest-authority metadata source instead of allowing a lower-authority enrichment record to overwrite them.
- Crossref remains the primary authority for publication metadata; publisher-verified/Gemini rescue is secondary and OpenAlex is tertiary for merged records.
- Stage 1B and Stage 3 OpenAlex fallback/cross-check now run whenever OpenAlex is enabled, even when the user has not supplied an OpenAlex key.

## Compatibility review

- Confirmed Crossref still supports exact `container-title` and `issn` filters plus publication/online-publication date filters.
- Confirmed OpenAlex continues to support keyless basic API access; a free key provides a larger daily budget.
- Confirmed Gemini 3.8 Flash is a current stable model as of September 2026.
- Reviewed USPTO/WIPO routing. USPTO PatentsView has moved into the USPTO Open Data Portal ecosystem; Eureka Atlas continues to expose official USPTO/WIPO/Google Patents routes and uses grounded patent discovery rather than a retired PatentsView API dependency.

## Validation

- Inline JavaScript passed `node --check` in GitHub Actions after the v16 patch was applied.
- Service-worker shell cache bumped to `eureka-atlas-v16-shell` so merged production deployments do not remain pinned to the v15 shell.
