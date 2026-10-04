# Eureka Atlas v17 — 2026-10-04

## Production improvements
- Default research window is now the preceding 7 days, matching the weekly frontier-research workflow. Users can still widen the dates manually.
- Preserves the v16 exact-journal Crossref + independent OpenAlex fallback architecture and strict no-fabrication qualification.
- Refreshes the application and service-worker version to v17 so the public deployment receives the new weekly defaults instead of a stale cached shell.

## Source/API review
- Crossref REST API is operational. Its current documentation recommends cursor pagination for large result sets; Eureka Atlas remains safely within the offset limit in its bounded per-journal scans, so no risky pagination rewrite was warranted this week.
- Google lists Gemini 3.8 Flash (gemini-3.8-flash) as stable/GA and production-ready. No model-ID migration is required.
- USPTO Patent Public Search remains the official public U.S. patent-search route. USPTO states sign-in will become required beginning November 7, 2026; the current external-route design remains valid.
- PatentsView has migrated into the USPTO Open Data Portal ecosystem; Eureka Atlas does not depend on the retired PatentsView API.

## Validation intent
- Keep exact journal identity and date-window checks as hard filters.
- Never force journal representation when no qualifying topical record exists.
- Keep lower-authority enrichment from overwriting higher-authority journal/date metadata.
