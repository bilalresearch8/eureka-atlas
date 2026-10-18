# Eureka Atlas v18 — Benchmark Lab and quantitative evidence

## Visible product changes
- Adds a dedicated **Electrochemical Benchmark Lab** where a scientist can paste a DOI/title/abstract or attach a paper PDF and compare the study against verified state-of-the-art literature.
- Adds domain presets for batteries, water electrolysis, CO₂ electrolysis, fuel cells, redox-flow batteries, general electrocatalysis, and corrosion/electrodeposition/anodizing.
- Adds a metric-by-metric comparison table showing the user's result, best verified literature comparator, test-condition comparability, gap, industrial target, and status.
- Adds an industrialization gap matrix covering durability, throughput, material intensity, safety, manufacturability, system integration, and other domain-specific scale-up constraints.
- Adds explicit missing-evidence and highest-value-next-experiment sections.
- Adds JSON export for benchmark studies.
- Adds visible count of source-grounded quantitative measurements in deeply analyzed results.

## Scientific-depth changes
- Deep analysis can now extract up to **12 additional quantitative measurements** per record instead of being limited to the three topic guide metrics.
- Each quantitative measurement retains value, unit, test conditions, measurement basis, comparator, uncertainty, evidence location, and source URL when available.
- Benchmark comparisons are condition-aware: three-electrode vs device, half-cell vs full-cell, geometric vs ECSA normalization, catalyst loading, active area, temperature, pressure, feed composition, and other reporting bases are treated as potentially non-comparable.
- Comparator papers must have a DOI and exact title that independently match Crossref metadata before they are displayed as verified comparators.
- Academic state of the art and industrial requirements are reported separately rather than collapsed into one score.
- Missing numbers remain missing; the engine is instructed not to estimate absent values.

## Architecture note
Eureka Atlas v18 does **not** claim to have trained a foundation model on every electrochemical paper. The browser application instead uses live retrieval, structured electrochemical metric ontologies, authoritative DOI identity checks, the user's PDF when supplied, and evidence-grounded comparison. This is auditable and can stay current without retraining model weights.

## Validation
- Inline application JavaScript compiles after the v18 patch.
- Benchmark Lab JavaScript compiles independently.
- Service-worker shell includes index.html, benchmark-lab.js, and benchmark-lab.css under a new v18 cache key.
- Regression tests cover required Benchmark Lab UI anchors, electrochemical schemas, strict DOI comparator verification, quantitative-evidence fields, v18 versioning, and service-worker assets.
