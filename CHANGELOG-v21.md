# Eureka Atlas v21 — First-principles electrochemical scale-up studio

Release review: 2026-11-08. Scientific and API review window: 2026-11-01 through 2026-11-08.

## Production improvements
- Adds a new prominent **Electrochemical Scale-up Studio** linked from the primary navigation and front page, directly after the industrial benchmark explorer.
- Computes non-AI, deterministic process outputs for three pathways:
  1. **Hydrogen electrolysis:** H₂ kg/day from current density, active area per series cell, series-cell count, H₂ Faradaic efficiency, uptime and voltage. Calculates rated stack power, stack kWh/day, stack kWh/kg H₂, and area per cell required for an optional target. Optional separately measured BoP kWh/kg may be added without inferring missing auxiliaries.
  2. **CO₂ electroreduction to CO:** CO kg/day and stack electricity from the 2-electron CO pathway, CO Faradaic efficiency and cell voltage. Shows stoichiometric CO₂ mass consumed and, only when supplied, the single-pass CO₂ inlet equivalent. Does not infer conversion efficiency from FE.
  3. **Lithium membrane recovery:** Feed Li kg/day, membrane-flux ceiling, deliverable elemental Li kg/day, active membrane area needed for a selected recovery target and lithium carbonate equivalent mass (not actual product yield). Inputs include measured net lithium flux, area, feed flow/concentration, recovery and uptime.
- Displays responsive charts of theoretical versus realized daily production (H₂/CO), or feed versus flux ceiling versus recoverable mass (Li).
- Exports an explicitly labeled JSON engineering calculation with user-provided operating inputs and CODATA constants; it is not an independent measurement or qualification.
- Requires no Gemini key or third-party network requests for calculations. The service worker precaches both new assets.
- Preserves the v20 source-verified scholarly discovery and strictly evidence-labeled literature and industrial benchmark workflows.

## Scientific integrity
- Uses Faraday constant F = 96,485.33212 C/mol, H₂ molar mass 2.01588 g/mol, CO molar mass 28.0101 g/mol, dissolved elemental lithium molar mass 6.94 g/mol, and 73.89/(2×6.94) lithium-to-LCE mass ratio.
- H₂/CO stack electricity: P_stack = N_series × current_density × active_area_per_cell × cell_voltage.
- Product mass per day: N_series × current_density × active_area_per_cell × 86,400 × uptime × FE × molecular_mass /(2×F).
- Lithium mass: feed_liters_per_hour × mg_Li_per_liter × 24 × uptime / 10^6; net flux capacity: measured_net_flux_mmol_per_m²h × membrane_m² × 24 × uptime × kg_Li_per_mmol. Recoverable lithium is capped by both feed-recovery target and measured flux ceiling.
- No purity, separation, feed contaminants, scaling loss, voltage losses, energy use for membrane recovery, economic performance, stack thermal integration, fouling, or environmental impact is invented.
- Clear disclosure: **source constants are grounded, user operating data remain unverified**.

## Verification
- New deterministic tests cover hydrogen/CO Faraday-law balance, operating efficiency, cell-series scaling, lithium mass balance and both flux-limited and target-recovery-limited cases, invalid inputs, zero production, and UI/service-worker asset binding.
- Updated pull-request CI checks JavaScript syntax and runs the new physics tests in addition to the existing DOI, date, quota, industry-target and source-integrity checks.
- API-key-dependent live Gemini integration remains untested without a user-provided key.

## Research and ecosystem review, November 1–8
- **Nature Energy, November 2:** Ding et al., "Stable anode-free sodium batteries enabled by controlled oligomerization," DOI 10.1038/s41560-026-02154-y. Abstract reports 300-mAh pouch cells, ~20 mg cm⁻² cathode loading, ~80% capacity after 1,400 cycles at 1C. Highlights why device geometry and realistic format cannot be discarded when comparing laboratory papers. https://www.nature.com/articles/s41560-026-02154-y
- **Nature Chemistry, November 4:** Wang et al., "Facet-dependent molecular adsorption modulates zinc anode work function for the favourable orientation of zinc electrocrystallization," DOI 10.1038/s41557-026-02291-7. Reports a descriptor evaluated across 29 additives with 93.1% prediction accuracy and testing up to 20 mA cm⁻²; underscores precise conditions in comparative claims. https://www.nature.com/articles/s41557-026-02291-7
- **Nature Chemistry, November 2:** Aschendorf et al., "Disentanglement of interfacial electric fields and electrochemical potential gradients reveals a multidimensional kinetic landscape," DOI 10.1038/s41557-026-02290-8. Shows why a single electrocatalytic overpotential may not fully describe kinetic behavior. https://www.nature.com/articles/s41557-026-02290-8
- **NIST/CODATA:** recommended fundamental-constant values inform Faraday-law calculations. https://physics.nist.gov/cuu/Constants/
- **DOE:** separately sourced 2026 PEM stack performance and efficiency guideposts remain in the industrial explorer, not treated as generic certification. https://www.energy.gov/cmei/fuels/technical-targets-proton-exchange-membrane-electrolysis
- Reviewed Crossref, OpenAlex, Semantic Scholar, Gemini documentation and USPTO/WIPO notices. No independently confirmed November 1–8 API breaking change justified a retrieval migration. An unrelated November 1 USPTO PCT search-fee change does not affect public DOI metadata retrieval.

## Remaining limitations
This is a first-principles steady-state calculator, not a full process simulator, technoeconomic or lifecycle analysis. Series-cell assumptions require identical operating current and area per cell. Lithium recovery assumes reported flux is net Li transport, sustained for the entire effective membrane area. Unmeasured flux decline and ionic selectivity are not modeled. No simulated figure or score should be represented as an experimental or certified industry outcome.
