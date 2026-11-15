# Eureka Atlas v22 — Evidence Plots and scientific comparability
Release prepared: 15 November 2026

## Major visible feature
**Evidence Plots** is a dedicated no-key visualization workspace for source-linked experimental performance measurements. Scientists and industrial engineers can choose a technology (water electrolysis, CO₂ electroreduction, batteries, fuel cells, metal extraction, surface finishing, or other electrochemistry), select a domain-relevant metric, and plot multiple reported study results on a shared numerical scale. Each observation stores DOI, cited figure/table/page, cell configuration, normalization basis, full stated test conditions, and a clearly labeled evidence provenance. Users can select a comparison anchor, inspect each observation, export a traceable JSON dataset, and manage locally saved records.

## Scientific and engineering safeguards
- Strict canonical unit conversion only: e.g. A/cm² ↔ mA/cm²; mV ↔ V; Ah/cm² ↔ mAh/cm²; Wh/kg ↔ kWh/kg; days ↔ hours. Unknown units, numeric ranges, approximations, NaN, Infinity and unphysical efficiency over 100% are rejected rather than silently converted.
- Independent metric categories distinguish *partial* vs *total* current density and Coulombic vs Faradaic efficiency.
- Domain filters prevent comparing battery energy metrics as hydrogen-electrolyzer metrics and vice versa.
- Candidate like-for-like status requires the **same domain, metric, explicitly declared configuration, normalization basis, and text-identical operating protocol**. Missing or incompatible contexts remain "comparison not established." A match remains user-declared, not independently certified.
- Crossref verification authenticates DOI metadata and may supply official title, journal, and complete publication date. It cannot authenticate an extracted numerical measurement. AI-derived values imported from saved deep analyses are always labeled **AI-extracted, not independently verified**.
- Only exact scalar numeric values with acceptable unit text are imported. Metadata-only papers never fabricate performance data.
- Inputs remain private to the user's browser; export JSON is available. A maximum of 120 stored points and 12 chart points per metric prevent unbounded UI or storage growth.

## Reliability and quality improvements
- New independently testable evidence engine and style sheet included in service-worker shell cache v22, allowing repeat visits without adding an AI-key requirement.
- Production GitHub Pages workflow now runs the preexisting v21 first-principles scale-up tests as well as the new evidence normalization/provenance suite. This closes a deployment verification gap in v21.
- Responsive chart and evidence-detail layout, keyboard controls, explicit status messages, source links, and adaptive top navigation.
- Existing strict publication-date and exact-journal verification paths remain unchanged.

## Scientific and source review: November 8–15, 2026
- *Nature Catalysis*, **10 November 2026**: "Benchmarking mechanistic credibility in electrocatalysis through data-driven evaluation" (Perspective), https://doi.org/10.1038/s41929-026-01631-7. Relevance: consistent conditions, calibrated evidence strength, quantified uncertainty and interlaboratory validation; **not an original experimental performance benchmark**.
- *Nature*, **11 November 2026**: "Non-halogen aqueous electrolytes for four-electron iodine conversion," https://doi.org/10.1038/s41586-026-11282-0. Relevance: mixed metal/iodine chemistries and electrolyte conditions require rigorous comparison-context labeling.
- *Nature Materials*, **12 November 2026**: "Proximal redox coupling enables oxidation damping for stable water electrolysis," https://doi.org/10.1038/s41563-026-02783-4. Relevance: mechanistic claims are different evidence from system-level durability or industrial readiness.
- *Nature Communications*, **12 November 2026**: "Cobalt based anode for highly stable alkaline water electrolysis under operation conditions beyond industrial requirements," https://doi.org/10.1038/s41467-026-79537-y. Publisher abstract reports an alkaline-electrolysis durability run exceeding 8,000 hours at 1 A/cm², 6 M NaOH and 80 °C. This did **not** get automatically labeled equivalent to a stack lifetime or DOE qualification because the system-level basis must be verified.
- Crossref Works API remains available for bibliographic DOI identity checks (https://api.crossref.org). No independently verified November 8–15 breaking change to Crossref, OpenAlex, Semantic Scholar or Gemini endpoints was identified; no speculative API migrations were made.

## Known limitations
The chart visualizes precisely what the researcher enters or has extracted; it does **not** independently verify numerical values from full text, nor is a shared metric axis a proof of matched materials, feed composition or operating history. No claim of verified state of the art, TEA, industrial certification or new foundation-model training is made. These are the next research-engine challenges.
