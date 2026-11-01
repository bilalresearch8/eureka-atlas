# Eureka Atlas v20 — Industrial evidence reference and privacy-first Gemini handling

Release date: 2026-11-01

## Visible scientific capability
- New **Industrial reference explorer** directly beneath the Electrochemical Benchmark Lab. It works without a Gemini key and shows a clean, interactive bar visualization comparing a scientist-entered numerical result with a published U.S. DOE 2026 technical target.
- Three distinct, sourced electrolyzer architectures: low-temperature PEM, liquid alkaline and high-temperature solid-oxide electrolysis. Metric menus distinguish current density at a particular cell voltage, stack versus complete-system electric consumption, stack operating lifetime, stack degradation, and PEM total PGM loading. High-temperature electrical-only consumption is explicitly **not** represented as total energy including heat.
- Uses six 2026 PEM targets, five alkaline targets and four solid-oxide targets from the corresponding official U.S. DOE technical target tables.
- Numeric comparisons only receive a provisional meets/falls-short label when the scientist explicitly attests to equivalent technology, operating point, stack/system boundary, denominator and durability definition **and** enters an evidence location. Without both, the graph remains an unverified illustrative numeric comparison.
- Lists the full set of DOE 2026 target data and each metric’s comparison basis. Links point directly to DOE, never to AI-generated targets. A single target cannot certify total stack or system commercialization readiness.
- Selected 12/36/60/120-month search horizons now control the conservative Crossref metadata-only comparator fallback; incomplete/out-of-range publication dates are excluded locally and the date window is surfaced in the user-facing fallback result.
- Corrects UTC month-end subtraction in date ranges (31st to last day of shorter month).

## Behind-the-scenes privacy improvement
Google’s Gemini API change on October 26, 2026 turned optional GenerateContent request storage on by default for newly created paid projects. The application now explicitly sends `store=false` for every Interactions request (including PDF analysis) and GenerateContent REST fallback. It does not claim that content is never processed or that other retention policies do not apply. Browser UI, README and PRIVACY.md explicitly disclose the distinction. Stateless calls do not use server-stored conversation history.

## Validation and release safety
- New deterministic regression tests check DOE reference identities and exact numerical constants, directional comparisons, conditional pass labels, missing citations, invalid values, 12-month search filtering, and UTC month-end boundaries.
- Existing strict DOI/title/date, no-fabricated-metrics and Gemini quota-fallback tests remain active.
- PR and deployment test workflows now include the v20 JavaScript assets and regression test.
- Service-worker cache version is incremented and includes both new assets.

## Web verification in October 25–November 1, 2026
- Gemini release notes announced October 26 paid-tier GenerateContent logging changes, October 27 Gemini API CLI beta, and October 30 Computer Use GA. Logging controls matter directly to the paper/PDF assistant; CLI and Computer Use do not justify untested API migrations.
  - https://ai.google.dev/gemini-api/docs/changelog
  - https://ai.google.dev/gemini-api/docs/logs-datasets
- U.S. DOE published separate 2026 engineering targets for low-temperature PEM, liquid alkaline and high-temperature water electrolysis. These are **guideposts**, with multiple stack and system requirements that must be met together, not certification metrics.
  - https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis
  - https://www.energy.gov/cmei/fuels/technical-targets-liquid-alkaline-electrolysis
  - https://www.energy.gov/cmei/fuels/technical-targets-high-temperature-electrolysis
- Recent published research was inspected (including Nature Energy, October 29) to check publication-date relevance, but papers were **not** inserted into benchmark rankings without exact journal/DOI/date and topic qualification:
  - https://www.nature.com/articles/s41560-026-02162-y

## Remaining limitations
- No new Gemini API-key integration smoke test was possible without a user key. Tests and GitHub Pages compilation are distinct from live Gemini success.
- DOE references apply to **water electrolysis only**. They cannot stand in for independent industrial targets for CO2 electrolysis, batteries, supercapacitors or other electrochemical processes.
- Attested measurements are **user-reported**. The app does not independently check a figure, data processing, cell boundary or protocol from user text. Industrial benchmarking remains conditional.
- Crossref DOI identity metadata does not independently verify reported scientific performance.
