# Eureka Atlas v23 — Evidence Audit & Offline Reliability
**Release candidate:** November 22, 2026

## Research-value improvement
- Adds a no-key **Evidence and comparability audit** below Evidence Plots. Each displayed paper receives a traceable audit of DOI/title identity verification, exact evidence location, study configuration, metric normalization, and reporting completeness.
- Compares every observation with a selectable anchor. Explicitly names mismatched cell configurations, area/mass normalization, metrics, technology families, or operating protocols. A matching *declared* protocol is a **candidate for expert review**, not a numerical state-of-the-art claim.
- Domain-specific prompts cover temperature, electrode/loading, electrolyte, feed, flow, cycling, current density and other context across hydrogen, CO₂RR, batteries, fuel cells, mineral recovery, and metal finishing. Prompts identify missing details **in the saved summary only**, not gaps proven in the paper.
- Adds downloadable audit JSON linking every observation to its DOI and preserving identified blockers without inventing experimental measurements or industrial thresholds. All underlying observations stay local to the visitor's browser.

## Reliability fix
- Fixed service-worker installation failures caused by referencing missing PNG icons in the pre-cache. Added a real vector site icon and switched the web manifest to it.
- Precache entries now correspond to actual tracked files. Offline navigation can use the cached main page; offline JS/CSS no longer receives HTML as an invalid fallback. Only successful same-origin responses are cached.
- Removed broken preview-image links rather than claiming social media images exist. The app still needs a network connection for scholarly APIs and source verification.

## Scientific and API review (November 15–22, 2026)
- Nature Catalysis published a November 19, 2026 Research Highlight about IrCu aerogel PEM water oxidation (DOI: 10.1038/s41929-026-01647-z), which directs readers to the original Energy & Environmental Science research, DOI: 10.1039/d6ee04327e. Critically, higher initial mass activity did not imply superior stability before passivation. This motivates comparative durability and protocol evidence checks, not a universal new benchmark. The highlight is **not** misrepresented as the original experimental paper.
- Nature Communications article-in-press (online November 18, 2026), DOI 10.1038/s41467-026-79335-6, on Li–O₂ battery catalytic pathways illustrates the need to distinguish reaction pathways and device test conditions before comparison.
- Reviewed Google's current Gemini rate-limit documentation: project-level RPM, TPM, RPD, spend caps and separate tool limits can all cause 429 responses. Retained existing verified fallback safeguards; no unsupported model/endpoint change shipped.
- Crossref, OpenAlex, Semantic Scholar, and patent provider behavior were considered; no unverified API claims or new study records introduced.

## Tests and limitations
- New Node regression tests check the domain audit and comparisons, plus the service-worker precache against tracked files and offline fallback behavior.
- Existing strict source/date, regression, scale-up, and visualization tests remain mandatory in both pull request and deploy workflows.
- AI-extracted numerical values remain unverified. Crossref identity checking does not validate scientific measurements, and an audit finding is a screening prompt, not a final scientific quality judgment.
- SVG-only installed-app icons may not satisfy older mobile platforms. Future raster assets should be generated from a reviewed vector master without lowering scientific evidence standards.

## Rollout
Release branch → automated tests → pull request review/check → merge → GitHub Pages deployment verification. No version-only release.
