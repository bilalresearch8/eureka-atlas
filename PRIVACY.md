# Privacy notice

Eureka Atlas is delivered as a static web application.

## Data stored in the browser

The application may store:

- selected topics, keywords, journals, and patent sources;
- optional API keys when the user explicitly saves settings;
- the local research-paper and patent database;
- current interface preferences;
- an optional official Zelle QR image uploaded by the project owner.

This data is stored in IndexedDB or localStorage within the browser profile and is not uploaded to the GitHub repository.

## External services

Searches and analysis may send queries, DOI metadata, URLs, abstracts, patent terms, and user questions to services selected by the user, including Crossref, OpenAlex, Semantic Scholar, Gemini, Google Patents, USPTO, WIPO PATENTSCOPE, Espacenet, and Unpaywall.

An attached paper PDF is transmitted to Gemini only when the user initiates an analysis or submits a question in full-paper mode. The PDF is held in browser memory and is not stored in the Eureka Atlas research database.

## Gemini request logging and third-party handling (October 2026)

Google changed the Gemini GenerateContent API default on **October 26, 2026**: newly created paid-tier API projects may store request logs unless the caller opts out. Eureka Atlas now sends `store=false` on each Gemini Interactions and GenerateContent request, including PDF analysis. This asks Google not to retain those requests in the optional Gemini Logs and Datasets feature. It does **not** prevent Google from receiving and processing the content and does not override its separate terms, safety systems, abuse monitoring, or other retention policies. Stateless Interactions requests do not use server-stored previous interaction histories.

Users should not upload unpublished, confidential, proprietary, patent-sensitive, or third-party-restricted manuscripts without authorization. Metadata-only Crossref comparison and the official DOE industrial reference explorer work without sending PDFs to Gemini.

Google source: https://ai.google.dev/gemini-api/docs/logs-datasets (updated October 26, 2026).

## Public contact information

The deployed page contains public collaboration and support contact details. Publishing the site makes those details visible to visitors and search engines.
