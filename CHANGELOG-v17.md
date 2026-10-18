# Eureka Atlas v17 — release candidate updated 2026-10-18

## Weekly frontier defaults
- Defaults to the preceding 7 days on startup and in Recommended setup; users can change dates.
- Retains exact-ISSN Crossref retrieval, OpenAlex inventory fallback, and balanced selection of genuinely qualifying records without forcing journal representation.

## Strict verification hotfix (October 18)
- Never converts Crossref year-only or year/month-only dates into an invented first day of the period; rejects invalid calendar dates.
- Prefers the exact online publication date. A later print/issue date cannot reclassify an older online paper as newly published. Incomplete online dates are not guessed.
- Gemini-discovered papers require an independently retrieved Crossref record with matching DOI, title, selected journal, and exact publication date within the user-selected window. Candidate claims alone or publisher-looking URLs do not qualify.
- Generated Gemini abstracts do not overwrite publisher-deposited Crossref abstracts. A failed DOI verification excludes the candidate rather than inventing a result.
- Keeps Gemini 3.8 Flash as the default. Removes deprecated 3.7 Flash and 3.5 Flash from the selector/fallback chain; adds an opt-in Gemini 4 Argon option for eligible paid API users. Gemini 3.6 Flash and 3.5 Flash-Lite remain compatible fallbacks.
- Updates the service-worker cache key to `eureka-atlas-v17-20261018-shell`.

## External source review (October 11–18, 2026)
- Crossref's REST API supports publication-date filtering and DOI metadata lookup. Its status page reported a short content-registration incident October 16 while the public REST API was operational at review time.
- OpenAlex continues to support free keyless basic API requests, with a larger budget for free API-key holders.
- Semantic Scholar retains relevance and bulk-search endpoints. No endpoint migration justified this week.
- Google confirms Gemini 4 Argon launched October 13, 2026 and Gemini 3.7 Flash is deprecated/redirected. Argon is not selected automatically due to eligibility and cost.
- USPTO Patent Public Search requires USPTO account sign-in starting November 7, 2026; official WIPO PATENTSCOPE and Google Patents search routes remain separate from the scholarly DOI verification path.

## Validation and limitations
- Run `node tests/release_verification.test.cjs` to check inline application syntax, strict dates, online-first publication, title/DOI/date verification, fail-closed behavior, and model options.
- The tests use fixtures and do not establish full end-to-end API reliability. Live-browser and API-key integration smoke testing is recommended before wider promotion.
- Exact-date strictness may exclude some legitimate records whose publishers have only deposited month-level dates. This is intentional rather than presenting invented precision.
