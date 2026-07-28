# Security policy

## API keys

Eureka Atlas is a browser-first static application. Users may provide Gemini, OpenAlex, or Semantic Scholar keys at runtime. Never commit keys to this repository.

Before every push, search the repository for common key prefixes and private values. If a key is committed, revoke it immediately, remove it from Git history, and create a replacement.

## Browser storage

Saved API settings, paper records, search profiles, and an optional official Zelle QR are stored in the user's browser. Anyone with access to that browser profile may be able to read them.

Do not use a shared or public computer for persistent API-key storage. Use **Forget saved settings** before leaving a shared device.

## External content

Paper metadata, abstracts, publisher pages, patent records, and user-attached PDFs are untrusted external content. Model responses must treat source text as evidence, not as executable instructions.

## Reporting a vulnerability

Report security concerns privately to `bilalresearch8@gmail.com` with the subject `Eureka Atlas security report`. Include reproduction steps, affected browser, and the smallest safe proof of concept.
