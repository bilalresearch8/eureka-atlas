# Eureka Atlas

**Research and patent intelligence for scientists, engineers, builders, founders, investors, and R&D leaders.**

Eureka Atlas searches exact elite journals and patent sources, verifies publication dates, ranks unseen records, extracts quantitative evidence, identifies scale-up risks, and stores every delivered result in a local no-repeat research database.

![Eureka Atlas interface](assets/eureka-atlas-preview.png)

## What it does

- Searches selected journals by verified ISSN and exact-title fallback.
- Supports editable research themes and keywords.
- Searches US and worldwide patents with date-controlled links and optional Gemini rescue.
- Enforces strict journal identity so similarly named journals are not substituted.
- Extracts field-specific quantitative metrics and commercialization implications.
- Generates scale-up challenges, recommended validation experiments, and best-fit beneficiaries.
- Stores delivered papers and patents in IndexedDB so future searches skip duplicates.
- Exports readable multi-page PDF reports and CSV datasets.
- Accepts a paper PDF for full-paper Gemini analysis of text, figures, tables, methods, and evidence.
- Runs as a static browser application; no server is required for the core interface.

## Quick start

1. Open `index.html`, or publish the repository with GitHub Pages.
2. Press **Apply recommended setup**.
3. Review the selected topics, keywords, journals, patents, and date range.
4. Press **Run frontier search**.
5. Add optional API keys only for deeper indexes, patent rescue, and full-paper analysis.

## GitHub Pages deployment

This repository includes `.github/workflows/pages.yml`. After the files are pushed:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Open the **Actions** tab and wait for **Deploy Eureka Atlas to GitHub Pages** to finish.
5. The published URL appears in the deployment summary and in **Settings → Pages**.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for browser, command-line, and GitHub Desktop instructions.

## API keys and privacy

- No API key is embedded in this repository.
- User-entered keys are stored only in that user's browser when **Save research settings** is selected.
- Never paste a real API key into `index.html`, README files, Git commits, issues, or screenshots.
- Search history and the research database are stored locally in the browser using IndexedDB or localStorage.
- Attached PDFs are held in browser memory and sent to Gemini only when a question is submitted.
- The site does not bypass publisher paywalls.

Read [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md) before public deployment.

## Repository structure

```text
.
├── index.html                     Main application
├── manifest.webmanifest           Installable web-app metadata
├── sw.js                          Offline application-shell cache
├── assets/
│   ├── icons/                     App and browser icons
│   └── eureka-atlas-preview.png   README preview
├── .github/workflows/pages.yml    GitHub Pages deployment
├── docs/DEPLOYMENT.md             Publishing instructions
├── SECURITY.md                    Key and vulnerability guidance
├── PRIVACY.md                     Browser-data and external-service disclosure
└── CONTRIBUTING.md                Contribution workflow
```

## Browser support

Use a current version of Chrome, Edge, Firefox, or Safari. Chromium-based browsers provide the most consistent PDF export, IndexedDB, and installable-app behavior.

## Important operating limits

Eureka Atlas depends on external scholarly and patent services. Results can be affected by source metadata quality, API quotas, indexing delay, CORS policy, temporary outages, and the user's API plan. The coverage audit distinguishes successful retrieval, a valid search with no qualifying results, and a temporarily paused fallback route.

Deep analysis must not fabricate unavailable evidence. Metrics not supported by accessible source text should remain marked as not reported or require verification from the paper or patent.

## Public contact and support information

The footer intentionally publishes the collaboration and Zelle details requested by the project owner. Remove or replace those fields before publishing if they should not be public.

## Ownership and licensing

Copyright © 2026 Muhammad Bilal. No open-source license is included in this package. Public availability of the repository does not itself grant permission to copy, modify, or redistribute the code. Add an explicit license before accepting code reuse outside the project.
