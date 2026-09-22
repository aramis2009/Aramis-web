# Aramis Berton_

Personal site. Minimal, monospace, dark by default, and a little glitchy.

Plain HTML, CSS and JavaScript: no framework, no build step, no dependencies.

## Features

- **Glitch text.** The name flips to `GOAT` and the city flips to `Soon → San Francisco, USA` every few seconds, with a color-split effect.
- **Encrypted copy.** Body text loads scrambled and decodes word by word as it scrolls into view.
- **Link glitch.** Links glitch in gold and purple on hover or keyboard focus.
- **GitHub contributions in ASCII.** The last year of contributions is drawn with `░ ▒ ▓ █` characters, loaded live, and glitches about every 20 seconds.
- **Last commit.** A small label shows how long ago the last commit was.
- **Copy email.** Clicking the email link copies the address and shows a small confirmation.
- **Light / dark theme.** Dark by default. The toggle remembers each visitor's choice.
- **Accessible.** Screen readers get the real text, and every animation turns off with `prefers-reduced-motion`.

## Structure

```
index.html   content
styles.css   design, colors, effects
script.js    glitch, text decoding, contributions graph, theme
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Customize

| What | Where |
|---|---|
| Text and links | `index.html` |
| Glitch alternate text | `data-alt="..."` on any `data-glitch` element in `index.html` |
| GitHub user for the graph | `data-user="..."` on `#contrib` in `index.html` |
| Colors | CSS variables at the top of `styles.css` (`--gold`, `--purple`, `--c0`–`--c4`) |
| Glitch colors | `GLITCH_COLORS` and `LINK_COLORS` in `script.js` |
| Graph glitch interval | `glitchLoop` in `script.js` |

## Deploy

It's a static site, so any static host works. On Vercel, import the repo with the **Other** preset and no build settings. Every push to `main` redeploys it.

## Credits

- Font: [Geist Mono](https://vercel.com/font) via Google Fonts
- Contribution data: [github-contributions-api](https://github.com/grubersjoe/github-contributions-api) by grubersjoe
- Last commit time: the GitHub public events API
