# GitHub Adventurer Sheet

GitHub Adventurer Sheet turns any public GitHub profile into an original fantasy
RPG character page — a gilded trading card, ten skills, rarity-tiered relics, a
hall of achievements, and a quest log, all computed deterministically from real
public data.

## Features

- **Adventurer trading card** — combat level, total level, class, and primary
  stats on a gold parchment card with an ambient foil sheen and a subtle 3D
  tilt that follows the pointer.
- **Ten skills (1–99)** — Attack, Strength, Defence, Ranged, Magic, Crafting,
  Mining, Smithing, Prayer, and Hitpoints, each derived from a different
  signal in the profile (original repos, stars earned, account age, languages
  spoken, and so on). Skills at 99 glow.
- **Equipment with rarity tiers** — the most starred work becomes a Blade, the
  most forked an Aegis, the most recent a Signet, plus a Cape woven from
  account age and an Amulet attuned to the dominant language. Every relic is
  rated Common → Uncommon → Rare → Epic → Legendary.
- **Hall of Deeds** — fourteen achievements (Starfall, Polyglot, Fork Lord,
  Keeper of the Flame, …) with earned/locked medallions and live progress
  bars.
- **Quest log** — top repositories ranked by stars, forks, and recency, with
  difficulty gems from Novice to Master and per-language colors.
- **Shareable routes** — every character lives at `/character/{username}`, and
  a Share button copies the link.

Everything is deterministic: the same profile always rolls the same hero.

## Use

Run the app locally:

```sh
npm install
npm run dev
```

Open the printed local URL, then enter either a GitHub username or a GitHub
profile URL.

Example route:

```text
/character/ConalH
```

Accepted inputs include:

```text
ConalH
@ConalH
github.com/ConalH
https://github.com/ConalH
https://www.github.com/ConalH
```

`ConalH` is used only as the default demo profile. Any valid public GitHub
username can be loaded.

## Data Source

The app uses the public GitHub REST API:

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
```

Repository pagination is handled up to 300 repositories, and results are
cached in `localStorage` for ten minutes. The app does not scrape GitHub HTML
and does not require login.

This is a browser-only app, so it does not read `GITHUB_TOKEN`. Shipping a
token in frontend code would expose it to users. A server-side proxy could add
optional `GITHUB_TOKEN` support later if higher rate limits become necessary.

## Styling Note

The character page is RuneScape-inspired in the broad fantasy RPG sense, but
it uses original CSS, layout, colors, and browser-rendered UI. Typefaces
(Cinzel, Cinzel Decorative, Alegreya) are bundled from open-license Fontsource
packages; every icon is hand-drawn inline SVG. It does not include RuneScape
logos, sprites, fonts, icons, or ripped assets. Ambient animation honors
`prefers-reduced-motion`.

## Test

```sh
npm test
npm run build
```

Unit tests cover username/profile URL parsing, level scaling and clamping,
combat level clamping, quest difficulty mapping, equipment naming and rarity
tiers, achievement progress, and missing repository fields.
