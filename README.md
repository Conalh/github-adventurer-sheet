# GitHub Adventurer Sheet

Enter thy GitHub name to play.

GitHub Adventurer Sheet renders any public GitHub profile as an old-school
MMO character — inside a loving, fan-made parody of the classic RuneScape
game client. Stone-framed game window, a skills tab with `58/99` cells and
authentic experience numbers, a worn-equipment cross, a quest journal on
parchment, a deed diary, and a chatbox that congratulates you on your level.

Every number is computed deterministically from real public data: the same
profile always rolls the same hero.

## The client

- **Viewport** — your avatar standing in a dusk meadow, pixelated like a
  game character, with your bio as overhead chat, your name and combat level
  in right-click-menu style, and a decorative minimap.
- **Skills tab** — ten skills (Attack, Strength, Defence, Ranged, Magic,
  Crafting, Mining, Smithing, Prayer, Hitpoints), each levelled 1–99 from a
  different signal in the profile (original repos, stars earned, account
  age, languages, followers, …). Hovering a skill shows its experience on
  the *genuine* RuneScape XP table — level 99 is exactly 13,034,431 XP —
  and clicking reports it to the chatbox.
- **Worn equipment** — your most starred repo becomes a Blade, your most
  forked an Aegis, your most recent a Signet, plus a Cape woven from account
  age and an Amulet attuned to your dominant language. Rarities run Common →
  Legendary; legendary items glow. Click anything to examine it.
- **Quest journal** — top repositories as quests with difficulty colours and
  quest points; opening one unrolls a parchment journal page.
- **Deed diary** — fourteen achievements in diary style: green and ticked
  when complete, red with live progress when not.
- **Chatbox** — welcome message, level-up congratulations, deed broadcasts,
  and examine text. The Share button copies a link to the sheet.

Character pages live at `/character/{username}` and are shareable.

## Use

```sh
npm install
npm run dev
```

Open the printed local URL, then enter a GitHub username or profile URL.
Accepted inputs include:

```text
ConalH
@ConalH
github.com/ConalH
https://github.com/ConalH
https://www.github.com/ConalH
```

`ConalH` is only the default demo profile. Any valid public GitHub username
can be summoned.

## Data source

The app uses the public GitHub REST API:

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
```

Repository pagination is handled up to 300 repositories, and results are
cached in `localStorage` for ten minutes. No scraping, no login, no
tracking.

This is a browser-only app, so it does not read `GITHUB_TOKEN` — shipping a
token in frontend code would expose it. A server-side proxy could add
optional token support later if rate limits become a problem.

## Parody & assets note

This is a fan-made parody. It is not affiliated with, endorsed by, or
connected to Jagex or RuneScape in any way. **No game assets are used**:
every panel, border, icon, and scene is original CSS and hand-drawn inline
SVG, and the typefaces are open-licensed lookalikes — Pixelify Sans for UI
text, Jacquard 12 for the wordmark, and a digits-only subset of VT323
(bundled in `src/assets`, OFL license alongside) so that stats stay
legible. The experience table formula is the community-documented curve.

## Test

```sh
npm test
npm run build
```

Unit tests cover username/profile URL parsing, level scaling and clamping,
the RuneScape experience table, score-to-XP interpolation, combat level
clamping, quest difficulty mapping, equipment naming and rarity tiers,
achievement progress, and missing repository fields.
