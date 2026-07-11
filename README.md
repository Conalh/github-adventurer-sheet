# GitHub Adventurer Sheet

GitHub Adventurer Sheet turns a public GitHub profile into an original fantasy RPG character page.

## Use

Run the app locally:

```sh
npm install
npm run dev
```

Open the printed local URL, then enter either a GitHub username or a GitHub profile URL.

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

`ConalH` is used only as the default demo profile. Any valid public GitHub username can be loaded.

## Data Source

The app uses the public GitHub REST API:

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
```

Repository pagination is handled up to 300 repositories. The app does not scrape GitHub HTML and does not require login.

This is a browser-only app, so it does not read `GITHUB_TOKEN`. Shipping a token in frontend code would expose it to users. A server-side proxy could add optional `GITHUB_TOKEN` support later if higher rate limits become necessary.

## Styling Note

The character page is RuneScape-inspired in the broad fantasy RPG sense, but it uses original CSS, layout, colors, and browser-rendered UI. It does not include RuneScape logos, sprites, fonts, icons, or ripped assets.

## Test

```sh
npm test
npm run build
```

Unit tests cover username/profile URL parsing, level scaling and clamping, combat level clamping, quest difficulty mapping, and missing repository fields.

