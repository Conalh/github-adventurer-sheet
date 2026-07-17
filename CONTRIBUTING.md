# Contributing

Thanks for helping improve GitHub Adventurer Sheet.

## Local setup

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Before opening a pull request, run:

```sh
npm test
npm run build
```

## Project boundaries

- Keep profile-to-character results deterministic.
- Read only public GitHub data; never place API tokens in browser code.
- Preserve graceful handling for missing profile and repository fields.
- Keep character routes directly loadable at `/character/{username}`.
- Use original CSS, SVG, and permissively licensed assets. Do not add copied
  game art, audio, logos, or other proprietary assets.
- Add or update tests when changing scoring, classification, caching, routing,
  or interactive behavior.

Small, focused pull requests are easiest to review. Explain any visible scoring
change because it can alter existing shared character sheets.
