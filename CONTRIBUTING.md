# Contributing

## Before making changes

1. Create a branch from `main`.
2. Do not add API keys, private PDFs, paid publisher content, or personal research databases.
3. Keep source verification strict; do not loosen exact journal matching to increase result counts.
4. Preserve evidence discipline: unavailable quantitative values must not be invented.

## Testing checklist

- Load the site through an HTTP server or GitHub Pages.
- Verify topic and journal editing.
- Run a narrow-date paper search.
- Confirm similarly named journals are rejected.
- Confirm a second search skips previously saved records when configured.
- Test CSV and PDF exports.
- Test the Atlas assistant with and without a PDF.
- Test mobile layout and keyboard navigation.
- Confirm the browser console has no uncaught errors.

## Pull requests

Describe the problem, the retrieval or analysis behavior changed, test evidence, and any external API assumptions. Changes that affect ranking, TRL, quantitative extraction, or journal identity should include a controlled test case.
